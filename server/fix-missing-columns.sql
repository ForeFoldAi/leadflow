-- Fix missing columns in notification_settings table
-- This script adds the missing push_subscription column

-- Add the missing push_subscription column
ALTER TABLE notification_settings 
ADD COLUMN IF NOT EXISTS push_subscription TEXT;

-- Set default value for existing records
UPDATE notification_settings 
SET push_subscription = NULL 
WHERE push_subscription IS NULL;

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'notification_settings' 
AND column_name = 'push_subscription';

-- Show current table structure
\d notification_settings; 