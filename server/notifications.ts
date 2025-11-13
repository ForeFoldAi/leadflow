import nodemailer from 'nodemailer';
import { storage } from './storage.js';
import { getFirebaseMessaging, isFirebaseConfigured } from './firebase-admin.js';

// Create reusable transporter object using SMTP transport
const createTransporter = () => {
  // Check if we have SMTP configuration
  const smtpConfig = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  };

  // If using Gmail, you might need to use an App Password
  if (smtpConfig.host === 'smtp.gmail.com') {
    console.log('Using Gmail SMTP configuration');
  }

  return nodemailer.createTransport(smtpConfig);
};

let emailServiceConfigured = false;
let transporter: nodemailer.Transporter | null = null;

// Initialize email service
if (process.env.SMTP_USER && process.env.SMTP_PASS) {
  try {
    transporter = createTransporter();
    emailServiceConfigured = true;
    console.log("Nodemailer email service configured successfully");
    
    // Verify connection configuration
    if (transporter) {
      transporter.verify((error: Error | null, success: boolean) => {
        if (error) {
          console.error('SMTP connection error:', error);
          // In development, don't disable email service completely - allow fallback
          if (process.env.NODE_ENV === 'production') {
            emailServiceConfigured = false;
          } else {
            console.log('📧 [DEV MODE] SMTP connection failed, but email service will use simulation fallback');
          }
        } else {
          console.log('SMTP server is ready to take our messages');
        }
      });
    }
  } catch (error) {
    console.error('Failed to create email transporter:', error);
    emailServiceConfigured = false;
  }
} else {
  console.warn("SMTP credentials not properly configured. Email notifications will be simulated.");
}

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
  type: 'lead_created' | 'lead_updated' | 'lead_converted' | 'followup' | 'system';
  data?: Record<string, any>;
}

type PushTokenEntry = {
  token: string;
  platform: 'web';
  updatedAt: string;
  device?: string;
};

type PushSubscriptionPayload = {
  tokens: PushTokenEntry[];
};

export interface UserNotificationSettings {
  newLeads: boolean;
  followUps: boolean;
  hotLeads: boolean;
  conversions: boolean;
  browserPush: boolean;
  dailySummary: boolean;
  emailNotifications: boolean;
}

class NotificationService {
  private firebaseEnabled: boolean = isFirebaseConfigured();

  // Get user notification settings
  private async getUserNotificationSettings(userId: string): Promise<UserNotificationSettings | null> {
    try {
      // Import storage to access user preferences
      const { storage } = await import('./storage.js');
      
      // Fetch user's actual notification settings from database
      const userSettings = await storage.getNotificationSettings(userId);
      
      if (userSettings) {
        // Return user's saved preferences
        return {
          newLeads: userSettings.newLeads,
          followUps: userSettings.followUps,
          hotLeads: userSettings.hotLeads,
          conversions: userSettings.conversions,
          browserPush: userSettings.browserPush,
          dailySummary: userSettings.dailySummary,
          emailNotifications: userSettings.emailNotifications
        };
      }
      
      // If no settings found, return default settings
      return {
        newLeads: false,
        followUps: false,
        hotLeads: false,
        conversions: false,
        browserPush: false,
        dailySummary: false,
        emailNotifications: true
      };
    } catch (error) {
      console.error('Failed to get user notification settings:', error);
      
      // Fallback to default settings if database access fails
      return {
        newLeads: false,
        followUps: false,
        hotLeads: false,
        conversions: false,
        browserPush: false,
        dailySummary: false,
        emailNotifications: true
      };
    }
  }

  // Check if user has enabled specific notification type
  private async shouldSendNotification(userId: string, notificationType: keyof UserNotificationSettings): Promise<boolean> {
    const settings = await this.getUserNotificationSettings(userId);
    if (!settings) {
      // Default to true if no settings found (backward compatibility)
      return true;
    }
    
    // Check if email notifications are globally enabled
    if (!settings.emailNotifications) {
      return false;
    }
    
    // Check specific notification type based on user preferences
    return settings[notificationType] || false;
  }

