import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Shield, Mail, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface TwoFactorAuthProps {
  email: string;
  onVerificationSuccess: (user: any) => void;
  onBack: () => void;
}

export default function TwoFactorAuth({ email, onVerificationSuccess, onBack }: TwoFactorAuthProps) {
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState('');
  const [remainingAttempts, setRemainingAttempts] = useState<number | undefined>();
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const { toast } = useToast();

  // Countdown timer
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await apiRequest('POST', '/api/auth/2fa/verify-otp', {
        email,
        otp
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Success",
          description: "Two-factor authentication verified successfully!",
        });
        onVerificationSuccess(data.user);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Verification failed');
        if (errorData.remainingAttempts !== undefined) {
          setRemainingAttempts(errorData.remainingAttempts);
        }
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setIsResending(true);
    setError('');

    try {
      const response = await apiRequest('POST', '/api/auth/2fa/send-otp', {
        email
      });

      if (response.ok) {
        toast({
          title: "OTP Sent",
          description: "A new verification code has been sent to your email.",
        });
        setTimeLeft(600); // Reset timer
        setOtp(''); // Clear previous OTP
        setRemainingAttempts(undefined);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to resend OTP');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleVerifyOTP();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <Shield className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle className="mt-4 text-2xl font-bold text-gray-900">
            Two-Factor Authentication
          </CardTitle>
          <CardDescription className="mt-2 text-gray-600">
            Enter the 6-digit code sent to your email
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Email Display */}
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
            <Mail className="h-4 w-4" />
            <span>{email}</span>
          </div>

          {/* OTP Input */}
          <div className="space-y-2">
            <Label htmlFor="otp" className="text-sm font-medium text-gray-700">
              Verification Code
            </Label>
            <Input
              id="otp"
              type="text"
              placeholder="000000"
              value={otp}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                setOtp(value);
              }}
              onKeyPress={handleKeyPress}
              className="text-center text-2xl font-mono tracking-widest"
              maxLength={6}
              autoComplete="one-time-code"
              autoFocus
            />
          </div>

          {/* Timer */}
          <div className="text-center">
            <p className="text-sm text-gray-500">
              Code expires in: <span className="font-mono">{formatTime(timeLeft)}</span>
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Remaining Attempts */}
          {remainingAttempts !== undefined && (
            <Alert>
              <AlertDescription>
                Attempts remaining: <span className="font-semibold">{remainingAttempts}</span>
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={handleVerifyOTP}
              disabled={isLoading || otp.length !== 6 || timeLeft === 0}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify Code'
              )}
            </Button>

            <Button
              variant="outline"
              onClick={handleResendOTP}
              disabled={isResending || timeLeft > 0}
              className="w-full"
            >
              {isResending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                'Resend Code'
              )}
            </Button>

            <Button
              variant="ghost"
              onClick={onBack}
              className="w-full"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Login
            </Button>
          </div>

          {/* Security Notice */}
          <div className="text-center text-xs text-gray-500">
            <p>This code will expire automatically for security reasons.</p>
            <p>If you didn't request this code, please contact support.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 