import { NextRequest } from 'next/server';
import { authenticateRequest, successResponse, errorResponse, checkRole } from '@/lib/auth/middleware';
import { supabase } from '@/lib/supabase-server';

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
    console.log('[Upload] POST request received');

    const formData = await request.formData();
    console.log('[Upload] FormData keys:', Array.from(formData.keys()));

    const file = formData.get('file') as any;
    const schoolUuid = user.schoolUuid || formData.get('schoolUuid');

    console.log('[Upload] File received:', !!file, 'Type:', file?.type || 'unknown');
    console.log('[Upload] School UUID:', schoolUuid, 'User ID:', user.id);

    if (!file) {
      console.error('[Upload] NO FILE RECEIVED');
      return errorResponse('File is required');
    }

    if (!schoolUuid) {
      console.error('[Upload] NO SCHOOL UUID');
      return errorResponse('School UUID is required. Please log in again.');
    }

    // Ensure we have a binary Buffer for server-side upload
    let uploadPayload: Buffer | File | Blob = file;
    if (typeof file.arrayBuffer === 'function') {
      console.log('[Upload] Converting File to Buffer...');
      const arrayBuffer = await file.arrayBuffer();
      uploadPayload = Buffer.from(arrayBuffer);
      console.log('[Upload] Buffer created, size:', uploadPayload.length);
    } else {
      console.log('[Upload] File is already a Buffer or Blob, size:', file.size || 'unknown');
    }

    // Generate unique file path
    const timestamp = Date.now();
    const safeName = (file.name || `upload-${timestamp}`).replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${schoolUuid}/${timestamp}-${safeName}`;

    console.log(`[Upload] Starting upload for file: ${file.name}, path: ${fileName}, size: ${file.size}`);
    console.log('[Upload] Supabase URL configured:', !!process.env.SUPABASE_URL);
    console.log('[Upload] Supabase Key configured:', !!process.env.SUPABASE_ANON_KEY);

    // Upload file to Supabase Storage using server client
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('photos')
      .upload(fileName, uploadPayload, {
        contentType: file.type || 'application/octet-stream',
      });

    if (uploadError) {
      console.error('[Upload] STORAGE ERROR:', {
        message: uploadError.message,
        statusCode: (uploadError as any).statusCode,
        error: uploadError,
      });
      return errorResponse(`Storage error: ${uploadError.message} (${(uploadError as any).statusCode})`, 500);
    }

    console.log(`[Upload] File uploaded successfully:`, uploadData);

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('photos')
      .getPublicUrl(fileName);

    // Fetch school name and drive folder id from 'teams' table
    let teamData = null;

    try {
      const { data: teamInfo } = await supabase
        .from('teams')
        .select('name, google_drive_folder_id, uuid')
        .eq('uuid', schoolUuid)
        .single();

      if (teamInfo) {
        teamData = teamInfo;
      }
    } catch (err) {
      console.warn('Could not fetch team info for folder naming');
    }

    // Check for auto-approval setting
    let isAutoApproved = false;
    try {
      const { data: settings, error: settingsError } = await supabase
        .from('system_settings')
        .select('auto_approval')
        .eq('id', 1)
        .maybeSingle();

      if (!settingsError && settings) {
        isAutoApproved = settings.auto_approval || false;
      }
    } catch (err) {
      console.warn('Could not check auto_approval setting, defaulting to false');
    }

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
        status: isAutoApproved ? 'approved' : 'pending',
        approved_at: isAutoApproved ? new Date().toISOString() : null,
        approved_by: isAutoApproved ? parseInt(user.id) : null,
        migrated_to_google_drive: false,
        metadata: {
          originalName: file.name,
          size: file.size,
          mimeType: file.type,
          publicUrl: urlData?.publicUrl,
          autoApproved: isAutoApproved
        },
      })
      .select();

    if (insertError) {
      console.error('Insert error:', insertError);
      await supabase.storage.from('photos').remove([fileName]);
      return errorResponse(`Database error: ${insertError.message}`, 500);
    }

    const photoRecord = newPhoto?.[0];
    console.log(`[Upload] Photo record created in database: ${photoRecord?.id}`);

    // DRIVE MIGRATION for Auto-Approved photos
    if (isAutoApproved && photoRecord) {
      // Run migration in background (don't await to keep upload snappy)
      triggerDriveMigration(photoRecord, teamData);
    }

    return successResponse(
      {
        success: true,
        photo: photoRecord,
        autoApproved: isAutoApproved,
        message: isAutoApproved
          ? 'Photo uploaded and auto-approved!'
          : 'Photo uploaded successfully, pending approval',
      },
      201
    );
  } catch (error: any) {
    console.error('Error uploading photo:', error);
    return errorResponse(error?.message || 'Internal server error', 500);
  }
}

/**
 * Background Drive Migration for Auto-Approved Photos
 */
async function triggerDriveMigration(photo: any, team: any) {
  try {
    console.log('[Auto-Drive] Starting migration for auto-approved photo:', photo.id);
    const { uploadToGoogleDrive, findOrCreateFolder } = await import('@/lib/googleDrive');

    // Root Folder
    const rootFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    if (!rootFolderId) return;

    // Resolve Target Folder
    let targetFolderId = rootFolderId;
    if (team) {
      if (team.google_drive_folder_id) {
        targetFolderId = team.google_drive_folder_id;
      } else {
        const folderId = await findOrCreateFolder(team.name, rootFolderId);
        if (folderId) {
          targetFolderId = folderId;
          // Cache it
          await supabase.from('teams').update({ google_drive_folder_id: folderId }).eq('uuid', team.uuid);
        }
      }
    }

    // Download from Supabase
    const { data: fileData } = await supabase.storage.from('photos').download(photo.file_path);
    if (!fileData) return;

    const buffer = Buffer.from(await fileData.arrayBuffer());

    // Upload to Drive
    const driveData = await uploadToGoogleDrive(
      buffer,
      photo.file_name,
      photo.mime_type || 'image/jpeg',
      targetFolderId
    );

    if (driveData) {
      await supabase.from('photos').update({
        migrated_to_google_drive: true,
        google_drive_id: driveData.id
      }).eq('id', photo.id);
      console.log('[Auto-Drive] ✅ Auto-approved photo migrated to Drive successfully');
    }
  } catch (err) {
    console.error('[Auto-Drive] ❌ Migration failed:', err);
  }
}
