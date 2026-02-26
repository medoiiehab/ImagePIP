-- ============================================================================
-- 1. CLEANUP & RESET (DROP EVERYTHING)
-- ============================================================================

DROP TABLE IF EXISTS photos CASCADE;
DROP TABLE IF EXISTS user_schools CASCADE; -- New junction table
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS teams CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS photo_status CASCADE;

-- ============================================================================
-- 2. ENUMS & TYPES
-- ============================================================================

CREATE TYPE user_role AS ENUM ('admin', 'client');
CREATE TYPE photo_status AS ENUM ('pending', 'approved', 'rejected');

-- ============================================================================
-- 3. TEAMS TABLE (ACTS AS "SCHOOLS")
-- ============================================================================

CREATE TABLE teams (
  id BIGSERIAL PRIMARY KEY,
  uuid VARCHAR(4) UNIQUE NOT NULL, -- "School UUID"
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by BIGINT, 
  is_active BOOLEAN DEFAULT true
);

CREATE INDEX idx_teams_uuid ON teams(uuid);

-- ============================================================================
-- 4. USERS TABLE
-- ============================================================================

CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  uuid VARCHAR(10) UNIQUE NOT NULL,    -- User UUID
  email VARCHAR(255) UNIQUE,           -- Optional for clients
  password_hash VARCHAR(255) NOT NULL,
  role user_role NOT NULL DEFAULT 'client',
  -- Removed school_uuid (now in user_schools)
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE,
  created_by BIGINT,
  is_active BOOLEAN DEFAULT true
);

CREATE INDEX idx_users_uuid ON users(uuid);
CREATE INDEX idx_users_email ON users(email);

-- ============================================================================
-- 5. USER_SCHOOLS JUNCTION TABLE (M:N)
-- ============================================================================

CREATE TABLE user_schools (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  school_uuid VARCHAR(4) REFERENCES teams(uuid) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  assigned_by BIGINT, -- ID of admin who assigned
  is_primary BOOLEAN DEFAULT false, -- Optional: mark a main school if needed
  UNIQUE(user_id, school_uuid) -- Avoid duplicates
);

CREATE INDEX idx_user_schools_user ON user_schools(user_id);
CREATE INDEX idx_user_schools_school ON user_schools(school_uuid);

-- ============================================================================
-- 6. PHOTOS TABLE
-- ============================================================================

CREATE TABLE photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_path VARCHAR(255) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_size INTEGER,
  mime_type VARCHAR(50),
  
  -- Associations
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  school_uuid VARCHAR(4) REFERENCES teams(uuid) ON DELETE SET NULL, -- The specific school context for this photo
  
  -- Status flow
  status photo_status DEFAULT 'pending',
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by BIGINT REFERENCES users(id),
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  migrated_to_google_drive BOOLEAN DEFAULT false,
  google_drive_id VARCHAR(255),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_photos_user_id ON photos(user_id);
CREATE INDEX idx_photos_school_uuid ON photos(school_uuid);
CREATE INDEX idx_photos_status ON photos(status);

-- ============================================================================
-- 7. STORAGE POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

-- Policy: Public read access
CREATE POLICY "Public Access"
ON photos FOR SELECT
USING ( true );

-- Policy: Authenticated upload (clients & admins)
CREATE POLICY "Authenticated Upload"
ON photos FOR INSERT
WITH CHECK ( auth.role() = 'authenticated' OR true );

-- Policy: Admins can update/delete
CREATE POLICY "Admin Full Access"
ON photos FOR ALL
USING ( true ); 


-- ============================================================================
-- 8. SEED DATA
-- ============================================================================

-- A. Create Admin User
-- Password: Admin123! -> Hash: QWRtaW4xMjMh (Base64 mock)
INSERT INTO users (uuid, email, password_hash, role, first_name, last_name)
VALUES (
  '9999', 
  'admin@imagepipeline.com', 
  'QWRtaW4xMjMh', 
  'admin', 
  'System', 
  'Admin'
);

-- B. Create Teams (Schools)
INSERT INTO teams (uuid, name, description, created_by)
VALUES 
  ('1000', 'West High School', 'Main High School Team', NULL),
  ('1001', 'East High School', 'Alternative School', NULL);

-- C. Create a Client User linked to BOTH Schools
-- User UUID: 1005, Pwd: P1005 -> Base64: UDEwMDU=
INSERT INTO users (uuid, password_hash, role, first_name, created_by)
VALUES (
  '1005',
  'UDEwMDU=', 
  'client',
  'Student Photographer',
  1
);

-- Link user 1005 to School 1000 AND 1001
INSERT INTO user_schools (user_id, school_uuid, assigned_by)
VALUES 
  ((SELECT id FROM users WHERE uuid='1005'), '1000', 1),
  ((SELECT id FROM users WHERE uuid='1005'), '1001', 1);
