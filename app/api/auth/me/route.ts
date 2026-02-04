import { NextRequest } from 'next/server';
import { authenticateRequest, successResponse, errorResponse } from '@/lib/auth/middleware';

export async function GET(request: NextRequest) {
  const { valid, user, error } = authenticateRequest(request);

  if (!valid || !user) {
    return errorResponse(error || 'Unauthorized', 401);
  }

  return successResponse({
    id: user.id,
    uuid: user.uuid,
    role: user.role,
    schoolUuid: user.schoolUuid,
    userUuid: user.userUuid,
  });
}
