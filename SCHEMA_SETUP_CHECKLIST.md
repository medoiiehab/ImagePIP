# 📋 Supabase Schema Setup Checklist

## ✅ What's Been Created

### Documentation Files
- ✅ `SUPABASE_MIGRATION.sql` - Ready-to-run SQL script
- ✅ `SETUP_DATABASE.md` - 3-step quick start
- ✅ `SUPABASE_SETUP.md` - Complete detailed guide
- ✅ `DATABASE_SCHEMA_SUMMARY.md` - Overview & reference

### Database Schema
- ✅ 6 tables (schools, teams, users, photos, admin_activity_logs, share_links)
- ✅ 2 enum types (user_role, photo_status)
- ✅ Performance indexes on all key columns
- ✅ Row Level Security (RLS) enabled on all tables
- ✅ Auto-updating timestamp triggers
- ✅ Foreign key relationships with cascade deletes
- ✅ Sample data (1 school, 2 teams)

---

## 🚀 NEXT: Apply the Schema to Supabase

### Quick Setup (2 minutes)

1. **Open SQL File**
   - File: `SUPABASE_MIGRATION.sql`
   - Copy entire contents

2. **Go to Supabase Dashboard**
   - URL: https://app.supabase.com
   - Project: Image-Pipeline
   - Tab: SQL Editor → New Query

3. **Paste & Run**
   - Paste SQL code
   - Click **Run** button
   - ✅ Wait for completion

### What You'll See
```
CREATE TYPE user_role AS ENUM (...)
CREATE TYPE photo_status AS ENUM (...)
CREATE TABLE schools { ... }
CREATE TABLE teams { ... }
CREATE TABLE users { ... }
CREATE TABLE photos { ... }
CREATE TABLE admin_activity_logs { ... }
CREATE TABLE share_links { ... }
CREATE INDEX ...
CREATE POLICY ...
...
INSERT INTO schools ...
INSERT INTO teams ...

Success!
```

---

## ✅ Verification Checklist

After running the migration, verify everything worked:

### Check Tables Exist
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

Expected result:
```
admin_activity_logs
photos
schools
share_links
teams
users
```

### Check Sample Data
```sql
SELECT * FROM schools;
SELECT * FROM teams;
```

Expected result:
```
schools: 1 row (Sample School, UUID 1000)
teams: 2 rows (Team A UUID 1001, Team B UUID 1002)
```

### Check Indexes Created
```sql
SELECT tablename, indexname FROM pg_indexes 
WHERE tablename IN ('schools', 'teams', 'users', 'photos')
ORDER BY tablename;
```

### Check RLS Enabled
```sql
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = true
ORDER BY tablename;
```

Expected: All 6 tables should have `rowsecurity = true`

---

## 📚 Documentation Reading Order

1. **Start Here**: `SETUP_DATABASE.md` (3-step quick setup)
2. **Reference**: `DATABASE_SCHEMA_SUMMARY.md` (overview & structure)
3. **Deep Dive**: `SUPABASE_SETUP.md` (detailed documentation)
4. **SQL Details**: `SUPABASE_MIGRATION.sql` (commented SQL)

---

## 🎯 Project Status

### ✅ Completed
- [x] Next.js 14 project setup
- [x] TypeScript configuration
- [x] 20+ React components with CSS
- [x] Admin dashboard with 5 pages
- [x] Login system (Admin, Client, Viewer)
- [x] Custom data management hooks
- [x] API route structure & handlers
- [x] **Supabase database schema**

### ⏳ Next Steps (After Schema Applied)

1. **Connect API Routes to Database** (Recommended)
   - Update `/api/auth/login` to query users table
   - Update `/api/photos` to use photos table
   - Update `/api/teams` to use teams table
   - Update `/api/users` to use users table
   - Replace mock data with real queries

2. **Setup Supabase Authentication** (Optional but recommended)
   - Configure Supabase Auth
   - Create auth functions
   - Update login components

3. **Google Drive Integration**
   - Setup Google Drive API
   - Implement photo migration
   - Create storage strategy

4. **Email Notifications** (Optional)
   - Setup Supabase email templates or SendGrid
   - Send notifications on approvals

---

## 🔑 Key Information

### Database Credentials
From your `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://jqwpcdnkafbsioerszqs.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_z9Bi1SXX8_sLYGqTPFj2pA_ozJ1MRt8
```

### Sample Data
- **School**: UUID `1000` (Sample School)
- **Teams**: UUID `1001`, `1002`
- **Login Demo**:
  - Team: `1001`
  - User: `2001`
  - Password: `clientpass` (from API)

### Supabase Client
Already configured in `lib/supabase.ts`:
```typescript
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
```

---

## 📞 Troubleshooting

### SQL Error: "relation ... does not exist"
**Cause**: Migration didn't complete fully
**Fix**: Run migration again, check for error messages

### Can't see the tables in Supabase
**Cause**: Dashboard cache or new session needed
**Fix**: Refresh the browser (F5)

### RLS blocking access
**Cause**: Policies are too restrictive
**Fix**: Currently set to permissive (allow all). See SUPABASE_SETUP.md for strict mode

### Performance issues with large photo sets
**Solution**: Indexes are already created on:
- `team_id`, `user_id`, `status`
- `uploaded_at` (DESC for recent first)
- `migrated_to_google_drive`

---

## 📋 Files Reference

| File | Purpose |
|------|---------|
| `SUPABASE_MIGRATION.sql` | SQL to run in Supabase (MOST IMPORTANT) |
| `SETUP_DATABASE.md` | Quick 3-step setup guide |
| `DATABASE_SCHEMA_SUMMARY.md` | Overview of all tables |
| `SUPABASE_SETUP.md` | Detailed documentation |
| `supabase/migrations/001_initial_schema.sql` | Backup migration file |

---

## ⚠️ Important Notes

1. **RLS Policies**: Currently set to allow all operations. 
   - Good for development/testing
   - Enable strict policies before production
   - See SUPABASE_SETUP.md for strict examples

2. **Sample Data**: 
   - 1 school, 2 teams included
   - Create users via API after setup

3. **Authentication**:
   - Uses app-level JWT (lib/auth/jwt.ts)
   - Can migrate to Supabase Auth later
   - Email/UUID login supported

4. **Google Drive**:
   - Schema ready (fields: google_drive_id, migrated_to_google_drive)
   - Integration code not yet implemented

---

## ✨ Schema Highlights

### Hot-to-Cold Storage Pipeline
```
Upload → Pending → Admin Approval → Approved → Google Drive Migration
                   ↓ (rejected)
              Rejected (with reason)
```

### Role-Based Access
| Role | Upload | Approve | View | Migrate |
|------|--------|---------|------|---------|
| Admin | ✅ | ✅ | ✅ | ✅ |
| Client | ✅ | ✗ | Own | ✗ |
| Viewer | ✗ | ✗ | Approved | ✗ |

### 4-Digit UUID System
- Schools: `1000`, `1001`, etc.
- Teams: `1001`, `1002`, etc.
- Users: `2001`, `2002`, etc.
- Simple, memorable, secure enough for internal use

---

## 🎓 Learning Resources

- Supabase Docs: https://supabase.com/docs
- PostgreSQL RLS: https://www.postgresql.org/docs/current/ddl-rowsecurity.html
- Database Design: https://wiki.postgresql.org/wiki/SlonyI/10/Best_Practices

---

## 🎉 What's Next After Schema?

1. Test the schema works (run verification queries)
2. Create your first user via API
3. Upload a test photo
4. Approve it in admin dashboard
5. Connect Google Drive integration
6. Deploy to production

**Estimated time**: 15-30 minutes for full setup
