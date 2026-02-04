import { NextRequest, NextResponse } from 'next/server';
import { extractToken, verifyToken, AuthPayload } from './jwt';

/**
 * Middleware to extract and verify auth token from requests
 */
export function authenticateRequest(
  request: NextRequest
): { valid: boolean; user: AuthPayload | null; error?: string } {
  const authHeader = request.headers.get('authorization');
  const token = extractToken(authHeader || undefined);

  if (!token) {
    return {
      valid: false,
      user: null,
      error: 'Missing authentication token',
    };
  }

  const user = verifyToken(token);
  if (!user) {
    return {
      valid: false,
      user: null,
      error: 'Invalid or expired token',
    };
  }

  return {
    valid: true,
    user,
  };
}

/**
 * Check if user has required role
 */
export function checkRole(
  user: AuthPayload | null,
  requiredRoles: string[]
): boolean {
  if (!user) return false;
  return requiredRoles.includes(user.role);
}

/**
 * Create error response
 */
export function errorResponse(
  message: string,
  status: number = 400
): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Create success response
 */
export function successResponse<T>(
  data: T,
  status: number = 200
): NextResponse {
  return NextResponse.json(data, { status });
}