  // Check if this is an authentication-related email (2FA, password reset, etc.)
  private isAuthenticationEmail(subject: string, type?: string): boolean {
    const authKeywords = [
      '2fa', 'two-factor', 'authentication', 'verification', 'otp', 'code',
      'password', 'reset', 'login', 'security', 'verify', 'confirm'
    ];
    
    const subjectLower = subject.toLowerCase();
    const typeLower = type?.toLowerCase() || '';
    
    return authKeywords.some(keyword => 
      subjectLower.includes(keyword) || typeLower.includes(keyword)
    );
  }

  // Email notifications - only allow authentication emails
  async sendEmail(notification: EmailNotification): Promise<boolean> {
    // Check if this is an authentication-related email
    if (!this.isAuthenticationEmail(notification.subject)) {
      console.log(`📧 [BLOCKED] Non-authentication email blocked: ${notification.subject} to ${notification.to}`);
      return false;
    }

    if (!emailServiceConfigured || !transporter) {
      // Simulate email sending when SMTP is not properly configured
      console.log(`📧 [SIMULATED AUTH EMAIL] To: ${notification.to}`);
      console.log(`📧 [SIMULATED AUTH EMAIL] Subject: ${notification.subject}`);
      console.log(`📧 [SIMULATED AUTH EMAIL] Content: ${notification.text || 'HTML content provided'}`);
      console.log('📧 [SIMULATED AUTH EMAIL] Authentication email would be sent successfully in production');
      return true; // Always return true for simulation
    }

    try {
      const mailOptions = {
        from: process.env.SMTP_FROM || process.env.SMTP_USER, // Use SMTP_FROM or fallback to SMTP_USER
        to: notification.to,
        subject: notification.subject,
        text: notification.text,
        html: notification.html || notification.text || '',
      };

      const info = await transporter.sendMail(mailOptions);
      console.log(`📧 Authentication email sent successfully to ${notification.to}: ${notification.subject}`);
      console.log(`📧 Message ID: ${info.messageId}`);
      return true;
    } catch (error) {
      console.error('📧 Nodemailer email error:', error);
      // Fall back to simulation if Nodemailer fails
      console.log(`📧 [FALLBACK SIMULATION] To: ${notification.to}`);
      console.log(`📧 [FALLBACK SIMULATION] Subject: ${notification.subject}`);
      console.log('📧 [FALLBACK SIMULATION] Authentication email delivery failed but notification logged');
      
      // In development, return true to allow processes to continue
      if (process.env.NODE_ENV !== 'production') {
        console.log('📧 [DEV MODE] Treating failed authentication email as successful for development');
        return true;
      }
      
      return false;
    }
  }

  private getMessaging() {
    if (!this.firebaseEnabled) {
      return null;
    }

    const messaging = getFirebaseMessaging();
    if (!messaging) {
      this.firebaseEnabled = false;
      return null;
    }

    return messaging;
  }

  private isValidTokenEntry(entry: any): entry is PushTokenEntry {
    return Boolean(
      entry &&
        typeof entry.token === 'string' &&
        entry.token.trim().length > 0 &&
        entry.platform === 'web',
    );
  }

  private normalizeSubscriptionPayload(payload: unknown): PushSubscriptionPayload | null {
    if (!payload || typeof payload !== 'object') {
      return null;
    }

    const maybePayload = payload as { tokens?: unknown } | { token?: unknown };

    if (Array.isArray((maybePayload as any).tokens)) {
      const tokens = ((maybePayload as any).tokens as unknown[]).filter(this.isValidTokenEntry.bind(this));
      return tokens.length > 0 ? { tokens } : { tokens: [] };
    }

    if (this.isValidTokenEntry(maybePayload)) {
      return { tokens: [maybePayload as PushTokenEntry] };
    }

    if (typeof (maybePayload as any).token === 'string') {
      return {
        tokens: [
          {
            token: String((maybePayload as any).token),
            platform: 'web',
            updatedAt: new Date().toISOString(),
            device: (maybePayload as any).device,
          },
        ],
      };
    }

    return null;
  }

