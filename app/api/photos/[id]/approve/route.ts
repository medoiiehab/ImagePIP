import { NextRequest } from 'next/server';
import { authenticateRequest, successResponse, errorResponse, checkRole } from '@/lib/auth/middleware';
import { supabase } from '@/lib/supabase-server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { valid, user, error } = authenticateRequest(request);

  if (!valid || !user) {
    return errorResponse(error || 'Unauthorized', 401);
  }

  if (!checkRole(user, ['admin'])) {
    return errorResponse('Only admins can approve photos', 403);
  }

  try {
    const photoId = id;

    // Fetch photo with its Team (School) context
    const { data: photo, error: fetchError } = await supabase
      .from('photos')
      .select(`
        *,
        teams:school_uuid (
          uuid,
          name,
          google_drive_folder_id
        )
      `)
      .eq('id', photoId)
      .single();

    if (fetchError || !photo) {
      return errorResponse('Photo not found', 404);
    }

    // Attempt migration to Google Drive
    const driveData = await migrateToDrive(photo);

    // Update photo status to approved AND store Drive link
    const updatePayload: any = {
      status: 'approved',
      approved_at: new Date().toISOString(),
      approved_by: user.id,
    };

    if (driveData) {
      updatePayload.migrated_to_google_drive = true;
      updatePayload.google_drive_id = driveData.id;
    }

    const { data: updatedPhoto, error: updateError } = await supabase
      .from('photos')
      .update(updatePayload)
      .eq('id', photoId)
      .select()
      .single();

    if (updateError) {
      console.error('Update error:', updateError);
      return errorResponse('Failed to approve photo', 500);
    }

    return successResponse({
      success: true,
      photo: updatedPhoto,
      driveStatus: driveData ? 'uploaded' : 'skipped/failed',
      driveFileId: driveData?.id || null,
      message: driveData
        ? `Photo approved and uploaded to Drive (ID: ${driveData.id})`
        : 'Photo approved (Drive migration skipped or failed)',
    });
  } catch (err: any) {
    console.error('Error approving photo:', err);
    return errorResponse(err.message || 'Internal server error', 500);
  }
}

/**
 * Migration Helper to avoid duplicate folders and handle Drive logic
 * Uses 'teams' table to cache folder IDs
 */
async function migrateToDrive(photo: any) {
  try {
    console.log(`[Drive] Migrating photo ${photo.id} belonging to school/team ${photo.school_uuid}`);

    // 1. Download file from Supabase Storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('photos')
      .download(photo.file_path);

    if (downloadError || !fileData) {
      console.error('[Drive] ❌ Failed to download from Supabase:', downloadError);
      return null;
    }

    const arrayBuffer = await fileData.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Import Drive utilities dynamically
    const { uploadToGoogleDrive, findOrCreateFolder } = await import('@/lib/googleDrive');

    const rootFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    if (!rootFolderId) {
      console.warn('[Drive] ❌ GOOGLE_DRIVE_FOLDER_ID not set in environment');
      return null;
    }

    // 2. Resolve Target Folder (Check Cache first)
    let targetFolderId = rootFolderId;
    const team = photo.teams;

    if (team) {
      if (team.google_drive_folder_id) {
        console.log('[Drive] 📁 Using cached folder ID for team:', team.name, team.google_drive_folder_id);
        targetFolderId = team.google_drive_folder_id;
      } else {
        console.log('[Drive] 📁 Folder not cached. Searching or creating for:', team.name);
        const folderId = await findOrCreateFolder(team.name, rootFolderId);

        if (folderId) {
          targetFolderId = folderId;
          // CACHE THE ID: Save it to the 'teams' table for future use
          const { error: patchError } = await supabase
            .from('teams')
            .update({ google_drive_folder_id: folderId })
            .eq('uuid', team.uuid);

          if (patchError) {
            console.error('[Drive] ⚠️ Failed to cache folder ID in teams table:', patchError);
          } else {
            console.log('[Drive] ✅ Folder ID cached successfully in teams table');
          }
        }
      }
    }

    // 3. Perform the actual upload
    const driveData = await uploadToGoogleDrive(
      buffer,
      photo.file_name,
      photo.mime_type || 'image/jpeg',
      targetFolderId
    );

    return driveData;
  } catch (error) {
    console.error('[Drive] Global migration exception:', error);
    return null;
  }
}
