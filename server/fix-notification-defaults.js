import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';
import { drizzle } from 'drizzle-orm/postgres-js';
import { neon } from '@neondatabase/serverless';

// Load environment variables
config();

async function fixNotificationDefaults() {
  console.log('🔧 Fixing notification settings defaults...');
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is required');
    process.exit(1);
  }

  try {
    // Use the same database connection method as your main app
    const sql = neon(process.env.DATABASE_URL);
    const db = drizzle(sql);
    
    console.log('📖 Executing SQL migration...');
    
    // Execute the migration statements directly
    console.log('⚡ Updating table structure...');
    await sql`
      ALTER TABLE notification_settings 
      ALTER COLUMN new_leads SET DEFAULT false,
      ALTER COLUMN follow_ups SET DEFAULT false,
      ALTER COLUMN hot_leads SET DEFAULT false,
      ALTER COLUMN conversions SET DEFAULT false,
      ALTER COLUMN daily_summary SET DEFAULT false,
      ALTER COLUMN email_notifications SET DEFAULT false
    `;
    
    console.log('⚡ Updating existing notification settings...');
    const notificationResult = await sql`
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
        email_notifications = true
    `;
    
    console.log('⚡ Updating security settings...');
    const securityResult = await sql`
      ALTER TABLE security_settings 
      ALTER COLUMN login_notifications SET DEFAULT false
    `;
    
    console.log('⚡ Updating existing security settings...');
    const securityUpdateResult = await sql`
      UPDATE security_settings 
      SET 
        login_notifications = false,
        updated_at = NOW()
      WHERE login_notifications = true
    `;
    
    console.log('✅ Migration completed successfully!');
    console.log('📧 All notification settings are now OFF by default');
    console.log('🔒 All security settings are now OFF by default');
    
    // Show results
    const notificationCount = await sql`
      SELECT COUNT(*) as count FROM notification_settings 
      WHERE updated_at > NOW() - INTERVAL '1 minute'
    `;
    
    console.log(`📊 Updated ${notificationCount[0]?.count || 0} notification settings records`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.error('Error details:', error.message);
    process.exit(1);
  }
}

// Run the migration
fixNotificationDefaults().catch(console.error); 