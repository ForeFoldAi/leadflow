import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
const { Pool } = pkg;
import { leads, users } from './shared/schema.js';
import { eq, isNull } from 'drizzle-orm';

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL environment variable is required');
  process.exit(1);
}

const pool = new Pool({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});
const db = drizzle(pool);

async function fixLeadsUserId() {
  try {
    console.log('🔍 Checking for leads without user_id...');
    
    // Get all leads without user_id
    const leadsWithoutUserId = await db
      .select()
      .from(leads)
      .where(isNull(leads.userId));
    
    console.log(`Found ${leadsWithoutUserId.length} leads without user_id`);
    
    if (leadsWithoutUserId.length === 0) {
      console.log('✅ All leads already have user_id assigned');
      return;
    }
    
    // Get the admin user (or first user if no admin)
    const adminUser = await db
      .select()
      .from(users)
      .where(eq(users.email, 'admin@leadconnect.hyderabad'))
      .limit(1);
    
    let targetUser;
    if (adminUser.length > 0) {
      targetUser = adminUser[0];
      console.log(`📧 Found admin user: ${targetUser.email}`);
    } else {
      // Get the first user if no admin found
      const firstUser = await db
        .select()
        .from(users)
        .limit(1);
      
      if (firstUser.length === 0) {
        console.error('❌ No users found in database');
        return;
      }
      
      targetUser = firstUser[0];
      console.log(`📧 Using first user: ${targetUser.email}`);
    }
    
    console.log(`🔧 Assigning ${leadsWithoutUserId.length} leads to user: ${targetUser.name} (${targetUser.email})`);
    
    let fixedCount = 0;
    
    for (const lead of leadsWithoutUserId) {
      await db
        .update(leads)
        .set({ userId: targetUser.id })
        .where(eq(leads.id, lead.id));
      
      console.log(`✅ Fixed lead: ${lead.name} (${lead.city || 'no city'})`);
      fixedCount++;
    }
    
    console.log(`🎉 Successfully assigned user_id to ${fixedCount} leads`);
    
    // Verify the fix
    const remainingLeadsWithoutUserId = await db
      .select()
      .from(leads)
      .where(isNull(leads.userId));
    
    console.log(`🔍 Remaining leads without user_id: ${remainingLeadsWithoutUserId.length}`);
    
  } catch (error) {
    console.error('❌ Error fixing leads user_id:', error);
  } finally {
    await pool.end();
  }
}

// Run the fix
fixLeadsUserId();