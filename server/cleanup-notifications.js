import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
const { Pool } = pkg;
import { notificationLogs, leads } from './shared/schema.js';
import { eq, and, notInArray, sql } from 'drizzle-orm';

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

async function cleanupNotifications() {
  try {
    console.log('🧹 Starting notification cleanup...');
    
    // Step 1: Clean up old notifications (older than 30 days)
    console.log('\n📅 Cleaning up notifications older than 30 days...');
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const oldNotifications = await db
      .delete(notificationLogs)
      .where(sql`${notificationLogs.createdAt} < ${thirtyDaysAgo}`)
      .returning();
    
    console.log(`✅ Deleted ${oldNotifications.length} old notifications`);
    
    // Step 2: Find notifications for leads that don't belong to the notification recipient
    console.log('\n🔍 Finding notifications for leads not owned by the recipient...');
    
    // Get all notification logs with lead metadata
    const allNotifications = await db
      .select()
      .from(notificationLogs)
      .where(sql`${notificationLogs.metadata}->>'leadId' IS NOT NULL`);
    
    console.log(`📊 Found ${allNotifications.length} notifications with lead metadata`);
    
    let invalidNotifications = [];
    
    for (const notification of allNotifications) {
      const leadId = notification.metadata?.leadId;
      if (!leadId) continue;
      
      // Get the lead to check its owner
      const lead = await db
        .select()
        .from(leads)
        .where(eq(leads.id, leadId))
        .limit(1);
      
      if (lead.length === 0) {
        // Lead doesn't exist, notification is invalid
        invalidNotifications.push(notification.id);
        console.log(`❌ Lead ${leadId} not found for notification ${notification.id}`);
      } else if (lead[0].userId !== notification.userId) {
        // Lead belongs to different user, notification is invalid
        invalidNotifications.push(notification.id);
        console.log(`❌ Notification ${notification.id} for user ${notification.userId} but lead ${leadId} belongs to user ${lead[0].userId}`);
      }
    }
    
    // Step 3: Delete invalid notifications
    if (invalidNotifications.length > 0) {
      console.log(`\n🗑️  Deleting ${invalidNotifications.length} invalid notifications...`);
      
      // Delete invalid notifications in batches
      let deletedInvalid = [];
      for (let i = 0; i < invalidNotifications.length; i += 100) {
        const batch = invalidNotifications.slice(i, i + 100);
        const batchDeleted = await db
          .delete(notificationLogs)
          .where(sql`${notificationLogs.id} IN (${sql.join(batch.map(id => sql`${id}`), sql`, `)})`)
          .returning();
        deletedInvalid.push(...batchDeleted);
      }
      
      console.log(`✅ Deleted ${deletedInvalid.length} invalid notifications`);
    } else {
      console.log('\n✅ No invalid notifications found');
    }
    
    // Step 4: Summary
    console.log('\n📊 Cleanup Summary:');
    console.log(`  - Old notifications deleted: ${oldNotifications.length}`);
    console.log(`  - Invalid notifications deleted: ${invalidNotifications.length}`);
    console.log(`  - Total notifications cleaned: ${oldNotifications.length + invalidNotifications.length}`);
    
    // Step 5: Show remaining notification count by user
    const remainingNotifications = await db
      .select({
        userId: notificationLogs.userId,
        count: sql`count(*)`
      })
      .from(notificationLogs)
      .groupBy(notificationLogs.userId);
    
    console.log('\n👥 Remaining notifications by user:');
    for (const userNotif of remainingNotifications) {
      console.log(`  - User ${userNotif.userId}: ${userNotif.count} notifications`);
    }
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await pool.end();
  }
}

// Run the cleanup
cleanupNotifications();