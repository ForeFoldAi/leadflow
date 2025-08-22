export interface TwoFactorSession {
    userId: string;
    email: string;
    otp: string;
    expiresAt: Date;
    attempts: number;
    maxAttempts: number;
}
declare class TwoFactorAuthService {
    private activeSessions;
    private readonly OTP_EXPIRY_MINUTES;
    private readonly MAX_ATTEMPTS;
    private generateOTP;
    private createSessionKey;
    private cleanupExpiredSessions;
    sendTwoFactorOTP(userId: string, userEmail: string, userName: string): Promise<boolean>;
    verifyTwoFactorOTP(userId: string, providedOTP: string): {
        success: boolean;
        message: string;
        remainingAttempts?: number;
    };
    hasActiveSession(userId: string): boolean;
    getRemainingAttempts(userId: string): number;
    clearSession(userId: string): void;
    generateBackupCodes(): string[];
    verifyBackupCode(userId: string, providedCode: string, storedCodes: string[]): boolean;
}
export declare const twoFactorAuthService: TwoFactorAuthService;
export {};