  private async getPushTokenEntries(userId: string): Promise<PushTokenEntry[]> {
    const settings = await storage.getNotificationSettings(userId);
    const payload = settings?.pushSubscription as PushSubscriptionPayload | null;
    if (!payload || !Array.isArray(payload.tokens)) {
      return [];
    }

    return payload.tokens.filter(this.isValidTokenEntry.bind(this));
  }

  private async savePushTokens(userId: string, tokens: PushTokenEntry[]): Promise<void> {
    const cleaned = tokens.filter(this.isValidTokenEntry.bind(this));
    await storage.updateNotificationSettings(userId, {
      browserPush: cleaned.length > 0,
      pushSubscription: cleaned.length > 0 ? { tokens: cleaned } : null,
    });
  }

  private async shouldSendPush(userId: string): Promise<boolean> {
    try {
      const settings = await storage.getNotificationSettings(userId);
      return Boolean(settings?.browserPush);
    } catch (error) {
      console.error('Failed to check push notification settings:', error);
      return false;
    }
  }

  private mergeTokenEntries(existing: PushTokenEntry[], incoming: PushTokenEntry[]): PushTokenEntry[] {
    const map = new Map<string, PushTokenEntry>();

    for (const entry of existing) {
      if (this.isValidTokenEntry(entry)) {
        map.set(entry.token, entry);
      }
    }

    for (const entry of incoming) {
      if (this.isValidTokenEntry(entry)) {
        map.set(entry.token, { ...entry, updatedAt: entry.updatedAt ?? new Date().toISOString() });
      }
    }

    return Array.from(map.values());
  }

  // Push notifications (web push)
  async subscribeToPush(userId: string, subscription: any) {
    const normalized = this.normalizeSubscriptionPayload(subscription);
    if (!normalized || normalized.tokens.length === 0) {
      console.warn(`Invalid push subscription payload for user ${userId}`);
      return;
    }

    const existing = await this.getPushTokenEntries(userId);
    const merged = this.mergeTokenEntries(existing, normalized.tokens);
    await this.savePushTokens(userId, merged);

    if (!this.firebaseEnabled) {
      console.warn(`Firebase messaging not configured. Stored push token for user ${userId}, but notifications won't be sent until configured.`);
    } else {
      console.log(`User ${userId} subscribed to push notifications (${merged.length} token(s) stored)`);
  }
  }

  async unsubscribeFromPush(userId: string, token?: string) {
    if (!token) {
      await this.savePushTokens(userId, []);
      console.log(`User ${userId} unsubscribed from all push notifications`);
      return;
    }

    const existing = await this.getPushTokenEntries(userId);
    const remaining = existing.filter(entry => entry.token !== token);
    await this.savePushTokens(userId, remaining);

    console.log(`Removed push token for user ${userId}. Remaining tokens: ${remaining.length}`);
  }

