# Email Setup with Nodemailer

This guide explains how to configure Nodemailer for sending emails in LeadsFlow.

## Environment Variables

Add the following environment variables to your `.env` file:

```env
# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=your-email@gmail.com
```

## SMTP Provider Options

### 1. Gmail (Recommended for Development)

**Setup Steps:**
1. Enable 2-Factor Authentication on your Google account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a new app password for "Mail"
3. Use the generated password as `SMTP_PASS`

**Configuration:**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-character-app-password
SMTP_FROM=your-email@gmail.com
```

### 2. Outlook/Hotmail

**Configuration:**
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
SMTP_FROM=your-email@outlook.com
```

### 3. Yahoo Mail

**Configuration:**
```env
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@yahoo.com
SMTP_PASS=your-app-password
SMTP_FROM=your-email@yahoo.com
```

### 4. Custom SMTP Server

**Configuration:**
```env
SMTP_HOST=your-smtp-server.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-username
SMTP_PASS=your-password
SMTP_FROM=noreply@yourdomain.com
```

### 5. SendGrid

**Configuration:**
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
SMTP_FROM=noreply@yourdomain.com
```

### 6. Mailgun

**Configuration:**
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-mailgun-username
SMTP_PASS=your-mailgun-password
SMTP_FROM=noreply@yourdomain.com
```

### 7. Hostinger Mail

**Setup Steps:**
1. Log in to your Hostinger control panel
2. Go to "Email" section
3. Create a new email account or use existing one
4. Get SMTP credentials from Hostinger

**Configuration:**
```env
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@yourdomain.com
SMTP_PASS=your-email-password
SMTP_FROM=your-email@yourdomain.com
```

**Alternative Hostinger SMTP Settings (if above doesn't work):**
```env
SMTP_HOST=mail.yourdomain.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@yourdomain.com
SMTP_PASS=your-email-password
SMTP_FROM=your-email@yourdomain.com
```

## Testing Email Configuration

You can test your email configuration by calling the test method:

```typescript
import { notificationService } from './server/notifications';

// Test email connection
const isConnected = await notificationService.testEmailConnection();
console.log('Email connection test:', isConnected ? 'SUCCESS' : 'FAILED');
```

## Troubleshooting

### Common Issues:

1. **Authentication Failed**
   - Ensure you're using the correct username/password
   - For Gmail, make sure you're using an App Password, not your regular password
   - Check if 2FA is enabled (required for Gmail App Passwords)

2. **Connection Timeout**
   - Verify the SMTP host and port are correct
   - Check if your firewall is blocking the connection
   - Try different ports (587, 465, 25)

3. **Gmail "Less secure app access"**
   - Gmail no longer supports "less secure app access"
   - You must use App Passwords with 2FA enabled

4. **Rate Limiting**
   - Most providers have daily sending limits
   - Gmail: 500 emails/day for regular accounts, 2000/day for Google Workspace
   - Consider using a dedicated email service for production

## Production Recommendations

For production applications, consider using:

1. **SendGrid** - Reliable, high deliverability, good free tier
2. **Mailgun** - Developer-friendly, good API
3. **Amazon SES** - Cost-effective for high volume
4. **Postmark** - Excellent deliverability for transactional emails

## Security Notes

- Never commit your `.env` file to version control
- Use environment variables for all sensitive configuration
- Consider using a dedicated email service for production
- Regularly rotate your email passwords/API keys
- Monitor your email sending logs for any issues

## Migration from Resend

If you were previously using Resend:

1. Remove the `RESEND_API_KEY` environment variable
2. Add the SMTP configuration variables above
3. The email functionality will work the same way, just with a different backend
4. All existing email templates and notification methods remain unchanged 