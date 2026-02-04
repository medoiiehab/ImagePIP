// User Roles
export const USER_ROLES = {
  ADMIN: 'admin',
  CLIENT: 'client',
} as const;

// Routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_TEAMS: '/admin/teams',
  ADMIN_USERS: '/admin/users',
  CLIENT_CAPTURE: '/client/capture',
} as const;

// Photo Status
export const PHOTO_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  MIGRATED: 'migrated',
} as const;

// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  AUTH_LOGIN: '/api/auth/login',
  AUTH_LOGOUT: '/api/auth/logout',

  // Photos
  PHOTOS_UPLOAD: '/api/photos/upload',
  PHOTOS_LIST: '/api/photos',
  PHOTOS_APPROVE: '/api/photos/approve',
  PHOTOS_DELETE: '/api/photos/delete',

  // Teams
  TEAMS_CREATE: '/api/teams/create',
  TEAMS_LIST: '/api/teams',
  TEAMS_UPDATE: '/api/teams/update',
  TEAMS_DELETE: '/api/teams/delete',

  // Users
  USERS_CREATE: '/api/users/create',
  USERS_LIST: '/api/users',
  USERS_UPDATE: '/api/users/update',
  USERS_DELETE: '/api/users/delete',
} as const;

// Validation
export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 8,
  UUID_PATTERN: /^[0-9]{4}$/,
  EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
} as const;