  async sendPushNotification(notification: PushNotification): Promise<boolean> {
    const messaging = this.getMessaging();
    if (!messaging) {
      console.warn('[Firebase] Messaging service unavailable. Push notification skipped.');
      return false;
    }

    const tokens = await this.getPushTokenEntries(notification.userId);
    if (tokens.length === 0) {
      console.warn(`No push tokens stored for user ${notification.userId}`);
      return false;
    }

    const payload = {
      notification: {
        title: notification.title,
        body: notification.message,
      },
      data: {
        type: notification.type,
        ...Object.fromEntries(
          Object.entries(notification.data ?? {}).map(([key, value]) => [key, typeof value === 'string' ? value : JSON.stringify(value)]),
        ),
      },
      tokens: tokens.map(entry => entry.token),
    };

    try {
      const response = await messaging.sendEachForMulticast(payload);
      const invalidTokens: string[] = [];

      response.responses.forEach((res, index) => {
        if (!res.success) {
          const errCode = res.error?.code ?? 'unknown';
          console.error(`Failed to send push notification to user ${notification.userId} (token index ${index}):`, res.error);

          if (errCode === 'messaging/registration-token-not-registered' || errCode === 'messaging/invalid-registration-token') {
            invalidTokens.push(tokens[index].token);
          }
        }
      });

      if (invalidTokens.length > 0) {
        const cleaned = tokens.filter(entry => !invalidTokens.includes(entry.token));
        await this.savePushTokens(notification.userId, cleaned);
        console.log(`Removed ${invalidTokens.length} invalid push token(s) for user ${notification.userId}`);
      }

      console.log(
        `Push notification for user ${notification.userId}: ${notification.title} - ${notification.message}. Success: ${response.successCount}, Failure: ${response.failureCount}`,
      );
      return response.successCount > 0;
    } catch (error) {
      console.error('Push notification error:', error);
      return false;
    }
  }

  // Lead-specific notification helpers with user settings check
  async notifyNewLead(userId: string, userEmail: string, leadName: string, leadId: string) {
    // ALWAYS create notification log in database for Recent Notifications
    try {
      const { storage } = await import('./storage.js');
      await storage.createNotificationLog({
        userId,
        type: 'new_lead',
        title: 'New Lead Added',
        message: `New lead: ${leadName}`,
        read: false,
        metadata: {
          leadId,
          leadName
        }
      });
      console.log(`📝 Notification log created for new lead: ${leadName}`);
    } catch (error) {
      console.error('Failed to create notification log:', error);
    }

    // Push notification (does not depend on email settings)
    let pushSent = false;
    const pushEnabled = await this.shouldSendPush(userId);
    if (pushEnabled) {
      pushSent = await this.sendPushNotification({
        userId,
        title: 'New Lead Added',
        message: `${leadName} was just added to your pipeline.`,
        type: 'lead_created',
        data: {
          leadId,
          leadName,
        },
      });
    } else {
      console.log(`🔕 Push notifications disabled for user ${userId}, skipping new lead push`);
    }

    // Check if user has enabled new lead notifications for EMAIL only
    const shouldSendEmail = await this.shouldSendNotification(userId, 'newLeads');
    if (!shouldSendEmail) {
      console.log(`📧 Skipping new lead EMAIL for user ${userId} - email notifications disabled`);
      return pushSent || true; // Return true since we successfully created the database log
    }

    const emailNotification: EmailNotification = {
      to: userEmail,
      subject: 'New Lead Added - LeadsFlow',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">New Lead Added</h2>
          <p>A new lead has been added to your LeadsFlow system:</p>
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #374151;">Lead Details:</h3>
            <p style="margin: 5px 0;"><strong>Name:</strong> ${leadName}</p>
            <p style="margin: 5px 0;"><strong>Lead ID:</strong> ${leadId}</p>
          </div>
          <p>You can view and manage this lead in your LeadsFlow dashboard.</p>
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size:14px;">
            <p>This is an automated notification from LeadsFlow.</p>
          </div>
        </div>
      `
    };

    const emailSent = await this.sendEmail(emailNotification);
    return pushSent || emailSent;
  }

  async notifyLeadUpdate(userId: string, userEmail: string, leadName: string, leadId: string, changes: string[]) {
    // ALWAYS create notification log in database for Recent Notifications
    try {
      const { storage } = await import('./storage.js');
      await storage.createNotificationLog({
        userId,
        type: 'lead_update',
        title: 'Lead Updated',
        message: `${leadName} - ${changes.join(', ')}`,
        read: false,
        metadata: {
          leadId,
          leadName,
          changes
        }
      });
      console.log(`📝 Notification log created for lead update: ${leadName}`);
    } catch (error) {
      console.error('Failed to create notification log:', error);
    }

    // Check if user has enabled follow-up notifications for EMAIL only
    const shouldSendEmail = await this.shouldSendNotification(userId, 'followUps');
    if (!shouldSendEmail) {
      console.log(`📧 Skipping lead update EMAIL for user ${userId} - email notifications disabled`);
      return true; // Return true since we successfully created the database log
    }

    const emailNotification: EmailNotification = {
      to: userEmail,
      subject: 'Lead Updated - LeadsFlow',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Lead Updated</h2>
          <p>A lead has been updated in your LeadsFlow system:</p>
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #374151;">Lead Details:</h3>
            <p style="margin: 5px 0;"><strong>Name:</strong> ${leadName}</p>
            <p style="margin: 5px 0;"><strong>Lead ID:</strong> ${leadId}</p>
            <p style="margin: 15px 0 10px 0;"><strong>Changes Made:</strong></p>
            <ul style="margin: 0; padding-left: 20px;">
              ${changes.map(change => `<li>${change}</li>`).join('')}
            </ul>
          </div>
          <p>You can view the updated lead in your LeadsFlow dashboard.</p>
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
            <p>This is an automated notification from LeadsFlow.</p>
          </div>
        </div>
      `
    };

    return await this.sendEmail(emailNotification);
  }

