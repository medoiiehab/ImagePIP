-- This SQL file should be run in Supabase SQL Editor
-- To apply: 
-- 1. Go to Supabase Dashboard → SQL Editor → New Query
-- 2. Copy and paste this entire file
-- 3. Click "Run"

-- ============================================================================
-- ENUM TYPES
-- ============================================================================

CREATE TYPE user_role AS ENUM ('admin', 'client', 'viewer');
CREATE TYPE photo_status AS ENUM ('pending', 'approved', 'rejected', 'migrated');

-- ============================================================================
-- SCHOOLS TABLE
-- ============================================================================

CREATE TABLE schools (
  id BIGSERIAL PRIMARY KEY,
  uuid VARCHAR(4) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  address TEXT,
  contact_email VARCHAR(255),
  contact_phone VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID NOT NULL
);

CREATE INDEX idx_schools_uuid ON schools(uuid);
CREATE INDEX idx_schools_name ON schools(name);

-- ============================================================================
-- TEAMS TABLE
-- ============================================================================

CREATE TABLE teams (
  id BIGSERIAL PRIMARY KEY,
  uuid VARCHAR(4) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  school_id BIGINT REFERENCES schools(id) ON DELETE CASCADE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID NOT NULL,
  is_active BOOLEAN DEFAULT true
);

CREATE INDEX idx_teams_uuid ON teams(uuid);
CREATE INDEX idx_teams_school_id ON teams(school_id);
CREATE INDEX idx_teams_created_by ON teams(created_by);

-- ============================================================================
-- USERS TABLE
-- ============================================================================

CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  uuid VARCHAR(4) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  role user_role NOT NULL DEFAULT 'client',
  team_id BIGINT REFERENCES teams(id) ON DELETE SET NULL,
  school_id BIGINT REFERENCES schools(id) ON DELETE SET NULL,
  password_hash VARCHAR(255),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID
);

CREATE INDEX idx_users_uuid ON users(uuid);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_team_id ON users(team_id);
CREATE INDEX idx_users_school_id ON users(school_id);

-- ============================================================================
-- PHOTOS TABLE
-- ============================================================================

CREATE TABLE photos (
  id BIGSERIAL PRIMARY KEY,
  team_id BIGINT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  school_id BIGINT REFERENCES schools(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(512) NOT NULL UNIQUE,
  file_size BIGINT,
  mime_type VARCHAR(50),
  width INT,
  height INT,
  status photo_status DEFAULT 'pending',
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  rejected_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  migrated_to_google_drive BOOLEAN DEFAULT false,
  google_drive_id VARCHAR(255),
  google_drive_url VARCHAR(512),
  migrated_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_photos_team_id ON photos(team_id);
CREATE INDEX idx_photos_user_id ON photos(user_id);
CREATE INDEX idx_photos_school_id ON photos(school_id);
CREATE INDEX idx_photos_status ON photos(status);
CREATE INDEX idx_photos_uploaded_at ON photos(uploaded_at DESC);
CREATE INDEX idx_photos_migrated ON photos(migrated_to_google_drive);

-- ============================================================================
-- ADMIN ACTIVITY LOG TABLE
-- ============================================================================

CREATE TABLE admin_activity_logs (
  id BIGSERIAL PRIMARY KEY,
  admin_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50),
  entity_id BIGINT,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_admin_logs_admin_id ON admin_activity_logs(admin_id);
CREATE INDEX idx_admin_logs_created_at ON admin_activity_logs(created_at DESC);

-- ============================================================================
-- SHARE LINKS TABLE (For Viewer Access)
-- ============================================================================

CREATE TABLE share_links (
  id BIGSERIAL PRIMARY KEY,
  token VARCHAR(64) UNIQUE NOT NULL,
  team_id BIGINT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  created_by BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMP WITH TIME ZONE,
  access_count INT DEFAULT 0,
  max_access_count INT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_share_links_token ON share_links(token);
CREATE INDEX idx_share_links_team_id ON share_links(team_id);
CREATE INDEX idx_share_links_expires_at ON share_links(expires_at);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_links ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SCHOOLS RLS POLICIES
-- ============================================================================

CREATE POLICY "admins_view_all_schools" ON schools
  FOR SELECT USING (true);

CREATE POLICY "admins_insert_schools" ON schools
  FOR INSERT WITH CHECK (true);

CREATE POLICY "admins_update_schools" ON schools
  FOR UPDATE USING (true);

CREATE POLICY "admins_delete_schools" ON schools
  FOR DELETE USING (true);

-- ============================================================================
-- TEAMS RLS POLICIES
-- ============================================================================

CREATE POLICY "teams_select_policy" ON teams
  FOR SELECT USING (true);

CREATE POLICY "teams_insert_policy" ON teams
  FOR INSERT WITH CHECK (true);

CREATE POLICY "teams_update_policy" ON teams
  FOR UPDATE USING (true);

CREATE POLICY "teams_delete_policy" ON teams
  FOR DELETE USING (true);

-- ============================================================================
-- USERS RLS POLICIES
-- ============================================================================

CREATE POLICY "users_select_policy" ON users
  FOR SELECT USING (true);

CREATE POLICY "users_insert_policy" ON users
  FOR INSERT WITH CHECK (true);

CREATE POLICY "users_update_policy" ON users
  FOR UPDATE USING (true);

CREATE POLICY "users_delete_policy" ON users
  FOR DELETE USING (true);

-- ============================================================================
-- PHOTOS RLS POLICIES
-- ============================================================================

CREATE POLICY "photos_select_policy" ON photos
  FOR SELECT USING (true);

CREATE POLICY "photos_insert_policy" ON photos
  FOR INSERT WITH CHECK (true);

CREATE POLICY "photos_update_policy" ON photos
  FOR UPDATE USING (true);

CREATE POLICY "photos_delete_policy" ON photos
  FOR DELETE USING (true);

-- ============================================================================
-- ADMIN ACTIVITY LOG RLS POLICIES
-- ============================================================================

CREATE POLICY "logs_select_policy" ON admin_activity_logs
  FOR SELECT USING (true);

CREATE POLICY "logs_insert_policy" ON admin_activity_logs
  FOR INSERT WITH CHECK (true);

-- ============================================================================
-- SHARE LINKS RLS POLICIES
-- ============================================================================

CREATE POLICY "share_links_select_policy" ON share_links
  FOR SELECT USING (true);

CREATE POLICY "share_links_insert_policy" ON share_links
  FOR INSERT WITH CHECK (true);

CREATE POLICY "share_links_update_policy" ON share_links
  FOR UPDATE USING (true);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER schools_updated_at BEFORE UPDATE ON schools
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER teams_updated_at BEFORE UPDATE ON teams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER photos_updated_at BEFORE UPDATE ON photos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER share_links_updated_at BEFORE UPDATE ON share_links
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SAMPLE DATA
-- ============================================================================

INSERT INTO schools (uuid, name, address, contact_email, contact_phone, created_by)
VALUES ('1000', 'Sample School', '123 School St', 'admin@school.edu', '555-0100', '00000000-0000-0000-0000-000000000000');

INSERT INTO teams (uuid, name, school_id, description, created_by)
VALUES 
  ('1001', 'Photography Team A', 1, 'Main photography team', '00000000-0000-0000-0000-000000000000'),
  ('1002', 'Photography Team B', 1, 'Secondary photography team', '00000000-0000-0000-0000-000000000000');
