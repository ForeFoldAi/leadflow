export interface LocalStorageData {
    user?: any;
    preferenceSettings?: any;
    notificationSettings?: any;
    securitySettings?: any;
    userApiKey?: string;
    notificationLogs?: any[];
}
export declare class MigrationUtility {
    /**
     * Migrate user data from localStorage to database
     * This should be called when a user first logs in after the database migration
     */
    static migrateUserData(userId: string, localStorageData: LocalStorageData): Promise<void>;
    private static migrateUserPreferences;
    private static migrateNotificationSettings;
    private static migrateSecuritySettings;
    private static migrateNotificationLogs;
    /**
     * Check if user data needs migration
     */
    static needsMigration(userId: string): Promise<boolean>;
    /**
     * Check if user has localStorage data to migrate
     */
    static hasLocalStorageData(localStorageData: LocalStorageData): boolean;
    /**
     * Get default data structure for new users
     */
    static getDefaultData(userId: string): LocalStorageData;
}