  async notifyLeadConverted(userId: string, userEmail: string, leadName: string, leadId: string) {
    // ALWAYS create notification log in database for Recent Notifications
    try {
      const { storage } = await import('./storage.js');
      await storage.createNotificationLog({
        userId,
        type: 'lead_converted',
        title: '🎉 Lead Converted',
        message: `${leadName} has been converted to a customer`,
        read: false,
        metadata: {
          leadId,
          leadName
        }
      });
      console.log(`📝 Notification log created for lead conversion: ${leadName}`);
    } catch (error) {
      console.error('Failed to create notification log:', error);
    }

    // Check if user has enabled conversion notifications for EMAIL only
    const shouldSendEmail = await this.shouldSendNotification(userId, 'conversions');
    if (!shouldSendEmail) {
      console.log(`📧 Skipping lead conversion EMAIL for user ${userId} - email notifications disabled`);
      return true; // Return true since we successfully created the database log
    }

    const emailNotification: EmailNotification = {
      to: userEmail,
      subject: '🎉 Lead Converted - LeadsFlow',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #059669;">🎉 Congratulations! Lead Converted</h2>
          <p>Great news! A lead has been successfully converted to a customer:</p>
          <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669;">
            <h3 style="margin: 0 0 10px 0; color: #065f46;">Lead Details:</h3>
            <p style="margin: 5px 0;"><strong>Name:</strong> ${leadName}</p>
            <p style="margin: 5px 0;"><strong>Lead ID:</strong> ${leadId}</p>
            <p style="margin: 15px 0 0 0; color: #059669;"><strong>Status:</strong> Converted to Customer</p>
          </div>
          <p>This conversion will be reflected in your analytics dashboard. Keep up the great work!</p>
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
            <p>This is an automated notification from LeadsFlow.</p>
          </div>
        </div>
      `
    };

    return await this.sendEmail(emailNotification);
  }

  async notifyHotLead(userId: string, userEmail: string, leadName: string, leadId: string) {
    // ALWAYS create notification log in database for Recent Notifications
    try {
      const { storage } = await import('./storage.js');
      await storage.createNotificationLog({
        userId,
        type: 'lead_update',
        title: '🔥 Hot Lead Alert',
        message: `${leadName} has been marked as HOT`,
        read: false,
        metadata: {
          leadId,
          leadName
        }
      });
      console.log(`📝 Notification log created for hot lead: ${leadName}`);
    } catch (error) {
      console.error('Failed to create notification log:', error);
    }

    // Check if user has enabled hot lead notifications for EMAIL only
    const shouldSendEmail = await this.shouldSendNotification(userId, 'hotLeads');
    if (!shouldSendEmail) {
      console.log(`📧 Skipping hot lead EMAIL for user ${userId} - email notifications disabled`);
      return true; // Return true since we successfully created the database log
    }

    const emailNotification: EmailNotification = {
      to: userEmail,
      subject: '🔥 Hot Lead Alert - LeadsFlow',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">🔥 Hot Lead Alert</h2>
          <p>A lead has been marked as HOT and requires immediate attention:</p>
          <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
            <h3 style="margin: 0 0 10px 0; color: #991b1b;">Lead Details:</h3>
            <p style="margin: 5px 0;"><strong>Name:</strong> ${leadName}</p>
            <p style="margin: 5px 0;"><strong>Lead ID:</strong> ${leadId}</p>
            <p style="margin: 15px 0 0 0; color: #dc2626;"><strong>Status:</strong> HOT LEAD - Immediate Action Required</p>
          </div>
          <p>Please contact this lead as soon as possible to maximize conversion chances!</p>
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
            <p>This is an automated notification from LeadsFlow.</p>
          </div>
        </div>
      `
    };

    return await this.sendEmail(emailNotification);
  }

