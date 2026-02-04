# Supabase Database Setup Guide

## Overview

This guide walks you through setting up the Image Pipeline database schema in Supabase.

## Table Structure

### 1. **Schools** (`schools`)
Container for organizations. Each school can have multiple teams.

```
Fields:
- id (Primary Key)
- uuid (4-digit, unique)
- name
- address
- contact_email
- contact_phone
- created_by (Admin UUID)
- created_at / updated_at
```

### 2. **Teams** (`teams`)
Groups within schools. Each team has a 4-digit UUID for client login.

```
Fields:
- id (Primary Key)
- uuid (4-digit, unique) → Used in client login
- name
- school_id (FK)
- description
- created_by (Admin)
- is_active
- created_at / updated_at
```

### 3. **Users** (`users`)
System users with role-based access (admin, client, viewer).

```
Fields:
- id (Primary Key)
- uuid (4-digit, unique) → Used in client login (with team_uuid)
- email (unique)
- role (admin | client | viewer)
- team_id (FK)
- school_id (FK)
- password_hash
- first_name / last_name
- is_active
- last_login
- created_at / updated_at
```

**Client Login:** teamUuid (4-digit) + userUuid (4-digit) + password

### 4. **Photos** (`photos`)
Uploaded photos with approval workflow and Google Drive migration status.

```
Fields:
- id (Primary Key)
- team_id (FK)
- user_id (FK) → Who uploaded
- school_id (FK)
- file_name / file_path / file_size
- mime_type / width / height
- status (pending | approved | rejected | migrated)
- uploaded_at
- approved_at / approved_by
- rejected_at / rejection_reason
- migrated_to_google_drive (Boolean)
- google_drive_id / google_drive_url
- metadata (JSONB for flexible data)
- created_at / updated_at
```

### 5. **Admin Activity Logs** (`admin_activity_logs`)
Audit trail for admin actions.

```
Fields:
- id (Primary Key)
- admin_id (FK)
- action (string)
- entity_type / entity_id
- details (JSONB)
- created_at
```

### 6. **Share Links** (`share_links`)
Temporary/permanent access tokens for viewers to access approved photos.

```
Fields:
- id (Primary Key)
- token (64-char unique, URL-safe)
- team_id (FK)
- created_by (FK)
- expires_at (nullable)
- access_count / max_access_count
- is_active
- created_at / updated_at
```

---

## How to Apply Schema

### **Option A: Manual SQL in Supabase Dashboard**

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **SQL Editor** → **New Query**
4. Copy the entire contents of `supabase/migrations/001_initial_schema.sql`
5. Paste into the editor
6. Click **Run**
7. Wait for all migrations to complete

### **Option B: Using Supabase CLI (Recommended)**

```bash
# Install Supabase CLI
npm install -g supabase

# Login to your Supabase account
supabase login

# Link to your project
supabase link --project-ref jqwpcdnkafbsioerszqs

# Apply migrations
supabase db push

# Pull latest schema (if making changes in dashboard)
supabase db pull
```

---

## Row Level Security (RLS)

RLS is **enabled** on all tables. This means:

- **Admins** can access all data
- **Clients** can only see their team's photos and data
- **Viewers** get limited access via share links

### RLS Policy Summary:

| Table | Admin | Client | Viewer |
|-------|-------|--------|--------|
| schools | View/Edit/Delete | - | - |
| teams | View/Edit/Delete | View own | - |
| users | View/Edit/Delete | View own | - |
| photos | View/Edit/Delete | Upload to own team | View via share link |
| share_links | Manage all | Create own | - |

---

## Initial Setup Steps

After applying the schema:

### 1. **Create Admin User**
```sql
-- Create initial admin user (adjust values)
INSERT INTO users (uuid, email, role, password_hash, first_name, last_name, is_active)
VALUES (
  '9999',
  'admin@example.com',
  'admin',
  '$2b$10$...hash...',  -- Use bcrypt hashed password
  'Admin',
  'User',
  true
);
```

### 2. **Create Sample School & Team**
Sample data is already included in the migration. You can view it:

```sql
SELECT * FROM schools;
SELECT * FROM teams;
```

### 3. **Add More Teams**
```sql
INSERT INTO teams (uuid, name, school_id, created_by)
VALUES ('1003', 'Team C', 1, '00000000-0000-0000-0000-000000000000');
```

### 4. **Create Client Users**
```sql
INSERT INTO users (uuid, email, role, team_id, password_hash)
VALUES 
  ('2001', 'client1@school.edu', 'client', 1, '$2b$10$...hash...'),
  ('2002', 'client2@school.edu', 'client', 2, '$2b$10$...hash...');
```

---

## Testing the Schema

### Check All Tables Exist
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

### Verify RLS is Enabled
```sql
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('schools', 'teams', 'users', 'photos', 'share_links');
```

### Check Indexes
```sql
SELECT tablename, indexname 
FROM pg_indexes 
WHERE tablename IN ('schools', 'teams', 'users', 'photos');
```

---

## Next Steps

1. ✅ **Schema Created** - All tables and RLS policies are in place
2. ⏳ **Connect API Routes** - Update API endpoints to use Supabase instead of mock data
3. ⏳ **Google Drive Integration** - Set up file storage and migration
4. ⏳ **Email Notifications** - Configure Supabase email or SendGrid

---

## Data Relationships Diagram

```
schools (1) ──→ (many) teams
   ↓
   └──→ (many) users

teams (1) ──→ (many) photos
            ←→ (many) users

users (1) ──→ (many) photos (uploaded)
       ↑
       └─── (many) photos (approved_by)

teams (1) ──→ (many) share_links
              ←─── (many) photos (via team)
```

---

## ENUM Types

- **user_role**: `admin`, `client`, `viewer`
- **photo_status**: `pending`, `approved`, `rejected`, `migrated`

---

## Sample Credentials (from Migration)

**School:**
- UUID: `1000`
- Name: Sample School

**Teams:**
- Team A: UUID `1001`
- Team B: UUID `1002`

**Demo User (from API):**
- Email: `admin@example.com`
- Password: `password123`
- Team: `1001`
- User: `2001`
- Password: `clientpass`

---

## Troubleshooting

### RLS Preventing Access?
Make sure your authenticated user has a corresponding record in the `users` table with the correct role.

### Can't Insert Data?
Check that RLS policies allow the operation. Use:
```sql
SELECT * FROM information_schema.role_routine_grants 
WHERE routine_name LIKE '%policy%';
```

### Performance Issues?
Check that indexes are being used:
```sql
EXPLAIN SELECT * FROM photos WHERE team_id = 1;
```

---

## References

- [Supabase Docs](https://supabase.com/docs)
- [PostgreSQL RLS](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
