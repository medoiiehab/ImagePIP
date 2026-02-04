import { NextRequest } from 'next/server';
import { authenticateRequest, successResponse, errorResponse, checkRole } from '@/lib/auth/middleware';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const { valid, user, error } = authenticateRequest(request);

  if (!valid || !user) {
    return errorResponse(error || 'Unauthorized', 401);
  }

  if (!checkRole(user, ['admin', 'client'])) {
    return errorResponse('Forbidden', 403);
  }

  try {
    const { searchParams } = new URL(request.url);
    const schoolUuid = searchParams.get('schoolUuid');
    const status = searchParams.get('status');
    const migrated = searchParams.get('migrated');

    // Join with teams (acting as schools) to get school name
    let query = supabase
      .from('photos')
      .select(`
        *,
        schools:school_uuid (
          uuid,
          name
        )
      `)
    // Note: Relation name might need to be explicitly defined if Supabase doesn't auto-detect 'teams' as 'schools' alias.
    // But since we are looking up by school_uuid which references teams(uuid), we should use the actual table name 'teams'.
    // However, to keep frontend compatibility, we can alias it or update the frontend.
    // Let's update the query to reference 'teams' and map it manually.

    // Re-writing query properly:
    query = supabase
      .from('photos')
      .select(`
        *,
        teams:school_uuid (
          uuid,
          name
        )
      `)
      .order('created_at', { ascending: false });

    if (user.role === 'client' && user.schoolUuid) {
      query = query.eq('school_uuid', user.schoolUuid);
    } else if (schoolUuid && user.role === 'admin') {
      query = query.eq('school_uuid', schoolUuid);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (migrated !== null && migrated !== undefined) {
      const migratedValue = migrated === 'true';
      query = query.eq('migrated_to_google_drive', migratedValue);
    }

    const { data: photos, error: queryError } = await query;

    if (queryError) {
      console.error('Database error:', queryError);
      return errorResponse('Error fetching photos', 500);
    }

    // Transform photos to include school_name at top level
    const transformedPhotos = (photos || []).map((photo: any) => ({
      ...photo,
      school_name: photo.teams?.name || 'Unknown School',
    }));

    return successResponse({
      photos: transformedPhotos,
      total: transformedPhotos.length,
    });
  } catch (error) {
    console.error('Error fetching photos:', error);
    return errorResponse('Internal server error', 500);
  }
}

export async function POST(request: NextRequest) {
  const { valid, user, error } = authenticateRequest(request);

  if (!valid || !user) {
    return errorResponse(error || 'Unauthorized', 401);
  }

  if (!checkRole(user, ['client', 'admin'])) {
    return errorResponse('Not authorized to upload photos', 403);
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const schoolUuid = user.schoolUuid || formData.get('schoolUuid');

    if (!file) {
      return errorResponse('File is required');
    }

    if (!schoolUuid) {
      return errorResponse('School UUID is required. Please log in again.');
    }

    // Generate unique file path
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${schoolUuid}/${timestamp}-${safeName}`;

    // Upload file to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('photos')
      .upload(fileName, file);

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return errorResponse(`Storage error: ${uploadError.message}`, 500);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('photos')
      .getPublicUrl(fileName);

    // Create photo record in database
    const { data: newPhoto, error: insertError } = await supabase
      .from('photos')
      .insert({
        school_uuid: schoolUuid,
        user_id: parseInt(user.id),
        file_name: file.name,
        file_path: fileName,
        file_size: file.size,
        mime_type: file.type,
        status: 'pending',
        migrated_to_google_drive: false,
        metadata: {
          originalName: file.name,
          size: file.size,
          mimeType: file.type,
          publicUrl: urlData?.publicUrl,
        },
      })
      .select();

    if (insertError) {
      console.error('Insert error:', insertError);
      await supabase.storage.from('photos').remove([fileName]);
      return errorResponse(`Database error: ${insertError.message}`, 500);
    }

    return successResponse(
      {
        success: true,
        photo: newPhoto ? newPhoto[0] : null,
        message: 'Photo uploaded successfully',
      },
      201
    );
  } catch (error: any) {
    console.error('Error uploading photo:', error);
    return errorResponse(error?.message || 'Internal server error', 500);
  }
}
