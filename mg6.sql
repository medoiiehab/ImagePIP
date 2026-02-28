-- ============================================================================
-- 10. ADD GOOGLE DRIVE FOLDER ID TO TEAMS (Schools)
-- ============================================================================

ALTER TABLE teams ADD COLUMN IF NOT EXISTS google_drive_folder_id VARCHAR(255);
