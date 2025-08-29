-- Fix Production Database Issues
-- Run this script on the production database to fix missing columns and structures

-- 1. Add missing push_subscription column to notification_settings
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notification_settings' 
        AND column_name = 'push_subscription'
    ) THEN
        ALTER TABLE "notification_settings" ADD COLUMN "push_subscription" jsonb;
        RAISE NOTICE 'Added push_subscription column to notification_settings';
    ELSE
        RAISE NOTICE 'push_subscription column already exists in notification_settings';
    END IF;
END $$;

-- 2. Add missing two_factor_method column to security_settings
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'security_settings' 
        AND column_name = 'two_factor_method'
    ) THEN
        ALTER TABLE "security_settings" ADD COLUMN "two_factor_method" text DEFAULT 'email' NOT NULL;
        RAISE NOTICE 'Added two_factor_method column to security_settings';
    ELSE
        RAISE NOTICE 'two_factor_method column already exists in security_settings';
    END IF;
END $$;

-- 3. Add missing two_factor_secret column to security_settings
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'security_settings' 
        AND column_name = 'two_factor_secret'
    ) THEN
        ALTER TABLE "security_settings" ADD COLUMN "two_factor_secret" text;
        RAISE NOTICE 'Added two_factor_secret column to security_settings';
    ELSE
        RAISE NOTICE 'two_factor_secret column already exists in security_settings';
    END IF;
END $$;

-- 4. Add missing two_factor_backup_codes column to security_settings
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'security_settings' 
        AND column_name = 'two_factor_backup_codes'
    ) THEN
        ALTER TABLE "security_settings" ADD COLUMN "two_factor_backup_codes" jsonb;
        RAISE NOTICE 'Added two_factor_backup_codes column to security_settings';
    ELSE
        RAISE NOTICE 'two_factor_backup_codes column already exists in security_settings';
    END IF;
END $$;

-- 5. Add missing last_two_factor_setup column to security_settings
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'security_settings' 
        AND column_name = 'last_two_factor_setup'
    ) THEN
        ALTER TABLE "security_settings" ADD COLUMN "last_two_factor_setup" timestamp;
        RAISE NOTICE 'Added last_two_factor_setup column to security_settings';
    ELSE
        RAISE NOTICE 'last_two_factor_setup column already exists in security_settings';
    END IF;
END $$;

-- 6. Add missing user_id column to leads table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'leads' 
        AND column_name = 'user_id'
    ) THEN
        ALTER TABLE "leads" ADD COLUMN "user_id" varchar;
        RAISE NOTICE 'Added user_id column to leads';
    ELSE
        RAISE NOTICE 'user_id column already exists in leads';
    END IF;
END $$;

-- 7. Add foreign key constraint for leads.user_id if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'leads_user_id_users_id_fk'
    ) THEN
        ALTER TABLE "leads" ADD CONSTRAINT "leads_user_id_users_id_fk" 
        FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
        RAISE NOTICE 'Added foreign key constraint for leads.user_id';
    ELSE
        RAISE NOTICE 'Foreign key constraint for leads.user_id already exists';
    END IF;
END $$;

-- 8. Ensure all required indexes exist
CREATE INDEX IF NOT EXISTS "leads_user_id_idx" ON "leads"("user_id");
CREATE INDEX IF NOT EXISTS "notification_settings_user_id_idx" ON "notification_settings"("user_id");
CREATE INDEX IF NOT EXISTS "security_settings_user_id_idx" ON "security_settings"("user_id");
CREATE INDEX IF NOT EXISTS "user_preferences_user_id_idx" ON "user_preferences"("user_id");
CREATE INDEX IF NOT EXISTS "notification_logs_user_id_idx" ON "notification_logs"("user_id");
CREATE INDEX IF NOT EXISTS "user_sessions_user_id_idx" ON "user_sessions"("user_id");
CREATE INDEX IF NOT EXISTS "password_resets_email_idx" ON "password_resets"("email");

-- 9. Update any existing records to have proper defaults
UPDATE "notification_settings" SET "push_subscription" = NULL WHERE "push_subscription" IS NULL;
UPDATE "security_settings" SET "two_factor_method" = 'email' WHERE "two_factor_method" IS NULL;

-- 10. Verify the fixes
SELECT 
    'notification_settings' as table_name,
    COUNT(*) as total_columns
FROM information_schema.columns 
WHERE table_name = 'notification_settings'
UNION ALL
SELECT 
    'security_settings' as table_name,
    COUNT(*) as total_columns
FROM information_schema.columns 
WHERE table_name = 'security_settings'; 