# Database API Integration - Complete ✅

## Overview
All API routes have been successfully updated to use Supabase PostgreSQL database instead of mock in-memory data.

## Updated Routes

### Authentication Routes
**File: `app/api/auth/login/route.ts`** ✅
- Queries `users` table for admin login
- Queries `users` table for client login with team_uuid and uuid matching
- Verifies password hash from database
- Returns JWT token with user data

### Photos Routes
**File: `app/api/photos/route.ts`** ✅
- **GET**: Queries photos table with filters (status, migrated, teamUuid)
  - Admins see all photos
  - Clients see only their team's photos
- **POST**: Uploads file to Supabase Storage + creates photo record in database
  - Stores file in `photos/{teamUuid}/{userId}/{timestamp}-{filename}` path
  - Creates database record with pending status
  - Cleans up storage on database insert failure

**File: `app/api/photos/[id]/route.ts`** ✅
- **DELETE**: Removes photo from storage and deletes database record

**File: `app/api/photos/[id]/approve/route.ts`** ✅
- **POST**: Updates photo status to "approved" with timestamp and approver ID

### Teams Routes
**File: `app/api/teams/route.ts`** ✅
- **GET**: Queries teams table (admin only)
- **POST**: Creates new team with 4-digit UUID
  - Generates new uuid using generateUUID()
  - Associates with school if provided
  - Returns created team record

**File: `app/api/teams/[id]/route.ts`** ✅
- **PUT**: Updates team name
- **DELETE**: Deletes team from database

### Users Routes
**File: `app/api/users/route.ts`** ✅
- **GET**: Queries users table filtered by team (admin only)
- **POST**: Creates new user with password hash
  - Generates 4-digit uuid
  - Hashes password using hashPassword()
  - Assigns to team if provided
  - Detects duplicate emails

**File: `app/api/users/[id]/route.ts`** ✅
- **PUT**: Updates user role
- **DELETE**: Deletes user from database

## Database Schema Tables Used

| Table | Columns Used | Notes |
|-------|-------------|-------|
| `users` | id, uuid, email, password_hash, role, team_uuid | JWT auth + client management |
| `teams` | id, uuid, name, school_uuid, created_by | Team organization |
| `photos` | id, team_uuid, user_id, file_name, file_path, status, metadata, migrated_to_google_drive, approved_at, approved_by | Photo storage + workflow |
| `schools` | (referenced via team.school_uuid) | Organization hierarchy |

## Key Features

### Error Handling ✅
- Database errors return 500 with descriptive messages
- Duplicate emails return 400 error
- Not found queries return 404 errors
- Authorization errors return 401/403

### Security Features ✅
- Role-based access control (admin/client/viewer)
- Clients can only see their team's photos
- Password hashing for all user creation
- JWT token-based authentication
- 4-digit UUID format validated with regex

### Storage Integration ✅
- Files uploaded to Supabase Storage with organized path structure
- Storage path: `photos/{teamUuid}/{userId}/{timestamp}-{filename}`
- File cleanup on database errors (transactional safety)
- File deletion from storage when photo is deleted

### Transaction Safety ✅
- If photo upload succeeds but database insert fails:
  - File is removed from storage automatically
  - Error returned to client
  - Database stays clean

## Environment Variables Required

```
NEXT_PUBLIC_SUPABASE_URL=https://jqwpcdnkafbsioerszqs.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_z9Bi1SXX8_sLYGqTPFj2pA_ozJ1MRt8
```

## Testing the Integration

### 1. Create Admin User (via Supabase console)
```sql
INSERT INTO users (uuid, email, password_hash, role)
VALUES (
  '1000',
  'admin@example.com',
  -- Hash of "password123"
  'sha256...',
  'admin'
);
```

### 2. Test Admin Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "type": "admin",
    "email": "admin@example.com",
    "password": "password123"
  }'
```

### 3. Create Team
```bash
curl -X POST http://localhost:3000/api/teams \
  -H "Authorization: Bearer {JWT_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Team A",
    "schoolUuid": "1000"
  }'
```

### 4. Create Client User
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Authorization: Bearer {JWT_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "client@example.com",
    "password": "clientpass123",
    "role": "client",
    "teamUuid": "1001"
  }'
```

### 5. Test Client Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "type": "client",
    "teamUuid": "1001",
    "userUuid": "2001",
    "password": "clientpass123"
  }'
```

## Next Steps

### Immediate (Phase 4 - Database Connection) ✅ COMPLETE
- [x] Connect photos route to Supabase
- [x] Connect teams route to Supabase
- [x] Connect users route to Supabase
- [x] Connect auth login to Supabase
- [x] Add error handling for database errors

### Short-term (Phase 5 - Google Drive Integration)
- [ ] Implement `/api/photos/[id]/migrate` endpoint
- [ ] Setup Google Drive API authentication
- [ ] Create hot-to-cold storage pipeline (Supabase → Google Drive)
- [ ] Update photo records with google_drive_id

### Medium-term (Phase 6 - Features)
- [ ] Email notifications for photo approvals
- [ ] Viewer access token management
- [ ] Admin activity logging
- [ ] Strict RLS policy enforcement

## Files Modified

- `app/api/auth/login/route.ts` - Supabase queries for authentication
- `app/api/photos/route.ts` - Upload and retrieve photos from database
- `app/api/photos/[id]/route.ts` - Delete photos
- `app/api/photos/[id]/approve/route.ts` - Approve photos
- `app/api/teams/route.ts` - Team CRUD operations
- `app/api/teams/[id]/route.ts` - Update/delete teams
- `app/api/users/route.ts` - User CRUD operations
- `app/api/users/[id]/route.ts` - Update/delete users

## Verification

All files compile with zero TypeScript errors ✅
All routes have proper error handling ✅
All routes use Supabase client from `lib/supabase.ts` ✅
All routes enforce role-based access control ✅
All routes return proper HTTP status codes ✅
