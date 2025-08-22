# 🔐 Two-Factor Authentication (2FA) Documentation

## Overview

LeadsFlow now supports Two-Factor Authentication (2FA) using email-based OTP (One-Time Password) verification. This adds an extra layer of security to user accounts by requiring both a password and a time-sensitive code sent to the user's registered email address.

## 🎯 Features

### Core 2FA Features
- **Email-based OTP** - 6-digit codes sent to registered email
- **Time-limited codes** - OTP expires after 10 minutes
- **Attempt limiting** - Maximum 3 attempts per OTP
- **Automatic cleanup** - Expired sessions are automatically removed
- **User control** - Users can enable/disable 2FA from Settings
- **Beautiful UI** - Professional verification interface with countdown timer

### Security Features
- **Session management** - Secure OTP session handling
- **Rate limiting** - Prevents brute force attacks
- **Audit logging** - All 2FA activities are logged
- **Fallback options** - Backup codes for account recovery (future feature)

## 🔧 How It Works

### 1. 2FA Setup Process
1. **User enables 2FA** in Settings → Security
2. **System updates** user's security settings
3. **2FA is now active** for the account

### 2. Login with 2FA
1. **User enters** email and password
2. **System checks** if 2FA is enabled
3. **If enabled**:
   - Sends OTP to user's email
   - Shows 2FA verification screen
   - User enters 6-digit code
   - System verifies OTP
   - User is logged in if correct
4. **If disabled**: Normal login process

### 3. OTP Verification
- **6-digit numeric code** (000000-999999)
- **10-minute expiration** from generation
- **3 attempts maximum** per OTP
- **Automatic cleanup** of expired sessions

## 📧 Email Templates

### 2FA OTP Email
```
Subject: 🔐 Two-Factor Authentication Code - LeadsFlow

Hello [UserName],

You have enabled two-factor authentication for your LeadsFlow account. 
Please use the following code to complete your login:

┌─────────────────────────────────────┐
│                                     │
│             123456                  │
│                                     │
└─────────────────────────────────────┘

⚠️ Important Security Information:
• This code will expire in 10 minutes
• You have 3 attempts to enter the correct code
• Never share this code with anyone
• If you didn't request this code, please contact support immediately

This is an automated security message from LeadsFlow.
```

## 🛠️ Technical Implementation

### Backend Components

#### 1. Two-Factor Authentication Service (`server/two-factor-auth.ts`)
```typescript
class TwoFactorAuthService {
  // Core methods
  async sendTwoFactorOTP(userId: string, userEmail: string, userName: string): Promise<boolean>
  verifyTwoFactorOTP(userId: string, providedOTP: string): VerificationResult
  hasActiveSession(userId: string): boolean
  clearSession(userId: string): void
}
```

#### 2. Database Schema Updates
```sql
-- Security Settings table
ALTER TABLE security_settings ADD COLUMN two_factor_method TEXT DEFAULT 'email';
ALTER TABLE security_settings ADD COLUMN two_factor_secret TEXT;
ALTER TABLE security_settings ADD COLUMN two_factor_backup_codes JSONB;
ALTER TABLE security_settings ADD COLUMN last_two_factor_setup TIMESTAMP;
```

#### 3. API Endpoints
```typescript
// 2FA Management
POST /api/auth/2fa/enable          // Enable 2FA
POST /api/auth/2fa/disable         // Disable 2FA
GET  /api/auth/2fa/status          // Get 2FA status

// 2FA Authentication
POST /api/auth/2fa/send-otp        // Send OTP
POST /api/auth/2fa/verify-otp      // Verify OTP
```

### Frontend Components

#### 1. 2FA Verification Component (`client/src/components/two-factor-auth.tsx`)
- **Professional UI** with countdown timer
- **Input validation** for 6-digit codes
- **Error handling** with remaining attempts display
- **Resend functionality** with cooldown
- **Responsive design** for all devices

#### 2. Settings Integration
- **2FA toggle** in Security Settings
- **Status display** showing current 2FA state
- **Enable/disable** functionality with loading states

#### 3. Login Flow Integration
- **Automatic detection** of 2FA requirement
- **Seamless transition** to 2FA verification
- **Back to login** option if needed

## 🚀 Usage Guide

### For Users

#### Enabling 2FA
1. **Go to Settings** → Security tab
2. **Click "Enable 2FA"** button
3. **Confirm** the action
4. **2FA is now active** for your account

#### Logging in with 2FA
1. **Enter email and password** as usual
2. **Check your email** for the 6-digit code
3. **Enter the code** in the verification screen
4. **Click "Verify Code"** to complete login
5. **If code expires**, click "Resend Code"

#### Disabling 2FA
1. **Go to Settings** → Security tab
2. **Click "Disable 2FA"** button
3. **Confirm** the action
4. **2FA is now disabled** for your account

### For Developers

