import { config } from 'dotenv';
import { storage } from './storage.js';

// Load environment variables
config();

async function fixCurrentUserNotificationDefaults() {
  console.log('🔧 Fixing notification settings for current user...');
  
  try {
    // You'll need to provide a user ID - replace this with an actual user ID from your system
    const userId = process.argv[2];
    
    if (!userId) {
      console.error('❌ Please provide a user ID as an argument');
      console.error('Usage: node fix-notification-defaults-current-user.js <USER_ID>');
      console.error('');
      console.error('To find a user ID, you can:');
      console.error('1. Check your database directly');
      console.error('2. Look at the user ID in your localStorage when logged in');
      console.error('3. Check the server logs for user IDs');
      process.exit(1);
    }
    
    console.log(`⚡ Fixing notification settings for user: ${userId}`);
    
    // Get current notification settings
    let settings = await storage.getNotificationSettings(userId);
    
    if (settings) {
      console.log('📧 Current notification settings:', settings);
      
      // Check if settings need updating
      const needsUpdate = settings.newLeads || settings.followUps || settings.hotLeads || 
                         settings.conversions || settings.dailySummary || settings.emailNotifications;
      
      if (needsUpdate) {
        console.log('🔄 Updating notification settings to OFF defaults...');
        const updatedSettings = await storage.updateNotificationSettings(userId, {
          newLeads: false,
          followUps: false,
          hotLeads: false,
          conversions: false,
          dailySummary: false,
          browserPush: false,
          emailNotifications: false
        });
        console.log('✅ Updated notification settings:', updatedSettings);
      } else {
        console.log('✅ Notification settings are already correct');
      }
    } else {
      console.log('🆕 Creating new notification settings with OFF defaults...');
      const newSettings = await storage.createNotificationSettings({
        userId: userId,
        newLeads: false,
        followUps: false,
        hotLeads: false,
        conversions: false,
        browserPush: false,
        dailySummary: false,
        emailNotifications: false
      });
      console.log('✅ Created new notification settings:', newSettings);
    }
    
    // Also check security settings
    let securitySettings = await storage.getSecuritySettings(userId);
    
    if (securitySettings) {
      console.log('🔒 Current security settings:', securitySettings);
      
      if (securitySettings.loginNotifications) {
        console.log('🔄 Updating security settings to OFF defaults...');
        const updatedSecurity = await storage.updateSecuritySettings(userId, {
          loginNotifications: false
        });
        console.log('✅ Updated security settings:', updatedSecurity);
      } else {
        console.log('✅ Security settings are already correct');
      }
    } else {
      console.log('🆕 Creating new security settings with OFF defaults...');
      const apiKey = storage.generateApiKey();
      const newSecurity = await storage.createSecuritySettings({
        userId: userId,
        twoFactorEnabled: false,
        loginNotifications: false,
        sessionTimeout: "30",
        apiKey
      });
      console.log('✅ Created new security settings:', newSecurity);
    }
    
    console.log('✅ Migration completed successfully!');
    console.log('📧 All notification settings are now OFF by default');
    console.log('🔒 All security settings are now OFF by default');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.error('Error details:', error.message);
    process.exit(1);
  }
}

// Run the migration
fixCurrentUserNotificationDefaults().catch(console.error); 