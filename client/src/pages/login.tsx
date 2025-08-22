import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, LogIn, Users, Sparkles, Target, TrendingUp, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ButtonLoader } from "@/components/ui/loader";
import backgroundImage from "@assets/Gemini_Generated_Image_br5r4ibr5r4ibr5r_1754413922041.png";

import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import ForgotPasswordDialog from "@/components/forgot-password-dialog";
import TwoFactorAuth from "@/components/two-factor-auth";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [show2FA, setShow2FA] = useState(false);
  const [twoFactorData, setTwoFactorData] = useState<any>(null);
  const { toast } = useToast();

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginForm) => {
      const response = await apiRequest("POST", "/api/auth/login", data);
      return response.json();
    },
    onSuccess: (data: any) => {
      console.log("Login success data:", data);
      
      // Check if 2FA is required
      if (data.requires2FA) {
        setTwoFactorData(data);
        setShow2FA(true);
        toast({
          title: "2FA Required",
          description: "Please check your email for the verification code.",
        });
        return;
      }
      
      if (data && data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
        console.log("User data stored in localStorage:", localStorage.getItem("user"));
        toast({
          title: "Success",
          description: "Logged in successfully",
        });
        
        console.log("Attempting redirect...");
        window.location.href = "/";
      } else {
        console.error("Invalid response structure:", data);
      }
    },
    onError: (error: any) => {
      let errorMessage = "We couldn't sign you in. Please check your email and password and try again.";
      
      // Extract user-friendly message from error response
      if (error?.message) {
        // Remove HTTP status codes and technical details
        let message = error.message.replace(/^\d+:\s*/, ''); // Remove status codes like "400: "
        
        // Remove JSON formatting if present
        if (message.includes('{"error":')) {
          try {
            const parsed = JSON.parse(message);
            message = parsed.error || message;
          } catch {
            // If JSON parsing fails, use the original message
          }
        }
        
        if (!message.includes('Failed to fetch') && !message.includes('NetworkError')) {
          errorMessage = message;
        }
      }
      
      toast({
        title: "Sign In Failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LoginForm) => {
    loginMutation.mutate(data);
  };

  const handle2FASuccess = (user: any) => {
    localStorage.setItem("user", JSON.stringify(user));
    toast({
      title: "Success",
      description: "Two-factor authentication completed successfully!",
    });
    window.location.href = "/";
  };

  const handle2FABack = () => {
    setShow2FA(false);
    setTwoFactorData(null);
  };

  // Show 2FA component if required
  if (show2FA && twoFactorData) {
    return (
      <TwoFactorAuth
        email={twoFactorData.email}
        onVerificationSuccess={handle2FASuccess}
        onBack={handle2FABack}
      />
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Hero Section */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-100 to-purple-200"
          style={{
            backgroundImage: `url(${backgroundImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/70 via-blue-50/80 to-purple-100/70"></div>
        </div>
        
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-20 w-32 h-32 bg-blue-200/20 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute bottom-40 right-20 w-24 h-24 bg-purple-200/30 rounded-full blur-lg animate-bounce"></div>
          <div className="absolute top-1/2 left-1/3 w-16 h-16 bg-indigo-200/25 rounded-full blur-md animate-ping"></div>
        </div>
        
        <div className="relative z-10 flex flex-col justify-center px-12 py-8 text-gray-800 h-screen">
          {/* Logo and Brand */}
          <div className="mb-6 animate-fade-in">
            <div className="text-center mb-6">
              <div className="flex justify-center mb-4">
                                  <div className="relative">
                    <img 
                      src="/logo.png" 
                      alt="ForeFold AI Logo" 
                      className="h-20 w-20 transition-transform duration-300 hover:scale-110 drop-shadow-lg"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full opacity-0 hover:opacity-10 transition-opacity duration-300 blur-xl"></div>
                  </div>
              </div>
              <div>
                <h1 className="text-6xl font-bold mb-2 drop-shadow-sm bg-gradient-to-r from-gray-800 to-blue-700 bg-clip-text text-transparent">
                  LeadsFlow
                </h1>
                <p className="text-xl text-gray-600 drop-shadow-sm font-medium">
                  powered by <span className="text-purple-600 font-semibold">ForeFold AI</span>
                </p>
              </div>
            </div>
            
            {/* Feature Highlights */}
            <div className="space-y-3 mb-6">
              <h2 className="text-xl font-bold mb-3 text-gray-700 drop-shadow-sm">
                Transform Your Lead Management
              </h2>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 bg-white/60 backdrop-blur-sm rounded-lg border border-gray-200/50 hover:bg-white/80 transition-all duration-300 group shadow-sm">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg group-hover:scale-110 transition-transform duration-300 shadow-md">
                    <Target className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-800">Onboard Potential Clients</h3>
                    <p className="text-gray-600 text-xs">Streamline client acquisition process</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-3 bg-white/60 backdrop-blur-sm rounded-lg border border-gray-200/50 hover:bg-white/80 transition-all duration-300 group shadow-sm">
                  <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg group-hover:scale-110 transition-transform duration-300 shadow-md">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-800">Generate Quality Leads</h3>
                    <p className="text-gray-600 text-xs">AI-powered lead generation strategies</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-3 bg-white/60 backdrop-blur-sm rounded-lg border border-gray-200/50 hover:bg-white/80 transition-all duration-300 group shadow-sm">
                  <div className="p-2 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg group-hover:scale-110 transition-transform duration-300 shadow-md">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-800">Convert to Customers</h3>
                    <p className="text-gray-600 text-xs">Intelligent conversion optimization</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* What is LeadsFlow Section */}
          <div className="mt-auto animate-fade-in-up">
            <div className="bg-white/70 backdrop-blur-md rounded-xl p-6 border border-gray-200/50 shadow-lg hover:bg-white/80 transition-all duration-300">
              <div className="flex items-center mb-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg mr-3 shadow-md">
                  <Shield className="h-4 w-4 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-800">What is LeadsFlow?</h3>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">
                LeadsFlow is an <span className="text-purple-600 font-semibold">AI-powered lead management platform</span> that helps businesses 
                onboard potential clients, generate quality leads, and convert them into 
                paying customers through intelligent automation and insights.
              </p>
              <div className="mt-3 flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                </div>
                <span className="text-xs text-green-600 font-medium">AI-Powered & Secure</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <img 
              src="/logo.png" 
              alt="ForeFold AI Logo" 
              className="h-16 w-16 mx-auto mb-4 drop-shadow-lg"
            />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">LeadsFlow</h1>
            <p className="text-gray-600">powered by ForeFold AI</p>
          </div>

          <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl font-bold text-gray-900">
                Welcome to Unlock Potential Customers
              </CardTitle>
              <CardDescription className="text-gray-600">
                Sign in to access your lead management dashboard
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    className="h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    {...form.register("email")}
                    data-testid="input-email"
                  />
                  {form.formState.errors.email && (
                    <p className="text-sm text-red-600">{form.formState.errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      className="h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500 pr-12"
                      {...form.register("password")}
                      data-testid="input-password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      data-testid="button-toggle-password"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </Button>
                  </div>
                  {form.formState.errors.password && (
                    <p className="text-sm text-red-600">{form.formState.errors.password.message}</p>
                  )}
                </div>

                <div className="flex justify-end">
                  <ForgotPasswordDialog>
                    <button
                      type="button"
                      className="text-sm text-blue-600 hover:text-blue-500 font-medium transition-colors"
                    >
                      Forgot Password?
                    </button>
                  </ForgotPasswordDialog>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                  disabled={loginMutation.isPending}
                  data-testid="button-login"
                >
                  {loginMutation.isPending ? (
                    <div className="flex items-center justify-center">
                      <ButtonLoader size={16} color="#ffffff" />
                      <span className="ml-2">Signing in...</span>
                    </div>
                  ) : (
                    <>
                      <LogIn className="mr-2 h-4 w-4" />
                      Sign In
                    </>
                  )}
                </Button>
              </form>

              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Don't have an account?{" "}
                  <button
                    onClick={() => setLocation("/signup")}
                    className="text-blue-600 hover:text-blue-500 font-semibold transition-colors"
                    data-testid="link-signup"
                  >
                    Create Account
                  </button>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="mt-8 text-center space-y-2">
            
            <div className="text-xs text-gray-400 space-y-1">
              <p>© 2024 ForeFold Consulting Services LLP. All rights reserved.</p>
              <p>ForeFold, LeadsFlow, and related trademarks are owned by ForeFold Consulting Services LLP.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}