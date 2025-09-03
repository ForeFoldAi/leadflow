-- Migration: Add Performance Indexes
-- Description: Add database indexes to improve query performance and reduce slow data saving

-- Add indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_leads_user_id ON leads(user_id);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_updated_at ON leads(updated_at);

-- Add indexes for notification logs
CREATE INDEX IF NOT EXISTS idx_notification_logs_user_id ON notification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_created_at ON notification_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_notification_logs_type ON notification_logs(type);

-- Add indexes for users table
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Add indexes for security settings
CREATE INDEX IF NOT EXISTS idx_security_settings_user_id ON security_settings(user_id);

-- Add indexes for user sessions
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);

-- Add indexes for password resets
CREATE INDEX IF NOT EXISTS idx_password_resets_user_id ON password_resets(user_id);
CREATE INDEX IF NOT EXISTS idx_password_resets_expires_at ON password_resets(expires_at);

-- Add composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_leads_user_status ON leads(user_id, status);
CREATE INDEX IF NOT EXISTS idx_leads_user_created ON leads(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_leads_user_updated ON leads(user_id, updated_at);

-- Add indexes for two-factor authentication
CREATE INDEX IF NOT EXISTS idx_two_factor_auth_user_id ON two_factor_auth(user_id);
CREATE INDEX IF NOT EXISTS idx_two_factor_attempts_user_id ON two_factor_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_two_factor_attempts_expires_at ON two_factor_attempts(expires_at);

-- Add partial indexes for active records
CREATE INDEX IF NOT EXISTS idx_leads_active ON leads(user_id, status) WHERE status != 'deleted';
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(user_id, expires_at) WHERE expires_at > NOW();

-- Add indexes for search operations
CREATE INDEX IF NOT EXISTS idx_leads_name_search ON leads USING gin(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_leads_email_search ON leads USING gin(to_tsvector('english', email));

-- Add indexes for date range queries
CREATE INDEX IF NOT EXISTS idx_leads_date_range ON leads(user_id, created_at, status);
CREATE INDEX IF NOT EXISTS idx_notification_logs_date_range ON notification_logs(user_id, created_at, read);

-- Performance optimization: Analyze tables after adding indexes
ANALYZE leads;
ANALYZE notification_logs;
ANALYZE users;
ANALYZE security_settings;
ANALYZE user_sessions;
ANALYZE password_resets;
ANALYZE two_factor_auth;
ANALYZE two_factor_attempts; 