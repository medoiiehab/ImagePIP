import { NextRequest } from 'next/server';
import { authenticateRequest, successResponse, errorResponse, checkRole } from '@/lib/auth/middleware';
import { supabase } from '@/lib/supabase';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { valid, user, error } = authenticateRequest(request);

  if (!valid || !user) {
    return errorResponse(error || 'Unauthorized', 401);
  }

  if (!checkRole(user, ['admin'])) {
    return errorResponse('Only admins can update teams', 403);
  }

  try {
    const teamId = id;
    const body = await request.json();
    const { name } = body;

    if (!name) {
      return errorResponse('Team name is required');
    }

    const { data: team, error: updateError } = await supabase
      .from('teams')
      .update({
        name,
      })
      .eq('id', teamId)
      .select()
      .single();

    if (updateError || !team) {
      return errorResponse('Team not found or update failed', 404);
    }

    return successResponse({
      success: true,
      team,
      message: 'Team updated successfully',
    });
  } catch (error) {
    console.error('Error updating team:', error);
    return errorResponse('Internal server error', 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { valid, user } = authenticateRequest(request);

  if (!valid || !user) {
    return errorResponse('Unauthorized', 401);
  }

  if (!checkRole(user, ['admin'])) {
    return errorResponse('Only admins can delete teams', 403);
  }

  try {
    const teamId = id;

    const { error: deleteError } = await supabase
      .from('teams')
      .delete()
      .eq('id', teamId);

    if (deleteError) {
      return errorResponse('Team not found or delete failed', 404);
    }

    return successResponse({
      success: true,
      message: 'Team deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting team:', error);
    return errorResponse('Internal server error', 500);
  }
}
