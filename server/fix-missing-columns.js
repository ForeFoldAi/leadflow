import { config } from 'dotenv';
import pkg from 'pg';
const { Pool } = pkg;

// Load environment variables
config();

async function fixMissingColumns() {
  console.log('🔧 Fixing missing database columns...');
  
  try {
    if (!process.env.DATABASE_URL) {
      console.error('❌ DATABASE_URL environment variable is required');
      process.exit(1);
    }

    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
    
    console.log('📖 Adding missing push_subscription column...');
    
    // Add the missing column
    await pool.query(`
      ALTER TABLE notification_settings 
      ADD COLUMN IF NOT EXISTS push_subscription TEXT
    `);
    
    console.log('✅ Column added successfully');
    
    // Set default values for existing records
    console.log('📝 Updating existing records...');
    const updateResult = await pool.query(`
      UPDATE notification_settings 
      SET push_subscription = NULL 
      WHERE push_subscription IS NULL
    `);
    
    console.log('✅ Records updated');
    
    // Verify the column was added
    console.log('🔍 Verifying column structure...');
    const columns = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'notification_settings' 
      AND column_name = 'push_subscription'
    `);
    
    if (columns.rows.length > 0) {
      console.log('✅ Column verification successful:', columns.rows[0]);
    } else {
      console.error('❌ Column verification failed');
    }
    
    // Show table structure
    console.log('📋 Current table structure:');
    const tableInfo = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'notification_settings'
      ORDER BY ordinal_position
    `);
    
    tableInfo.rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    console.log('✅ Migration completed successfully!');
    console.log('📧 Notification settings table now has all required columns');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.error('Error details:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the migration
fixMissingColumns().catch(console.error); 