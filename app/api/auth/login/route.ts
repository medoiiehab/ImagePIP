import { NextRequest } from 'next/server';
import {
  generateToken,
  isValidUUID,
  verifyPassword,
} from '@/lib/auth/jwt';
import { successResponse, errorResponse } from '@/lib/auth/middleware';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, email, password, schoolUuid, userUuid } = body;

    if (!type) {
      return errorResponse('Login type is required');
    }

    // Admin login (email + password)
    if (type === 'admin') {
      if (!email || !password) {
        return errorResponse('Email and password are required');
      }

      // Query admin user by email
      const { data: adminUsers, error: queryError } = await supabase
        .from('users')
        .select('id, role, uuid, email, password_hash')
        .eq('email', email.toLowerCase())
        .eq('role', 'admin');

      if (queryError || !adminUsers || adminUsers.length === 0) {
        return errorResponse('Invalid credentials', 401);
      }

      const adminUser = adminUsers[0];

      // Verify password
      if (!adminUser.password_hash || !verifyPassword(password, adminUser.password_hash)) {
        return errorResponse('Invalid credentials', 401);
      }

      // Generate token
      const token = generateToken({
        id: adminUser.id,
        uuid: adminUser.uuid,
        email: adminUser.email,
        role: 'admin',
      });

      return successResponse({
        success: true,
        token,
        user: {
          id: adminUser.id,
          uuid: adminUser.uuid,
          email: adminUser.email,
          role: 'admin',
        },
      });
    }

    // Client login (UUID-based)
    if (type === 'client') {
      if (!schoolUuid || !userUuid || !password) {
        return errorResponse('School ID, User ID, and password are required');
      }

      if (!isValidUUID(schoolUuid)) {
        return errorResponse('Invalid School ID format (4 digits)');
      }

      if (!isValidUUID(userUuid)) {
        return errorResponse('Invalid User ID format (4 digits)');
      }

      // Query client user from Supabase
      // Query client user from Supabase (by User UUID and Role only first)
      const { data: clientUsers, error: queryError } = await supabase
        .from('users')
        .select('id, role, uuid, password_hash')
        .eq('uuid', userUuid)
        .eq('role', 'client');

      if (queryError || !clientUsers || clientUsers.length === 0) {
        return errorResponse('Invalid credentials', 401);
      }

      const clientUser = clientUsers[0] as any;

      // Verify School Association in Junction Table
      const { data: schoolLink, error: linkError } = await supabase
        .from('user_schools')
        .select('id')
        .eq('user_id', clientUser.id)
        .eq('school_uuid', schoolUuid)
        .single();

      if (linkError || !schoolLink) {
        return errorResponse('User is not authorized for this school', 401);
      }

      // Verify password (either custom hash or default P{UUID})
      const isValid = clientUser.password_hash
        ? verifyPassword(password, clientUser.password_hash)
        : password === `P${userUuid}`;

      if (!isValid) {
        return errorResponse('Invalid credentials', 401);
      }

      // Generate token
      const token = generateToken({
        id: clientUser.id,
        uuid: clientUser.uuid,
        schoolUuid: schoolUuid, // The specific school they logged in to
        userUuid: clientUser.uuid,
        role: 'client',
      });

      return successResponse({
        success: true,
        token,
        user: {
          id: clientUser.id,
          uuid: clientUser.uuid,
          schoolUuid: schoolUuid,
          role: 'client',
        },
      });
    }

    return errorResponse('Invalid login type');
  } catch (error) {
    console.error('Login error:', error);
    return errorResponse('Internal server error', 500);
  }
}
