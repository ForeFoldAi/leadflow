import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
const { Pool } = pkg;
import { leads, users } from './shared/schema.js';
import { eq } from 'drizzle-orm';

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

async function fixLeadCreatedBy() {
  try {
    console.log('Starting to fix leadCreatedBy field...');
    
    // Get all leads first, then filter for those that need fixing
    const allLeads = await db
      .select()
      .from(leads);
    
    // Filter leads that have email-like patterns or are empty/null
    const leadsWithEmail = allLeads.filter(lead => 
      !lead.leadCreatedBy || 
      lead.leadCreatedBy === '' || 
      lead.leadCreatedBy.includes('@')
    );
    
    console.log(`Found ${leadsWithEmail.length} leads that need fixing`);
    
    let fixedCount = 0;
    
    for (const lead of leadsWithEmail) {
      if (!lead.userId) {
        console.log(`Lead ${lead.id} has no userId, skipping...`);
        continue;
      }
      
      // Get the user who owns this lead
      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, lead.userId))
        .limit(1);
      
      if (user.length === 0) {
        console.log(`User ${lead.userId} not found for lead ${lead.id}, skipping...`);
        continue;
      }
      
      const userName = user[0].name;
      
      // Update the lead with the user's name
      await db
        .update(leads)
        .set({ leadCreatedBy: userName })
        .where(eq(leads.id, lead.id));
      
      console.log(`Fixed lead ${lead.id}: ${lead.leadCreatedBy || 'empty'} -> ${userName}`);
      fixedCount++;
    }
    
    console.log(`Successfully fixed ${fixedCount} leads`);
    
  } catch (error) {
    console.error('Error fixing leads:', error);
  } finally {
    await pool.end();
  }
}

// Run the fix
fixLeadCreatedBy(); 