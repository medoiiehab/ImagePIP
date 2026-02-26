import { NextRequest } from 'next/server';
import { authenticateRequest, successResponse, errorResponse, checkRole } from '@/lib/auth/middleware';
import { supabase } from '@/lib/supabase';

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

    const { data: photo, error: fetchError } = await supabase
      .from('photos')
      .select(`
        *,
        school:school_uuid (
          name
        )
      `)
      .eq('id', photoId)
      .single();

    if (fetchError || !photo) {
      return errorResponse('Photo not found', 404);
    }

    // NEW: Upload to Google Drive
    // 1. Download file from Supabase
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('photos')
      .download(photo.file_path);

    let driveData = null;
    let driveUploadError = null;

    if (!downloadError && fileData) {
      try {
        const arrayBuffer = await fileData.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Import dynamically
        const { uploadToGoogleDrive, findOrCreateFolder } = await import('@/lib/googleDrive');

        // Root Folder from Env
        const rootFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
        console.log('[Approve] Root Folder ID from env:', rootFolderId);
        
        if (!rootFolderId) {
          console.warn('[Approve] GOOGLE_DRIVE_FOLDER_ID not set in environment variables');
        }
        
        let targetFolderId = rootFolderId;

        // 2. Organize by School Name
        const schoolName = photo.school?.name || 'Uncategorized';
        console.log('[Approve] School Name:', schoolName);

        if (rootFolderId && schoolName) {
          console.log('[Approve] Creating/finding school subfolder:', schoolName, 'in parent:', rootFolderId);
          const subFolderId = await findOrCreateFolder(schoolName, rootFolderId);
          if (subFolderId) {
            console.log('[Approve] School subfolder created/found:', subFolderId);
            targetFolderId = subFolderId;
          } else {
            console.warn('[Approve] Failed to create/find school subfolder, using root folder');
          }
        }

        // 3. Upload to Target Folder
        console.log('[Approve] Uploading file to Drive. File:', photo.file_name, 'Size:', buffer.length, 'Target Folder:', targetFolderId);
        driveData = await uploadToGoogleDrive(
          buffer,
          photo.file_name,
          photo.mime_type || 'image/jpeg',
          targetFolderId
        );
        console.log('[Approve] Drive upload successful:', driveData?.id);
      } catch (err) {
        console.error('Drive upload failed:', err);
        driveUploadError = err;
        // We continue to approve even if drive fails, but we won't mark as migrated
      }
    } else {
      console.error('Failed to download from Supabase for Drive upload:', downloadError);
    }

    // Update photo status to approved AND Drive info
    const updatePayload: any = {
      status: 'approved',
      approved_at: new Date().toISOString(),
      approved_by: user.id,
    };

    if (driveData) {
      updatePayload.migrated_to_google_drive = true;
      updatePayload.google_drive_id = driveData.id;
      // Optionally store webViewLink in metadata if you want
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
      driveStatus: driveData ? 'uploaded' : (driveUploadError ? 'failed' : 'skipped'),
      driveFileId: driveData?.id || null,
      driveError: driveUploadError ? String(driveUploadError) : null,
      message: driveData
        ? `Photo approved and uploaded to Drive (ID: ${driveData.id})`
        : (driveUploadError 
          ? `Photo approved but Drive upload failed: ${String(driveUploadError)}`
          : 'Photo approved (Drive upload skipped)'),
    });
  } catch (error) {
    console.error('Error approving photo:', error);
    return errorResponse('Internal server error', 500);
  }
}
