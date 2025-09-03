-- Fix notification settings table defaults
-- This script updates existing notification settings to have OFF defaults

-- First, update the table structure to change defaults for new records
ALTER TABLE notification_settings 
ALTER COLUMN new_leads SET DEFAULT false,
ALTER COLUMN follow_ups SET DEFAULT false,
ALTER COLUMN hot_leads SET DEFAULT false,
ALTER COLUMN conversions SET DEFAULT false,
ALTER COLUMN daily_summary SET DEFAULT false,
ALTER COLUMN email_notifications SET DEFAULT false;

-- Update existing records to have OFF values (this will fix existing users)
UPDATE notification_settings 
SET 
  new_leads = false,
  follow_ups = false,
  hot_leads = false,
  conversions = false,
  daily_summary = false,
  email_notifications = false,
  updated_at = NOW()
WHERE 
  new_leads = true OR 
  follow_ups = true OR 
  hot_leads = true OR 
  conversions = true OR 
  daily_summary = true OR 
  email_notifications = true;

-- Also fix security settings defaults
ALTER TABLE security_settings 
ALTER COLUMN login_notifications SET DEFAULT false;

-- Update existing security settings
UPDATE security_settings 
SET 
  login_notifications = false,
  updated_at = NOW()
WHERE login_notifications = true;

-- Show the results
SELECT 'notification_settings' as table_name, COUNT(*) as records_updated FROM notification_settings WHERE updated_at > NOW() - INTERVAL '1 minute';
SELECT 'security_settings' as table_name, COUNT(*) as records_updated FROM security_settings WHERE updated_at > NOW() - INTERVAL '1 minute'; 