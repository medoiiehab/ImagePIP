import { NextRequest } from 'next/server';
import { authenticateRequest, successResponse, errorResponse, checkRole } from '@/lib/auth/middleware';
import { generateUUID } from '@/lib/auth/jwt';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const { valid, user, error } = authenticateRequest(request);

  if (!valid || !user) {
    return errorResponse(error || 'Unauthorized', 401);
  }

  if (!checkRole(user, ['admin'])) {
    return errorResponse('Only admins can view teams', 403);
  }

  try {
    // Fetch teams with their linked users via user_schools
    const { data: teams, error: queryError, count } = await supabase
      .from('teams')
      .select(`
        *,
        user_schools (
          user: users (
            id,
            uuid,
            role
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (queryError) {
      console.error('Database error:', queryError);
      return errorResponse('Error fetching teams', 500);
    }

    // Transform response to hoist users array
    const transformedTeams = (teams || []).map((team: any) => ({
      ...team,
      users: team.user_schools?.map((relation: any) => relation.user).filter(Boolean) || []
    }));

    return successResponse({
      teams: transformedTeams,
      total: count || 0,
    });
  } catch (error) {
    console.error('Error fetching teams:', error);
    return errorResponse('Internal server error', 500);
  }
}

export async function POST(request: NextRequest) {
  const { valid, user } = authenticateRequest(request);

  if (!valid || !user) {
    return errorResponse('Unauthorized', 401);
  }

  if (!checkRole(user, ['admin'])) {
    return errorResponse('Only admins can create teams', 403);
  }

  try {
    const body = await request.json();
    const { name } = body;

    if (!name) {
      return errorResponse('School name is required');
    }

    const teamUuid = generateUUID();

    const { data: newTeam, error: insertError } = await supabase
      .from('teams')
      .insert({
        uuid: teamUuid,
        name,
        created_by: parseInt(user.id),
      })
      .select();

    if (insertError) {
      console.error('Insert error details:', insertError);
      return errorResponse(`Failed to create team: ${insertError.message}`, 500);
    }

    return successResponse(
      {
        success: true,
        team: newTeam ? newTeam[0] : null,
        message: 'Team created successfully',
      },
      201
    );
  } catch (error: any) {
    console.error('Error creating team:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}
