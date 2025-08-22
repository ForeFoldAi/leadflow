export interface EmailNotification {
    to: string;
    subject: string;
    text?: string;
    html?: string;
}
export interface PushNotification {
    userId: string;
    title: string;
    message: string;
    type: 'lead_created' | 'lead_updated' | 'lead_converted' | 'system';
    data?: any;
}
export interface UserNotificationSettings {
    newLeads: boolean;
    followUps: boolean;
    hotLeads: boolean;
    conversions: boolean;
    browserPush: boolean;
    dailySummary: boolean;
    emailNotifications: boolean;
}
declare class NotificationService {
    private pushSubscriptions;
    private getUserNotificationSettings;
    private shouldSendNotification;
    sendEmail(notification: EmailNotification): Promise<boolean>;
    subscribeToPush(userId: string, subscription: any): void;
    unsubscribeFromPush(userId: string): void;
    sendPushNotification(notification: PushNotification): Promise<boolean>;
    notifyNewLead(userId: string, userEmail: string, leadName: string, leadId: string): Promise<boolean>;
    notifyLeadUpdate(userId: string, userEmail: string, leadName: string, leadId: string, changes: string[]): Promise<boolean>;
    notifyLeadConverted(userId: string, userEmail: string, leadName: string, leadId: string): Promise<boolean>;
    notifyHotLead(userId: string, userEmail: string, leadName: string, leadId: string): Promise<boolean>;
    notifyFollowUpReminder(userId: string, userEmail: string, leadName: string, leadId: string, followUpDate: string): Promise<boolean>;
    sendDailySummary(userId: string, userEmail: string, summaryData: any): Promise<boolean>;
    notifyBatchImport(users: Array<{
        id: string;
        email: string;
    }>, leadCount: number, importedBy: string): Promise<number>;
    testEmailConnection(): Promise<boolean>;
}
export declare const notificationService: NotificationService;
export {};
