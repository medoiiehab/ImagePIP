-- ============================================================================
-- 9. SYSTEM SETTINGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS system_settings (
  id BIGSERIAL PRIMARY KEY,
  site_name VARCHAR(255) DEFAULT 'Image Pipeline',
  max_file_size_mb INTEGER DEFAULT 10,
  auto_delete_days INTEGER DEFAULT 30,
  email_notifications BOOLEAN DEFAULT true,
  maintenance_mode BOOLEAN DEFAULT false,
  auto_approval BOOLEAN DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure only one row exists
INSERT INTO system_settings (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- RLS
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow admins to manage settings"
ON system_settings FOR ALL
USING ( true ); -- Simplified for now, in production check role
