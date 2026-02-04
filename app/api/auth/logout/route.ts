import { NextResponse } from 'next/server';
import { successResponse } from '@/lib/auth/middleware';

export async function POST() {
  try {
    // Logout just clears client-side storage
    // Server-side could invalidate token in database if needed

    return successResponse({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    );
  }
}
