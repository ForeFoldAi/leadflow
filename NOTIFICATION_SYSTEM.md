# 📧 Notification System Documentation

## Overview

The LeadsFlow notification system sends emails to users based on their individual notification preferences. Users can control which types of notifications they receive through the Settings page.

## 🎛️ User Notification Settings

Users can configure the following notification types in **Settings > Notifications**:

### Email Notifications
- **New Leads** - Notified when a new lead is added
- **Follow-ups** - Notified when leads are updated or follow-up reminders are due
- **Hot Leads** - Notified when a lead is marked as "Hot"
- **Conversions** - Notified when a lead is converted to a customer
- **Daily Summary** - Receive daily summary reports
- **Email Notifications** - Master toggle for all email notifications

### Push Notifications
- **Browser Push** - Receive browser push notifications for lead events and follow-up reminders.
  - Delivered via Firebase Cloud Messaging (FCM) with background service worker support.
  - Users opt-in from **Settings → Notifications → Browser Notifications**.
  - Tokens are stored per-user and invalid tokens are cleaned up automatically.
  - Follow-up reminders are delivered even when email notifications are disabled.

## 📧 Email Notification Types

### 1. New Lead Notification
- **Trigger**: When a new lead is created
- **Subject**: "New Lead Added - LeadsFlow"
- **Content**: Lead name, ID, and basic details
- **Setting**: `newLeads`

### 2. Lead Update Notification
- **Trigger**: When a lead is updated
- **Subject**: "Lead Updated - LeadsFlow"
- **Content**: Lead details and list of changes made
- **Setting**: `followUps`

### 3. Lead Conversion Notification
- **Trigger**: When a lead status changes to "Converted"
- **Subject**: "🎉 Lead Converted - LeadsFlow"
- **Content**: Congratulations message with lead details
- **Setting**: `conversions`

### 4. Hot Lead Alert
- **Trigger**: When a lead is marked as "Hot"
- **Subject**: "🔥 Hot Lead Alert - LeadsFlow"
- **Content**: Urgent notification requiring immediate attention
- **Setting**: `hotLeads`

### 5. Follow-up Reminder
- **Trigger**: When a follow-up date is reached
- **Subject**: "⏰ Follow-up Reminder - LeadsFlow"
- **Content**: Reminder with lead details and follow-up date
- **Setting**: `followUps`

### 6. Daily Summary
- **Trigger**: Daily automated report
- **Subject**: "📊 Daily Summary - LeadsFlow"
- **Content**: Summary of daily activities (new leads, hot leads, follow-ups, conversions)
- **Setting**: `dailySummary`

## 🔧 How It Works

### 1. User Settings Check
Before sending any notification, the system checks the user's notification preferences:

```typescript
// Check if user has enabled specific notification type
private async shouldSendNotification(userId: string, notificationType: keyof UserNotificationSettings): Promise<boolean> {
  const settings = await this.getUserNotificationSettings(userId);
  
  // Check if email notifications are globally enabled
  if (!settings.emailNotifications) {
    return false;
  }
  
  // Check specific notification type
  return settings[notificationType] || false;
}
```

### 2. Notification Flow
1. **Event Occurs** (e.g., new lead created)
2. **Get User Settings** - Fetch user's notification preferences
3. **Check Permission** - Verify if user wants this type of notification
4. **Send Email** - If permitted, send the notification
5. **Log Result** - Record success/failure

### 3. Follow-up Reminder Scheduler
- A background job (`startFollowUpReminderScheduler`) scans daily follow-up windows every `FOLLOWUP_REMINDER_INTERVAL_MINUTES` (default 60 minutes).
- Only leads whose `nextFollowupDate` falls on the current day and that have not already triggered a notification will be processed.
- Reminders always create a notification log and attempt push delivery when browser push is enabled.
- Invalid or expired push tokens are automatically removed after FCM rejects them.

### 4. Default Behavior
- If no user settings are found, notifications are **enabled by default**
- If `emailNotifications` is disabled, **no emails are sent**
- Individual notification types can be toggled independently

## 🧪 Testing the System

### Test Script
Run the notification test script:

```bash
node test-notifications.cjs
```

