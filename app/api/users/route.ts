import { NextRequest } from 'next/server';
import { authenticateRequest, successResponse, errorResponse, checkRole } from '@/lib/auth/middleware';
import { supabase } from '@/lib/supabase';
import { hashPassword } from '@/lib/auth/jwt';

export async function GET(request: NextRequest) {
  const { valid, user, error } = authenticateRequest(request);

  if (!valid || !user) {
    return errorResponse(error || 'Unauthorized', 401);
  }

  if (!checkRole(user, ['admin'])) {
    return errorResponse('Only admins can view users', 403);
  }

  try {
    const { searchParams } = new URL(request.url);
    const schoolUuid = searchParams.get('schoolUuid');

    // Fetch users with their linked schools
    let query = supabase
      .from('users')
      .select(`
        *,
        user_schools (
          school_uuid
        )
      `);

    if (schoolUuid) {
      // Filter by users belonging to a specific school
      // This requires a slightly different approach with inner join filtering in Supabase
      // strict filtering on the junction table:
      query = supabase
        .from('users')
        .select(`
          *,
          user_schools!inner (
            school_uuid
          )
        `)
        .eq('user_schools.school_uuid', schoolUuid);
    }

    const { data: users, error: queryError, count } = await query;

    if (queryError) {
      console.error('Database error:', queryError);
      return errorResponse('Error fetching users', 500);
    }

    // Transform users to flattened structure if needed (e.g. primary school)
    // Or just pass the array of schools
    const transformedUsers = (users || []).map((u: any) => ({
      ...u,
      schools: u.user_schools?.map((s: any) => s.school_uuid) || [],
      // Keep legacy support for single school view if needed
      schoolUuid: u.user_schools?.[0]?.school_uuid || null
    }));

    return successResponse({
      users: transformedUsers,
      total: count || 0,
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return errorResponse('Internal server error', 500);
  }
}

export async function POST(request: NextRequest) {
  const { valid, user } = authenticateRequest(request);

  if (!valid || !user) {
    return errorResponse('Unauthorized', 401);
  }

  if (!checkRole(user, ['admin'])) {
    return errorResponse('Only admins can create users', 403);
  }

  try {
    const body = await request.json();
    let { userUuid, schoolUuid, schools, role } = body;

    // Backward compatibility: If only schoolUuid provided, treat as single item array
    if (schoolUuid && (!schools || schools.length === 0)) {
      schools = [schoolUuid];
    }

    if (!schools || schools.length === 0 || !role) {
      return errorResponse('At least one School UUID and role are required');
    }

    // Auto-generate UUID if not provided (Start 1000, +5)
    if (!userUuid) {
      const { data: lastUsers } = await supabase
        .from('users')
        .select('uuid')
        .order('uuid', { ascending: false })
        .limit(1);

      if (lastUsers && lastUsers.length > 0) {
        const lastUuid = parseInt(lastUsers[0].uuid);
        userUuid = (lastUuid + 5).toString();
      } else {
        userUuid = '1000';
      }
    }

    // Verify all schools exist
    // Optimization: In clause check
    const { data: validTeams, error: teamError } = await supabase
      .from('teams')
      .select('uuid')
      .in('uuid', schools);

    if (teamError || !validTeams || validTeams.length === 0) {
      return errorResponse('Invalid School UUIDs provided', 400);
    }

    // Filter schools to only valid ones found in DB
    const validSchoolUuids = validTeams.map(t => t.uuid);

    // Default password is P{userUuid}
    const password = `P${userUuid}`;
    const password_hash = hashPassword(password);

    // Insert new user (without school_uuid)
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        uuid: userUuid,
        role,
        password_hash,
        created_by: parseInt(user.id),
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error details:', insertError);
      if (insertError.message.includes('duplicate')) {
        return errorResponse('User UUID already exists', 400);
      }
      return errorResponse(`Failed to create user: ${insertError.message}`, 500);
    }

    // Link user to multiple schools in user_schools table
    if (newUser && validSchoolUuids.length > 0) {
      const links = validSchoolUuids.map(uuid => ({
        user_id: newUser.id,
        school_uuid: uuid,
        assigned_by: parseInt(user.id),
      }));

      const { error: linkError } = await supabase
        .from('user_schools')
        .insert(links);

      if (linkError) {
        console.error('Failed to link user to schools:', linkError);
      }
    }

    // For response, we attach the schools for frontend consistency
    const userResponse = { ...newUser, schools: validSchoolUuids };

    // Duplicate insertError check removed (already checked above)

    return successResponse(
      {
        success: true,
        user: userResponse,
        generatedPassword: password,
        message: 'User created successfully',
      },
      201
    );
  } catch (error: any) {
    console.error('Error creating user:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}
