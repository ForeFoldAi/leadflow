import { config } from 'dotenv';
import { storage } from './storage.js';

// Load environment variables
config();

async function fixNotificationDefaults() {
  console.log('🔧 Fixing notification settings defaults using existing storage...');
  
  try {
    // Get all users to update their notification settings
    const users = await storage.getAllUsers();
    console.log(`📊 Found ${users.length} users to update`);
    
    let updatedCount = 0;
    
    for (const user of users) {
      try {
        console.log(`⚡ Updating user: ${user.email} (${user.id})`);
        
        // Get current notification settings
        let settings = await storage.getNotificationSettings(user.id);
        
        if (settings) {
          // Check if settings need updating
          const needsUpdate = settings.newLeads || settings.followUps || settings.hotLeads || 
                             settings.conversions || settings.dailySummary || settings.emailNotifications;
          
          if (needsUpdate) {
            console.log(`  📧 Updating notification settings for ${user.email}`);
            await storage.updateNotificationSettings(user.id, {
              newLeads: false,
              followUps: false,
              hotLeads: false,
              conversions: false,
              dailySummary: false,
              browserPush: false,
              emailNotifications: false
            });
            updatedCount++;
          } else {
            console.log(`  ✅ ${user.email} already has correct settings`);
          }
        } else {
          // Create new settings with OFF defaults
          console.log(`  🆕 Creating new notification settings for ${user.email}`);
          await storage.createNotificationSettings({
            userId: user.id,
            newLeads: false,
            followUps: false,
            hotLeads: false,
            conversions: false,
            browserPush: false,
            dailySummary: false,
            emailNotifications: false
          });
          updatedCount++;
        }
        
        // Also check security settings
        let securitySettings = await storage.getSecuritySettings(user.id);
        
        if (securitySettings) {
          if (securitySettings.loginNotifications) {
            console.log(`  🔒 Updating security settings for ${user.email}`);
            await storage.updateSecuritySettings(user.id, {
              loginNotifications: false
            });
          }
        } else {
          // Create new security settings with OFF defaults
          console.log(`  🆕 Creating new security settings for ${user.email}`);
          const apiKey = storage.generateApiKey();
          await storage.createSecuritySettings({
            userId: user.id,
            twoFactorEnabled: false,
            loginNotifications: false,
            sessionTimeout: "30",
            apiKey
          });
        }
        
      } catch (userError) {
        console.error(`❌ Error updating user ${user.email}:`, userError.message);
      }
    }
    
    console.log('✅ Migration completed successfully!');
    console.log(`📊 Updated ${updatedCount} user notification settings`);
    console.log('📧 All notification settings are now OFF by default');
    console.log('🔒 All security settings are now OFF by default');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.error('Error details:', error.message);
    process.exit(1);
  }
}

// Run the migration
fixNotificationDefaults().catch(console.error); 