import nodemailer from 'nodemailer';
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
let transporter = null;
// Initialize email service
if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
        transporter = createTransporter();
        emailServiceConfigured = true;
        console.log("Nodemailer email service configured successfully");
        // Verify connection configuration
        if (transporter) {
            transporter.verify((error, success) => {
                if (error) {
                    console.error('SMTP connection error:', error);
                    emailServiceConfigured = false;
                }
                else {
                    console.log('SMTP server is ready to take our messages');
                }
            });
        }
    }
    catch (error) {
        console.error('Failed to create email transporter:', error);
        emailServiceConfigured = false;
    }
}
else {
    console.warn("SMTP credentials not properly configured. Email notifications will be simulated.");
}
class NotificationService {
    constructor() {
        this.pushSubscriptions = new Map();
    }
    // Get user notification settings
    async getUserNotificationSettings(userId) {
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
    async shouldSendNotification(userId, notificationType) {
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
    isAuthenticationEmail(subject, type) {
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
    async sendEmail(notification) {
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
            return false;
        }
    }
    // Push notifications (web push)
    subscribeToPush(userId, subscription) {
        this.pushSubscriptions.set(userId, subscription);
        console.log(`User ${userId} subscribed to push notifications`);
    }
    unsubscribeFromPush(userId) {
        this.pushSubscriptions.delete(userId);
        console.log(`User ${userId} unsubscribed from push notifications`);
    }
    async sendPushNotification(notification) {
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
        }
        catch (error) {
            console.error('Push notification error:', error);
            return false;
        }
    }
    // Lead-specific notification helpers with user settings check
    async notifyNewLead(userId, userEmail, leadName, leadId) {
        // Check if user has enabled new lead notifications
        const shouldSend = await this.shouldSendNotification(userId, 'newLeads');
        if (!shouldSend) {
            console.log(`📧 Skipping new lead notification for user ${userId} - notifications disabled`);
            return false;
        }

        const emailNotification = {
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
                    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
                        <p>This is an automated notification from LeadsFlow.</p>
                    </div>
                </div>
            `
        };

        // Create notification log in database
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
        } catch (error) {
            console.error('Failed to create notification log:', error);
        }

        return await this.sendEmail(emailNotification);
    }

    async notifyLeadUpdate(userId, userEmail, leadName, leadId, changes) {
        // Check if user has enabled follow-up notifications
        const shouldSend = await this.shouldSendNotification(userId, 'followUps');
        if (!shouldSend) {
            console.log(`📧 Skipping lead update notification for user ${userId} - notifications disabled`);
            return false;
        }

        const emailNotification = {
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

        // Create notification log in database
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
        } catch (error) {
            console.error('Failed to create notification log:', error);
        }

        return await this.sendEmail(emailNotification);
    }

    async notifyLeadConverted(userId, userEmail, leadName, leadId) {
        // Check if user has enabled conversion notifications
        const shouldSend = await this.shouldSendNotification(userId, 'conversions');
        if (!shouldSend) {
            console.log(`📧 Skipping lead conversion notification for user ${userId} - notifications disabled`);
            return false;
        }

        const emailNotification = {
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

        // Create notification log in database
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
        } catch (error) {
            console.error('Failed to create notification log:', error);
        }

        return await this.sendEmail(emailNotification);
    }

    async notifyHotLead(userId, userEmail, leadName, leadId) {
        // Check if user has enabled hot lead notifications
        const shouldSend = await this.shouldSendNotification(userId, 'hotLeads');
        if (!shouldSend) {
            console.log(`📧 Skipping hot lead notification for user ${userId} - notifications disabled`);
            return false;
        }

        const emailNotification = {
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

    async notifyFollowUpReminder(userId, userEmail, leadName, leadId, followUpDate) {
        // Check if user has enabled follow-up notifications
        const shouldSend = await this.shouldSendNotification(userId, 'followUps');
        if (!shouldSend) {
            console.log(`📧 Skipping follow-up reminder for user ${userId} - notifications disabled`);
            return false;
        }

        const emailNotification = {
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

        return await this.sendEmail(emailNotification);
    }

    async sendDailySummary(userId, userEmail, summaryData) {
        // Check if user has enabled daily summary notifications
        const shouldSend = await this.shouldSendNotification(userId, 'dailySummary');
        if (!shouldSend) {
            console.log(`📧 Skipping daily summary for user ${userId} - notifications disabled`);
            return false;
        }

        const emailNotification = {
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
                            <div style="margin: 0 0 5px 0; color: #7c3aed;">Conversions</h4>
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

    async notifyBatchImport(users, leadCount, importedBy) {
        const emailPromises = users.map(async (user) => {
            // Check if user has enabled new lead notifications
            const shouldSend = await this.shouldSendNotification(user.id, 'newLeads');
            if (!shouldSend) {
                console.log(`📧 Skipping batch import notification for user ${user.id} - notifications disabled`);
                return false;
            }

            const emailNotification = {
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
    async testEmailConnection() {
        if (!transporter) {
            console.log('No email transporter available');
            return false;
        }
        try {
            await new Promise((resolve, reject) => {
                if (transporter) {
                    transporter.verify((error, success) => {
                        if (error) {
                            reject(error);
                        }
                        else {
                            resolve(success);
                        }
                    });
                }
                else {
                    reject(new Error('No transporter available'));
                }
            });
            console.log('Email connection test successful');
            return true;
        }
        catch (error) {
            console.error('Email connection test failed:', error);
            return false;
        }
    }
}
export const notificationService = new NotificationService();