This will test all notification types and send sample emails.

### Manual Testing
1. **Go to Settings** - Configure your notification preferences
2. **Create/Update Leads** - Trigger notifications through normal usage
3. **Check Email** - Verify notifications are received (check spam folder)

## 📋 Configuration

### Environment Variables
```env
# SMTP Configuration
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=noreply@forefoldai.com
SMTP_PASS=your_password
SMTP_FROM=noreply@forefoldai.com

# Firebase Admin (server)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Follow-up Scheduler (optional)
FOLLOWUP_REMINDER_INTERVAL_MINUTES=60
FOLLOWUP_REMINDER_BATCH_LIMIT=250
# Set to "true" to disable the scheduler entirely
DISABLE_FOLLOWUP_REMINDERS=false

# Test Email (optional helper script)
TEST_EMAIL=your_test_email@gmail.com

# Client-side Firebase (Vite)
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=messaging_sender_id
VITE_FIREBASE_APP_ID=1:sender:web:app_id
VITE_FIREBASE_VAPID_KEY=web_push_certificate_key
```

### User Settings Schema
```typescript
interface UserNotificationSettings {
  newLeads: boolean;
  followUps: boolean;
  hotLeads: boolean;
  conversions: boolean;
  browserPush: boolean;
  dailySummary: boolean;
  emailNotifications: boolean;
}
```

## 🎨 Email Templates

All notifications use HTML email templates with:
- **Responsive Design** - Works on mobile and desktop
- **Brand Colors** - Uses LeadsFlow color scheme
- **Clear Typography** - Easy to read and scan
- **Actionable Content** - Includes relevant information and next steps

### Template Features
- **Header** - Clear subject and branding
- **Content Section** - Lead details and relevant information
- **Call-to-Action** - Direct users to the dashboard
- **Footer** - Automated notification disclaimer

## 🔄 Integration Points

### Lead Management
- **Create Lead** → New Lead Notification
- **Update Lead** → Lead Update Notification
- **Convert Lead** → Lead Conversion Notification
- **Mark as Hot** → Hot Lead Alert

### Follow-up System
- **Follow-up Due** → Follow-up Reminder
- **Daily Summary** → Automated daily report

### User Management
- **Settings Page** → Configure notification preferences
- **User Profile** → Store notification settings

## 🚀 Future Enhancements

### Planned Features
1. **Push Notifications** - Browser and mobile push notifications
2. **SMS Notifications** - Text message alerts for urgent items
3. **Slack Integration** - Send notifications to Slack channels
4. **Custom Templates** - Allow users to customize email templates
5. **Notification History** - Track sent notifications
6. **Scheduled Reports** - Weekly/monthly summary reports

### Advanced Features
1. **Notification Frequency** - Control how often notifications are sent
2. **Quiet Hours** - Don't send notifications during certain times
3. **Escalation Rules** - Automatic escalation for urgent items
4. **Team Notifications** - Notify team members based on roles

## 🐛 Troubleshooting

### Common Issues

#### Not Receiving Emails
1. **Check Spam Folder** - Emails might be filtered
2. **Verify Settings** - Ensure notifications are enabled in Settings
3. **Check SMTP Configuration** - Verify email server settings
4. **Test Connection** - Run `node test-email.cjs`

#### Wrong Notification Types
1. **Check User Settings** - Verify notification preferences
2. **Clear Cache** - Refresh browser and clear local storage
3. **Check Database** - Verify settings are saved correctly

#### Email Delivery Issues
1. **SMTP Configuration** - Check host, port, and credentials
2. **Rate Limiting** - Some providers limit email frequency
3. **Authentication** - Ensure proper SMTP authentication

### Debug Commands
```bash
# Test email connection
node test-email.cjs

# Test notification system
node test-notifications.cjs

# Check server logs
npm run dev
```

## 📞 Support

If you encounter issues with the notification system:

1. **Check the logs** - Server console will show notification attempts
2. **Verify settings** - Ensure notification preferences are correct
3. **Test manually** - Use the test scripts to verify functionality
4. **Contact support** - If issues persist, provide logs and settings

---

**Last Updated**: January 2025
**Version**: 1.0.0 