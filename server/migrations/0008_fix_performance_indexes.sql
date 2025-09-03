-- Migration: Fix Performance Indexes
-- Description: Add missing performance indexes with correct column names

-- Add missing indexes for leads table
CREATE INDEX IF NOT EXISTS idx_leads_lead_status ON leads(lead_status);
CREATE INDEX IF NOT EXISTS idx_leads_user_status ON leads(user_id, lead_status);
CREATE INDEX IF NOT EXISTS idx_leads_date_range ON leads(user_id, created_at, lead_status);

-- Add partial index for active leads (excluding deleted)
CREATE INDEX IF NOT EXISTS idx_leads_active ON leads(user_id, lead_status) WHERE lead_status != 'deleted';

-- Add indexes for notification logs (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'notification_logs') THEN
        CREATE INDEX IF NOT EXISTS idx_notification_logs_user_id ON notification_logs(user_id);
        CREATE INDEX IF NOT EXISTS idx_notification_logs_created_at ON notification_logs(created_at);
        CREATE INDEX IF NOT EXISTS idx_notification_logs_type ON notification_logs(type);
        CREATE INDEX IF NOT EXISTS idx_notification_logs_date_range ON notification_logs(user_id, created_at, read);
    END IF;
END $$;

-- Add indexes for users table
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Add indexes for security settings (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'security_settings') THEN
        CREATE INDEX IF NOT EXISTS idx_security_settings_user_id ON security_settings(user_id);
    END IF;
END $$;

-- Add indexes for user sessions (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_sessions') THEN
        CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
        CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);
        CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(user_id, expires_at) WHERE expires_at > NOW();
    END IF;
END $$;

-- Add indexes for password resets (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'password_resets') THEN
        CREATE INDEX IF NOT EXISTS idx_password_resets_user_id ON password_resets(user_id);
        CREATE INDEX IF NOT EXISTS idx_password_resets_expires_at ON password_resets(expires_at);
    END IF;
END $$;

-- Add indexes for two-factor authentication (if tables exist)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'two_factor_auth') THEN
        CREATE INDEX IF NOT EXISTS idx_two_factor_auth_user_id ON two_factor_auth(user_id);
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'two_factor_attempts') THEN
        CREATE INDEX IF NOT EXISTS idx_two_factor_attempts_user_id ON two_factor_attempts(user_id);
        CREATE INDEX IF NOT EXISTS idx_two_factor_attempts_expires_at ON two_factor_attempts(expires_at);
    END IF;
END $$;

-- Performance optimization: Analyze tables after adding indexes
ANALYZE leads;
ANALYZE users;

-- Analyze other tables if they exist
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'notification_logs') THEN
        ANALYZE notification_logs;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'security_settings') THEN
        ANALYZE security_settings;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_sessions') THEN
        ANALYZE user_sessions;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'password_resets') THEN
        ANALYZE password_resets;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'two_factor_auth') THEN
        ANALYZE two_factor_auth;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'two_factor_attempts') THEN
        ANALYZE two_factor_attempts;
    END IF;
END $$; 