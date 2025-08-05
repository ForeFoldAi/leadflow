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
import { Eye, EyeOff, LogIn, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
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
      return response.json(); // Parse the JSON from the Response object
    },
    onSuccess: (data: any) => {
      console.log("Login success data:", data);
      if (data && data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
        console.log("User data stored in localStorage:", localStorage.getItem("user"));
        toast({
          title: "Success",
          description: "Logged in successfully",
        });
        
        // Immediate redirect
        console.log("Attempting redirect...");
        window.location.href = "/";
      } else {
        console.error("Invalid response structure:", data);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Login failed",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LoginForm) => {
    loginMutation.mutate(data);
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative"
      style={{
        backgroundImage: `url('@assets/Gemini_Generated_Image_1p7qq81p7qq81p7q_1754413492894.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Overlay for better readability */}
      <div className="absolute inset-0 bg-black bg-opacity-10"></div>
      
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4">
            <img 
              src="/forefold-logo.png" 
              alt="ForeFold AI Logo" 
              className="h-16 w-16 mx-auto object-contain drop-shadow-lg"
            />
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white drop-shadow-lg">LeadFlow</h1>
            <p className="text-white drop-shadow-md mt-1">by ForeFoldAI</p>
          </div>
        </div>

        <Card className="backdrop-blur-sm bg-white/90 shadow-2xl border-0">
          <CardContent className="pt-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">Welcome Back</h2>
              <p className="text-gray-600 mt-2">Enter your credentials to access your account</p>
            </div>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  {...form.register("email")}
                  data-testid="input-email"
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-red-600">{form.formState.errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
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

              <Button
                type="submit"
                className="w-full btn-impressive-primary"
                disabled={loginMutation.isPending}
                data-testid="button-login"
              >
                {loginMutation.isPending ? (
                  "Signing in..."
                ) : (
                  <>
                    <LogIn className="mr-2 h-4 w-4 icon" />
                    Sign In
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{" "}
                <button
                  onClick={() => setLocation("/signup")}
                  className="text-blue-600 hover:text-blue-500 font-medium"
                  data-testid="link-signup"
                >
                  Sign up
                </button>
              </p>
            </div>


          </CardContent>
        </Card>
      </div>
    </div>
  );
}