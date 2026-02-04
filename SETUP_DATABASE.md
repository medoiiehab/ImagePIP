# Database Schema - Quick Setup

## 🚀 Quick Start (3 Steps)

### Step 1: Open Supabase Dashboard
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project: **Image-Pipeline**
3. Go to **SQL Editor** → Click **New Query**

### Step 2: Copy SQL
1. Open file: `SUPABASE_MIGRATION.sql` in your project
2. Copy ALL contents
3. Paste into Supabase SQL Editor

### Step 3: Execute
Click the **Run** button (or press `Ctrl+Enter`)

**Wait for all migrations to complete** ✅

---

## What Gets Created

✅ **6 Tables:**
- `schools` - Organizations
- `teams` - Groups within schools (4-digit UUID)
- `users` - Team members (4-digit UUID for clients)
- `photos` - Uploaded photos with workflow
- `admin_activity_logs` - Audit trail
- `share_links` - Viewer access tokens

✅ **2 Enum Types:**
- `user_role` (admin, client, viewer)
- `photo_status` (pending, approved, rejected, migrated)

✅ **Indexes** - For performance on common queries

✅ **RLS Policies** - Row-level security enabled (currently permissive)

✅ **Triggers** - Auto-update `updated_at` timestamps

✅ **Sample Data:**
- 1 School (UUID: `1000`)
- 2 Teams (UUIDs: `1001`, `1002`)

---

## Verify Setup

After running the migration, verify everything worked:

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- Check sample data
SELECT * FROM schools;
SELECT * FROM teams;

-- Check RLS is enabled
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = true;
```

---

## Next Steps

1. ✅ Schema created
2. ⏳ **Create Supabase Auth Users** - Set up authentication
3. ⏳ **Connect API Routes to Database** - Replace mock data with Supabase queries
4. ⏳ **Google Drive Integration** - Setup file storage

---

## Database Credentials

From your `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://jqwpcdnkafbsioerszqs.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_z9Bi1SXX8_sLYGqTPFj2pA_ozJ1MRt8
```

Already configured in `lib/supabase.ts` ✅

---

## Troubleshooting

**Error: "relation ... does not exist"**
→ Make sure all SQL ran successfully. Check for errors in the output.

**Error: "permission denied"**
→ RLS policies are working. Add your user record to the database.

**Can't see data in tables**
→ Check RLS policies. Currently set to allow all access (permissive mode).

---

## Documentation

See `SUPABASE_SETUP.md` for detailed documentation on:
- Table structures
- RLS policies
- Initial setup
- Data relationships
