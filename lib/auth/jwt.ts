// @ts-ignore
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface AuthPayload {
  id: string;
  uuid?: string;
  email?: string;
  role: 'admin' | 'client';
  schoolUuid?: string;
  userUuid?: string;
  iat?: number;
  exp?: number;
}


/**
 * Generate a JWT token
 */
export function generateToken(payload: Omit<AuthPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '24h',
  });
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token: string): AuthPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Extract token from Authorization header
 */
export function extractToken(authHeader?: string): string | null {
  if (!authHeader) return null;

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
}

/**
 * Hash a password (mock - use bcrypt in production)
 */
export function hashPassword(password: string): string {
  // In production, use: import bcrypt from 'bcrypt';
  // return await bcrypt.hash(password, 10);

  // Mock implementation for demo
  return Buffer.from(password).toString('base64');
}

/**
 * Verify a password (mock - use bcrypt in production)
 */
export function verifyPassword(password: string, hash: string): boolean {
  // In production, use: import bcrypt from 'bcrypt';
  // return await bcrypt.compare(password, hash);

  // Mock implementation for demo
  return Buffer.from(password).toString('base64') === hash;
}

/**
 * Generate a random 4-digit UUID
 */
export function generateUUID(): string {
  return Math.floor(Math.random() * 9000 + 1000).toString();
}

/**
 * Validate 4-digit UUID format
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9]{4}$/;
  return uuidRegex.test(uuid);
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
