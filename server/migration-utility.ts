import { storage } from "./storage";
import type { User } from "@shared/schema";

export interface LocalStorageData {
  user?: any;
  preferenceSettings?: any;
  notificationSettings?: any;
  securitySettings?: any;
  userApiKey?: string;
  notificationLogs?: any[];
}

export class MigrationUtility {
  /**
   * Migrate user data from localStorage to database
   * This should be called when a user first logs in after the database migration
   */
  static async migrateUserData(userId: string, localStorageData: LocalStorageData): Promise<void> {
    try {
      console.log(`Starting migration for user ${userId}`);

      // Migrate user preferences
      if (localStorageData.preferenceSettings) {
        await this.migrateUserPreferences(userId, localStorageData.preferenceSettings);
      }

      // Migrate notification settings
      if (localStorageData.notificationSettings) {
        await this.migrateNotificationSettings(userId, localStorageData.notificationSettings);
      }

      // Migrate security settings
      if (localStorageData.securitySettings || localStorageData.userApiKey) {
        await this.migrateSecuritySettings(userId, localStorageData.securitySettings, localStorageData.userApiKey);
      }

      // Migrate notification logs
      if (localStorageData.notificationLogs && localStorageData.notificationLogs.length > 0) {
        await this.migrateNotificationLogs(userId, localStorageData.notificationLogs);
      }

      console.log(`Migration completed for user ${userId}`);
    } catch (error) {
      console.error(`Migration failed for user ${userId}:`, error);
      throw error;
    }
  }

  private static async migrateUserPreferences(userId: string, preferences: any): Promise<void> {
    try {
      const existingPreferences = await storage.getUserPreferences(userId);
      if (existingPreferences) {
        console.log(`User preferences already exist for user ${userId}, skipping migration`);
        return;
      }

      const migratedPreferences = {
        userId,
        defaultView: preferences.defaultView || "table",
        itemsPerPage: preferences.itemsPerPage || "20",
        autoSave: preferences.autoSave !== undefined ? preferences.autoSave : true,
        compactMode: preferences.compactMode || false,
        exportFormat: preferences.exportFormat || "csv",
        exportNotes: preferences.exportNotes !== undefined ? preferences.exportNotes : true
      };

      await storage.createUserPreferences(migratedPreferences);
      console.log(`Migrated user preferences for user ${userId}`);
    } catch (error) {
      console.error(`Failed to migrate user preferences for user ${userId}:`, error);
      throw error;
    }
  }

  private static async migrateNotificationSettings(userId: string, settings: any): Promise<void> {
    try {
      const existingSettings = await storage.getNotificationSettings(userId);
      if (existingSettings) {
        console.log(`Notification settings already exist for user ${userId}, skipping migration`);
        return;
      }

      const migratedSettings = {
        userId,
        newLeads: settings.newLeads !== undefined ? settings.newLeads : true,
        followUps: settings.followUps !== undefined ? settings.followUps : true,
        hotLeads: settings.hotLeads !== undefined ? settings.hotLeads : true,
        conversions: settings.conversions !== undefined ? settings.conversions : true,
        browserPush: settings.browserPush || false,
        dailySummary: settings.dailySummary || false,
        emailNotifications: settings.emailNotifications !== undefined ? settings.emailNotifications : true
      };

      await storage.createNotificationSettings(migratedSettings);
      console.log(`Migrated notification settings for user ${userId}`);
    } catch (error) {
      console.error(`Failed to migrate notification settings for user ${userId}:`, error);
      throw error;
    }
  }

  private static async migrateSecuritySettings(userId: string, settings: any, apiKey?: string): Promise<void> {
    try {
      const existingSettings = await storage.getSecuritySettings(userId);
      if (existingSettings) {
        console.log(`Security settings already exist for user ${userId}, skipping migration`);
        return;
      }

      const migratedSettings = {
        userId,
        twoFactorEnabled: settings?.twoFactorEnabled || false,
        loginNotifications: settings?.loginNotifications !== undefined ? settings.loginNotifications : true,
        sessionTimeout: settings?.sessionTimeout || "30",
        apiKey: apiKey || storage.generateApiKey()
      };

      await storage.createSecuritySettings(migratedSettings);
      console.log(`Migrated security settings for user ${userId}`);
    } catch (error) {
      console.error(`Failed to migrate security settings for user ${userId}:`, error);
      throw error;
    }
  }

  private static async migrateNotificationLogs(userId: string, logs: any[]): Promise<void> {
    try {
      // Only migrate the last 10 logs to avoid overwhelming the database
      const logsToMigrate = logs.slice(-10);
      
      for (const log of logsToMigrate) {
        try {
          await storage.createNotificationLog({
            userId,
            type: log.type || "system",
            title: log.title || "Migrated Notification",
            message: log.message || "This notification was migrated from localStorage",
            read: log.read || false,
            metadata: log.metadata || { migrated: true, originalTimestamp: log.timestamp }
          });
        } catch (error) {
          console.error(`Failed to migrate individual notification log:`, error);
          // Continue with other logs even if one fails
        }
      }

      console.log(`Migrated ${logsToMigrate.length} notification logs for user ${userId}`);
    } catch (error) {
      console.error(`Failed to migrate notification logs for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Check if user data needs migration
   */
  static async needsMigration(userId: string): Promise<boolean> {
    try {
      const preferences = await storage.getUserPreferences(userId);
      const notificationSettings = await storage.getNotificationSettings(userId);
      const securitySettings = await storage.getSecuritySettings(userId);

      // If any of the required settings are missing, setup is needed
      return !preferences || !notificationSettings || !securitySettings;
    } catch (error) {
      console.error(`Error checking migration status for user ${userId}:`, error);
      return false; // Don't assume migration is needed if there's an error
    }
  }

  /**
   * Check if user has localStorage data to migrate
   */
  static hasLocalStorageData(localStorageData: LocalStorageData): boolean {
    return Object.keys(localStorageData).some(key => 
      key !== 'userApiKey' && localStorageData[key as keyof LocalStorageData] && 
      (Array.isArray(localStorageData[key as keyof LocalStorageData]) 
        ? (localStorageData[key as keyof LocalStorageData] as any[]).length > 0 
        : true)
    );
  }

  /**
   * Get default data structure for new users
   */
  static getDefaultData(userId: string): LocalStorageData {
    return {
      preferenceSettings: {
        defaultView: "table",
        itemsPerPage: "20",
        autoSave: true,
        compactMode: false,
        exportFormat: "csv",
        exportNotes: true
      },
      notificationSettings: {
        newLeads: true,
        followUps: true,
        hotLeads: true,
        conversions: true,
        browserPush: false,
        dailySummary: false,
        emailNotifications: true
      },
      securitySettings: {
        twoFactorEnabled: false,
        loginNotifications: true,
        sessionTimeout: "30"
      },
      userApiKey: storage.generateApiKey(),
      notificationLogs: []
    };
  }
} 