  async notifyFollowUpReminder(userId: string, userEmail: string, leadName: string, leadId: string, followUpDate: string) {
    // ALWAYS create notification log in database for Recent Notifications
    try {
      const { storage } = await import('./storage.js');
      await storage.createNotificationLog({
        userId,
        type: 'followup',
        title: '⏰ Follow-up Reminder',
        message: `Follow-up reminder for ${leadName} on ${followUpDate}`,
        read: false,
        metadata: {
          leadId,
          leadName,
          followUpDate
        }
      });
      console.log(`📝 Notification log created for follow-up reminder: ${leadName}`);
    } catch (error) {
      console.error('Failed to create notification log:', error);
    }

    // Push notification (does not depend on email settings)
    let pushSent = false;
    const pushEnabled = await this.shouldSendPush(userId);
    if (pushEnabled) {
      pushSent = await this.sendPushNotification({
        userId,
        title: 'Follow-up Reminder',
        message: `It's time to follow up with ${leadName}.`,
        type: 'followup',
        data: {
          leadId,
          followUpDate,
          leadName,
        },
      });
    } else {
      console.log(`🔕 Push notifications disabled for user ${userId}, skipping follow-up push`);
    }

    // Check if user has enabled follow-up notifications for EMAIL only
    const shouldSendEmail = await this.shouldSendNotification(userId, 'followUps');
    if (!shouldSendEmail) {
      console.log(`📧 Skipping follow-up reminder EMAIL for user ${userId} - email notifications disabled`);
      return pushSent || true; // Return true since we successfully created the database log
    }

    const emailNotification: EmailNotification = {
      to: userEmail,
      subject: '⏰ Follow-up Reminder - LeadsFlow',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #f59e0b;">⏰ Follow-up Reminder</h2>
          <p>It's time to follow up with a lead:</p>
          <div style="background: #fffbeb; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
            <h3 style="margin: 0 0 10px 0; color: #92400e;">Lead Details:</h3>
            <p style="margin: 5px 0;"><strong>Name:</strong> ${leadName}</p>
            <p style="margin: 5px 0;"><strong>Lead ID:</strong> ${leadId}</p>
            <p style="margin: 15px 0 0 0; color: #f59e0b;"><strong>Follow-up Date:</strong> ${followUpDate}</p>
          </div>
          <p>Don't miss this opportunity to connect with your lead!</p>
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
            <p>This is an automated notification from LeadsFlow.</p>
          </div>
        </div>
      `
    };

    const emailSent = await this.sendEmail(emailNotification);
    return pushSent || emailSent;
  }

  async sendDailySummary(userId: string, userEmail: string, summaryData: any) {
    // Check if user has enabled daily summary notifications
    const shouldSend = await this.shouldSendNotification(userId, 'dailySummary');
    if (!shouldSend) {
      console.log(`📧 Skipping daily summary for user ${userId} - notifications disabled`);
      return false;
    }

    const emailNotification: EmailNotification = {
      to: userEmail,
      subject: '📊 Daily Summary - LeadsFlow',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">📊 Daily Summary Report</h2>
          <p>Here's your daily summary for ${new Date().toLocaleDateString()}:</p>
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin: 0 0 15px 0; color: #374151;">Today's Activity:</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
              <div style="background: white; padding: 15px; border-radius: 6px;">
                <h4 style="margin: 0 0 5px 0; color: #059669;">New Leads</h4>
                <p style="margin: 0; font-size: 24px; font-weight: bold; color: #059669;">${summaryData.newLeads || 0}</p>
              </div>
              <div style="background: white; padding: 15px; border-radius: 6px;">
                <h4 style="margin: 0 0 5px 0; color: #dc2626;">Hot Leads</h4>
                <p style="margin: 0; font-size: 24px; font-weight: bold; color: #dc2626;">${summaryData.hotLeads || 0}</p>
              </div>
              <div style="background: white; padding: 15px; border-radius: 6px;">
                <h4 style="margin: 0 0 5px 0; color: #f59e0b;">Follow-ups</h4>
                <p style="margin: 0; font-size: 24px; font-weight: bold; color: #f59e0b;">${summaryData.followUps || 0}</p>
              </div>
              <div style="background: white; padding: 15px; border-radius: 6px;">
                <h4 style="margin: 0 0 5px 0; color: #7c3aed;">Conversions</h4>
                <p style="margin: 0; font-size: 24px; font-weight: bold; color: #7c3aed;">${summaryData.conversions || 0}</p>
              </div>
            </div>
          </div>
          <p>Keep up the great work! Check your dashboard for more details.</p>
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
            <p>This is an automated notification from LeadsFlow.</p>
          </div>
        </div>
      `
    };

    return await this.sendEmail(emailNotification);
  }

