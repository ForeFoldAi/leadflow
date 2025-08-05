import { MailService } from '@sendgrid/mail';

const mailService = new MailService();
let emailServiceConfigured = false;

if (process.env.SENDGRID_API_KEY && process.env.SENDGRID_API_KEY.startsWith('SG.')) {
  mailService.setApiKey(process.env.SENDGRID_API_KEY);
  emailServiceConfigured = true;
  console.log("SendGrid email service configured successfully");
} else {
  console.warn("SendGrid API key not properly configured. Email notifications will be simulated.");
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
  type: 'lead_created' | 'lead_updated' | 'lead_converted' | 'system';
  data?: any;
}

class NotificationService {
  private pushSubscriptions: Map<string, any> = new Map();

  // Email notifications
  async sendEmail(notification: EmailNotification): Promise<boolean> {
    if (!emailServiceConfigured) {
      // Simulate email sending when SendGrid is not properly configured
      console.log(`📧 [SIMULATED EMAIL] To: ${notification.to}`);
      console.log(`📧 [SIMULATED EMAIL] Subject: ${notification.subject}`);
      console.log(`📧 [SIMULATED EMAIL] Content: ${notification.text || 'HTML content provided'}`);
      console.log('📧 [SIMULATED EMAIL] Email would be sent successfully in production');
      return true;
    }

    try {
      await mailService.send({
        to: notification.to,
        from: 'notifications@leadflow.com', // You can change this to your verified sender
        subject: notification.subject,
        text: notification.text,
        html: notification.html || notification.text || '',
      });
      console.log(`📧 Email sent successfully to ${notification.to}: ${notification.subject}`);
      return true;
    } catch (error) {
      console.error('📧 SendGrid email error:', error);
      // Fall back to simulation if SendGrid fails
      console.log(`📧 [FALLBACK SIMULATION] To: ${notification.to}`);
      console.log(`📧 [FALLBACK SIMULATION] Subject: ${notification.subject}`);
      console.log('📧 [FALLBACK SIMULATION] Email delivery failed but notification logged');
      return false;
    }
  }

  // Push notifications (web push)
  subscribeToPush(userId: string, subscription: any) {
    this.pushSubscriptions.set(userId, subscription);
    console.log(`User ${userId} subscribed to push notifications`);
  }

  unsubscribeFromPush(userId: string) {
    this.pushSubscriptions.delete(userId);
    console.log(`User ${userId} unsubscribed from push notifications`);
  }

  async sendPushNotification(notification: PushNotification): Promise<boolean> {
    const subscription = this.pushSubscriptions.get(notification.userId);
    if (!subscription) {
      console.warn(`No push subscription found for user ${notification.userId}`);
      return false;
    }

    try {
      // For now, we'll store the notification for the user to retrieve
      // In a real implementation, you'd use web-push library to send actual push notifications
      console.log(`Push notification for user ${notification.userId}: ${notification.title} - ${notification.message}`);
      return true;
    } catch (error) {
      console.error('Push notification error:', error);
      return false;
    }
  }

  // Lead-specific notification helpers
  async notifyNewLead(userEmail: string, leadName: string, leadId: string) {
    const emailNotification: EmailNotification = {
      to: userEmail,
      subject: 'New Lead Added - LeadFlow',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">New Lead Added</h2>
          <p>A new lead has been added to your LeadFlow system:</p>
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #374151;">Lead Details:</h3>
            <p style="margin: 5px 0;"><strong>Name:</strong> ${leadName}</p>
            <p style="margin: 5px 0;"><strong>Lead ID:</strong> ${leadId}</p>
          </div>
          <p>You can view and manage this lead in your LeadFlow dashboard.</p>
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
            <p>This is an automated notification from LeadFlow.</p>
          </div>
        </div>
      `
    };

    return await this.sendEmail(emailNotification);
  }

  async notifyLeadUpdate(userEmail: string, leadName: string, leadId: string, changes: string[]) {
    const emailNotification: EmailNotification = {
      to: userEmail,
      subject: 'Lead Updated - LeadFlow',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Lead Updated</h2>
          <p>A lead has been updated in your LeadFlow system:</p>
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #374151;">Lead Details:</h3>
            <p style="margin: 5px 0;"><strong>Name:</strong> ${leadName}</p>
            <p style="margin: 5px 0;"><strong>Lead ID:</strong> ${leadId}</p>
            <p style="margin: 15px 0 10px 0;"><strong>Changes Made:</strong></p>
            <ul style="margin: 0; padding-left: 20px;">
              ${changes.map(change => `<li>${change}</li>`).join('')}
            </ul>
          </div>
          <p>You can view the updated lead in your LeadFlow dashboard.</p>
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
            <p>This is an automated notification from LeadFlow.</p>
          </div>
        </div>
      `
    };

    return await this.sendEmail(emailNotification);
  }

  async notifyLeadConverted(userEmail: string, leadName: string, leadId: string) {
    const emailNotification: EmailNotification = {
      to: userEmail,
      subject: '🎉 Lead Converted - LeadFlow',
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
            <p>This is an automated notification from LeadFlow.</p>
          </div>
        </div>
      `
    };

    return await this.sendEmail(emailNotification);
  }
}

export const notificationService = new NotificationService();