#### Testing 2FA
```bash
# Test 2FA functionality
node test-2fa.cjs

# Test email notifications
node test-notifications.cjs
```

#### API Testing
```bash
# Enable 2FA
curl -X POST http://localhost:3000/api/auth/2fa/enable \
  -H "Content-Type: application/json" \
  -H "x-user-email: user@example.com" \
  -H "x-user-id: user-id"

# Send OTP
curl -X POST http://localhost:3000/api/auth/2fa/send-otp \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'

# Verify OTP
curl -X POST http://localhost:3000/api/auth/2fa/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "otp": "123456"}'
```

## 🔒 Security Considerations

### Best Practices
1. **Never store OTPs** in plain text
2. **Use secure session management** for OTP storage
3. **Implement rate limiting** to prevent abuse
4. **Log all 2FA activities** for audit purposes
5. **Provide clear error messages** without revealing sensitive information

### Security Features
- **Time-limited OTPs** (10 minutes)
- **Attempt limiting** (3 attempts per OTP)
- **Automatic session cleanup** (expired sessions removed)
- **Secure email delivery** (using existing SMTP infrastructure)
- **Audit logging** (all 2FA activities logged)

### Future Enhancements
- **Backup codes** for account recovery
- **Authenticator app support** (TOTP)
- **SMS-based 2FA** as alternative
- **Hardware key support** (FIDO2)
- **Advanced threat detection** (suspicious login patterns)

## 🐛 Troubleshooting

### Common Issues

#### OTP Not Received
1. **Check spam folder** - OTP emails might be filtered
2. **Verify email address** - Ensure correct email is registered
3. **Check SMTP settings** - Verify email service configuration
4. **Wait a few minutes** - Email delivery can be delayed

#### Invalid OTP Error
1. **Check code carefully** - Ensure all 6 digits are correct
2. **Check expiration** - OTP expires after 10 minutes
3. **Check attempts** - Maximum 3 attempts per OTP
4. **Request new OTP** - Click "Resend Code" if needed

#### 2FA Not Working
1. **Verify 2FA is enabled** - Check Settings → Security
2. **Check server logs** - Look for error messages
3. **Test email delivery** - Run `node test-email.cjs`
4. **Check database** - Verify security settings are saved

### Debug Commands
```bash
# Test email functionality
node test-email.cjs

# Test 2FA system
node test-2fa.cjs

# Test notifications
node test-notifications.cjs

# Check server logs
npm run dev
```

## 📋 Configuration

### Environment Variables
```env
# SMTP Configuration (required for 2FA emails)
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=noreply@forefoldai.com
SMTP_PASS=your_password
SMTP_FROM=noreply@forefoldai.com

# Test Configuration
TEST_EMAIL=your_test_email@gmail.com
```

### Database Migration
```sql
-- Add 2FA fields to security_settings table
ALTER TABLE security_settings 
ADD COLUMN IF NOT EXISTS two_factor_method TEXT DEFAULT 'email',
ADD COLUMN IF NOT EXISTS two_factor_secret TEXT,
ADD COLUMN IF NOT EXISTS two_factor_backup_codes JSONB,
ADD COLUMN IF NOT EXISTS last_two_factor_setup TIMESTAMP;
```

## 🎨 UI/UX Features

### 2FA Verification Screen
- **Clean, professional design** with security branding
- **Large, easy-to-read OTP input** with monospace font
- **Real-time countdown timer** showing OTP expiration
- **Clear error messages** with remaining attempts
- **Resend functionality** with appropriate cooldown
- **Back to login** option for user convenience

### Settings Integration
- **Clear 2FA status** showing enabled/disabled state
- **One-click enable/disable** with confirmation
- **Loading states** during operations
- **Success/error feedback** via toast notifications

## 📊 Monitoring & Analytics

### Logged Events
- **2FA enable/disable** actions
- **OTP generation** and delivery attempts
- **OTP verification** attempts (success/failure)
- **Session cleanup** activities
- **Error conditions** and failures

### Metrics to Track
- **2FA adoption rate** (percentage of users with 2FA enabled)
- **OTP delivery success rate** (emails sent vs. delivered)
- **Verification success rate** (successful vs. failed verifications)
- **Average verification time** (time from OTP send to verification)
- **Error rates** by type (expired, invalid, max attempts)

## 🔮 Future Roadmap

### Phase 1 (Current)
- ✅ Email-based 2FA
- ✅ User enable/disable controls
- ✅ Professional UI/UX
- ✅ Security best practices

### Phase 2 (Planned)
- 🔄 Backup codes for account recovery
- 🔄 Authenticator app support (TOTP)
- 🔄 Advanced session management
- 🔄 Security event logging

### Phase 3 (Future)
- 📋 SMS-based 2FA alternative
- 📋 Hardware key support (FIDO2)
- 📋 Advanced threat detection
- 📋 Multi-factor authentication options

---

**Last Updated**: January 2025
**Version**: 1.0.0
**Status**: Production Ready ✅ 