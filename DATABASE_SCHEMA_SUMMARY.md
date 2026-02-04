# Supabase Database Schema - Complete

## Summary

✅ **Supabase Database Schema Created & Optimized for Code**

The complete database schema for the Image Pipeline has been updated to match the application code's requirements, including:
- 6 tables with proper relationships and 4-digit UUID support
- **Added `school_uuid`** to `teams`, `users`, and `photos` tables for direct link support
- **Flexible `email` field** in `users` table (now optional)
- **Nullable `team_id`** in `photos` table
- Row Level Security (RLS) policies (Simplified for development)
- Automatic timestamp management via triggers
- Performance indexes on UUIDs and foreign keys
- Sample data (1 school, 2 teams, 1 admin user)

---

## Files Updated

1. **SUPABASE_MIGRATION.sql** - Revised SQL script with `school_uuid` columns
2. **supabase/migrations/001_initial_schema.sql** - Updated migration file
3. **DATABASE_SCHEMA_SUMMARY.md** - This file

---

## Table Overview

### schools
- Organization container
- UUID: 4-digit (e.g., `1000`)
- Sample: Sample School (UUID: 1000)

### teams
- Groups within schools
- **`school_uuid`**: Direct link to schools.uuid
- UUID: 4-digit (e.g., `1001`, `1002`)
- Used in client login

### users
- Team members with roles
- **`school_uuid`**: Direct link to schools.uuid
- UUID: 4-digit (e.g., `2001`)
- **Email**: Optional (defaults to NULL)
- Roles: admin, client, viewer
- Used in client login (userUuid + schoolUuid)

### photos
- Uploaded photos with approval workflow
- **`school_uuid`**: Direct link to schools.uuid
- **`team_id`**: Optional (can be NULL if not assigned to a team)
- Status: pending → approved → rejected → migrated
- Tracks Google Drive migration
- Metadata stored as JSONB

### admin_activity_logs
- Audit trail for admin actions
- Tracks what, who, when, details

### share_links
- Viewer access tokens
- Can expire or have max access count
- Links to specific teams

---

## Key Features

✅ **Role-Based Access**
- Admin: Full access
- Client: Can upload, view own school photos
- Viewer: Read-only via share links

✅ **Direct UUID Linking**
- Schema supports both BIGINT IDs for internal relationships and VARCHAR(4) UUIDs for external/API interactions, making the code more efficient.

✅ **Security**
- Row Level Security (RLS) enabled
- Simplified policies for development mode (`ALL USING (true)`)

✅ **Performance**
- Indexes on all UUID and foreign key columns
- Composite indexes on relationships

---

## How to Apply

### FASTEST WAY (Recommended)

1. Open `SUPABASE_MIGRATION.sql` in this project
2. Copy everything
3. Go to Supabase Dashboard → SQL Editor → New Query
4. Paste and click Run

---

## Sample Data Included

**School:**
```
UUID: 1000
Name: Sample School
```

**Teams:**
```
Team A: UUID 1001 (School 1000)
Team B: UUID 1002 (School 1000)
```

**Admin User:**
```
UUID: 0001
Email: admin@example.com
Password: admin0001 (Mock hashed as YWRtaW4wMDAx)
```

---

## Current Data Types

### UUIDs in System
- **School UUID**: 4 digits (e.g., `1000`)
- **Team UUID**: 4 digits (e.g., `1001`)
- **User UUID**: 4 digits (e.g., `2001`)
- **Share Link Token**: 64 characters

### Enums
- **user_role**: `admin`, `client`, `viewer`
- **photo_status**: `pending`, `approved`, `rejected`, `migrated`
