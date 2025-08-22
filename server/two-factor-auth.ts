import { notificationService } from './notifications';
import crypto from 'crypto';

export interface TwoFactorSession {
  userId: string;
  email: string;
  otp: string;
  expiresAt: Date;
  attempts: number;
  maxAttempts: number;
}

class TwoFactorAuthService {
  private activeSessions: Map<string, TwoFactorSession> = new Map();
  private readonly OTP_EXPIRY_MINUTES = 10; // OTP expires in 10 minutes
  private readonly MAX_ATTEMPTS = 3; // Maximum OTP attempts

  // Generate a 6-digit OTP
  private generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Create a session key for storing OTP sessions
  private createSessionKey(userId: string): string {
    return `2fa_${userId}`;
  }

  // Clean up expired sessions
  private cleanupExpiredSessions() {
    const now = new Date();
    const keysToDelete: string[] = [];
    
    this.activeSessions.forEach((session, key) => {
      if (session.expiresAt < now) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => {
      this.activeSessions.delete(key);
    });
  }

  // Send 2FA OTP via email
  async sendTwoFactorOTP(userId: string, userEmail: string, userName: string): Promise<boolean> {
    try {
      // Clean up expired sessions first
      this.cleanupExpiredSessions();

      // Generate new OTP
      const otp = this.generateOTP();
      const expiresAt = new Date(Date.now() + this.OTP_EXPIRY_MINUTES * 60 * 1000);

      // Create or update session
      const sessionKey = this.createSessionKey(userId);
      const session: TwoFactorSession = {
        userId,
        email: userEmail,
        otp,
        expiresAt,
        attempts: 0,
        maxAttempts: this.MAX_ATTEMPTS
      };

      this.activeSessions.set(sessionKey, session);

      // Send OTP via email
      const emailNotification = {
        to: userEmail,
        subject: '🔐 Two-Factor Authentication Code - LeadsFlow',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">🔐 Two-Factor Authentication</h2>
            <p>Hello ${userName},</p>
            <p>You have enabled two-factor authentication for your LeadsFlow account. Please use the following code to complete your login:</p>
            
            <div style="background: #f3f4f6; padding: 30px; border-radius: 12px; margin: 30px 0; text-align: center; border: 2px dashed #d1d5db;">
              <h1 style="margin: 0; font-size: 48px; font-weight: bold; color: #2563eb; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                ${otp}
              </h1>
            </div>
            
            <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
              <h4 style="margin: 0 0 10px 0; color: #92400e;">⚠️ Important Security Information:</h4>
              <ul style="margin: 0; padding-left: 20px; color: #92400e;">
                <li>This code will expire in ${this.OTP_EXPIRY_MINUTES} minutes</li>
                <li>You have ${this.MAX_ATTEMPTS} attempts to enter the correct code</li>
                <li>Never share this code with anyone</li>
                <li>If you didn't request this code, please contact support immediately</li>
              </ul>
            </div>
            
            <p style="color: #6b7280; font-size: 14px;">
              This is an automated security message from LeadsFlow. Please do not reply to this email.
            </p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px;">
              <p>For security reasons, this code will expire automatically. If you need a new code, please log in again.</p>
            </div>
          </div>
        `
      };

      const success = await notificationService.sendEmail(emailNotification);
      
      if (success) {
        console.log(`🔐 2FA OTP sent to ${userEmail} for user ${userId}`);
        return true;
      } else {
        console.error(`🔐 Failed to send 2FA OTP to ${userEmail} for user ${userId}`);
        return false;
      }
    } catch (error) {
      console.error('🔐 Error sending 2FA OTP:', error);
      return false;
    }
  }

  // Verify 2FA OTP
  verifyTwoFactorOTP(userId: string, providedOTP: string): { success: boolean; message: string; remainingAttempts?: number } {
    try {
      // Clean up expired sessions first
      this.cleanupExpiredSessions();

      const sessionKey = this.createSessionKey(userId);
      const session = this.activeSessions.get(sessionKey);

      if (!session) {
        return {
          success: false,
          message: 'No active 2FA session found. Please request a new OTP.'
        };
      }

      // Check if session has expired
      if (session.expiresAt < new Date()) {
        this.activeSessions.delete(sessionKey);
        return {
          success: false,
          message: '2FA code has expired. Please request a new OTP.'
        };
      }

      // Check if max attempts exceeded
      if (session.attempts >= session.maxAttempts) {
        this.activeSessions.delete(sessionKey);
        return {
          success: false,
          message: 'Maximum attempts exceeded. Please request a new OTP.'
        };
      }

      // Increment attempts
      session.attempts++;

      // Verify OTP
      if (session.otp === providedOTP) {
        // Success - remove session
        this.activeSessions.delete(sessionKey);
        console.log(`🔐 2FA verification successful for user ${userId}`);
        return {
          success: true,
          message: '2FA verification successful.'
        };
      } else {
        // Failed attempt
        const remainingAttempts = session.maxAttempts - session.attempts;
        
        if (remainingAttempts <= 0) {
          // Max attempts reached - remove session
          this.activeSessions.delete(sessionKey);
          return {
            success: false,
            message: 'Maximum attempts exceeded. Please request a new OTP.'
          };
        }

        return {
          success: false,
          message: `Invalid 2FA code. ${remainingAttempts} attempts remaining.`,
          remainingAttempts
        };
      }
    } catch (error) {
      console.error('🔐 Error verifying 2FA OTP:', error);
      return {
        success: false,
        message: 'An error occurred during verification. Please try again.'
      };
    }
  }

  // Check if user has an active 2FA session
  hasActiveSession(userId: string): boolean {
    const sessionKey = this.createSessionKey(userId);
    const session = this.activeSessions.get(sessionKey);
    
    if (!session) return false;
    
    // Check if session has expired
    if (session.expiresAt < new Date()) {
      this.activeSessions.delete(sessionKey);
      return false;
    }
    
    return true;
  }

  // Get remaining attempts for a user
  getRemainingAttempts(userId: string): number {
    const sessionKey = this.createSessionKey(userId);
    const session = this.activeSessions.get(sessionKey);
    
    if (!session || session.expiresAt < new Date()) {
      return 0;
    }
    
    return session.maxAttempts - session.attempts;
  }

  // Clear 2FA session (for logout or manual cleanup)
  clearSession(userId: string): void {
    const sessionKey = this.createSessionKey(userId);
    this.activeSessions.delete(sessionKey);
  }

  // Generate backup codes for account recovery
  generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < 8; i++) {
      // Generate 8-digit backup codes
      const code = Math.floor(10000000 + Math.random() * 90000000).toString();
      codes.push(code);
    }
    return codes;
  }

  // Verify backup code
  verifyBackupCode(userId: string, providedCode: string, storedCodes: string[]): boolean {
    // In a real implementation, you'd hash the backup codes and compare hashes
    // For now, we'll do a simple comparison
    return storedCodes.includes(providedCode);
  }
}

export const twoFactorAuthService = new TwoFactorAuthService(); 