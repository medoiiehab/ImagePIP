import { NextRequest } from 'next/server';
import { authenticateRequest, successResponse, errorResponse, checkRole } from '@/lib/auth/middleware';
import { supabase } from '@/lib/supabase';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { valid, user, error } = authenticateRequest(request);


  if (!valid || !user) {
    return errorResponse(error || 'Unauthorized', 401);
  }

  if (!checkRole(user, ['admin'])) {
    return errorResponse('Only admins can delete photos', 403);
  }

  try {
    const photoId = id;

    const { data: photo, error: fetchError } = await supabase
      .from('photos')
      .select('file_path')
      .eq('id', photoId)
      .single();

    if (fetchError || !photo) {
      return errorResponse('Photo not found', 404);
    }

    // Delete from storage if it exists
    if (photo.file_path) {
      await supabase.storage
        .from('photos')
        .remove([photo.file_path])
        .catch(() => {
          // Silently ignore if file doesn't exist in storage
        });
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from('photos')
      .delete()
      .eq('id', photoId);

    if (deleteError) {
      console.error('Delete error:', deleteError);
      return errorResponse('Failed to delete photo', 500);
    }

    return successResponse({
      success: true,
      message: 'Photo deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting photo:', error);
    return errorResponse('Internal server error', 500);
  }
}