  async notifyBatchImport(users: Array<{id: string, email: string}>, leadCount: number, importedBy: string) {
    const emailPromises = users.map(async (user) => {
      // Check if user has enabled new lead notifications
      const shouldSend = await this.shouldSendNotification(user.id, 'newLeads');
      if (!shouldSend) {
        console.log(`📧 Skipping batch import notification for user ${user.id} - notifications disabled`);
        return false;
      }

      const emailNotification: EmailNotification = {
        to: user.email,
        subject: `Bulk Import Completed - ${leadCount} Leads Added`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Bulk Import Completed</h2>
            <p>A bulk import operation has been completed in your LeadsFlow system:</p>
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0; color: #374151;">Import Summary:</h3>
              <p style="margin: 5px 0;"><strong>Total Leads Imported:</strong> ${leadCount}</p>
              <p style="margin: 5px 0;"><strong>Imported By:</strong> ${importedBy}</p>
              <p style="margin: 5px 0;"><strong>Import Date:</strong> ${new Date().toLocaleDateString()}</p>
            </div>
            <p>All imported leads are now available in your LeadsFlow dashboard for management.</p>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
              <p>This is an automated notification from LeadsFlow.</p>
            </div>
          </div>
        `
      };

      return await this.sendEmail(emailNotification);
    });

    const results = await Promise.all(emailPromises);
    const successCount = results.filter(result => result === true).length;
    console.log(`📧 Batch import notifications sent: ${successCount}/${users.length} successful`);
    return successCount;
  }

  // Test email functionality
  async testEmailConnection(): Promise<boolean> {
    if (!transporter) {
      console.log('No email transporter available');
      return false;
    }

    try {
      await new Promise((resolve, reject) => {
        if (transporter) {
          transporter.verify((error: Error | null, success: boolean) => {
            if (error) {
              reject(error);
            } else {
              resolve(success);
            }
          });
        } else {
          reject(new Error('No transporter available'));
        }
      });
      console.log('Email connection test successful');
      return true;
    } catch (error) {
      console.error('Email connection test failed:', error);
      return false;
    }
  }
}

export const notificationService = new NotificationService();

