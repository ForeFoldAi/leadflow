import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, EyeOff, UserPlus, Users, Sparkles, Target, TrendingUp, Shield, Building, Globe, CheckCircle, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ButtonLoader } from "@/components/ui/loader";
import newLogo from "@assets/ChatGPT Image Aug 5, 2025, 10_54_30 PM_1754414686727.png";
import backgroundImage from "@assets/Gemini_Generated_Image_br5r4ibr5r4ibr5r_1754413922041.png";

import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

// Custom URL validation function that accepts various formats
const flexibleUrlSchema = z.string().refine((value) => {
  if (!value || value === "") return true; // Allow empty strings
  
  // Remove leading/trailing whitespace
  const trimmedValue = value.trim();
  
  // Basic URL patterns
  const urlPatterns = [
    // Full URLs with protocol
    /^https?:\/\/[^\s/$.?#].[^\s]*$/i,
    // URLs without protocol but with www
    /^www\.[^\s/$.?#].[^\s]*$/i,
    // URLs without protocol and www
    /^[^\s/$.?#][^\s]*\.[a-z]{2,}$/i,
    // URLs with subdomains
    /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*\.[a-z]{2,}$/i,
    // IP addresses
    /^https?:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?(\/.*)?$/i,
  ];
  
  return urlPatterns.some(pattern => pattern.test(trimmedValue));
}, {
  message: "Please enter a valid website URL (e.g., example.com, www.example.com, https://example.com)"
});

const signupSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
  role: z.enum(["user", "manager", "other"], { required_error: "Please select a role" }),
  customRole: z.string().optional(),
  companyName: z.string().min(1, "Company name is required"),
  companySize: z.enum(["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"], { required_error: "Company size is required" }),
  industry: z.string().min(1, "Industry is required"),
  customIndustry: z.string().optional(),
  website: flexibleUrlSchema.optional().or(z.literal("")),
  phoneNumber: z.string().regex(/^\+?[\d\s\-\(\)]+$/, "Invalid phone number format").optional().or(z.literal("")),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
}).refine((data) => {
  if (data.role === "other" && (!data.customRole || data.customRole.trim() === "")) {
    return false;
  }
  return true;
}, {
  message: "Please specify your role",
  path: ["customRole"],
}).refine((data) => {
  if (data.industry === "other" && (!data.customIndustry || data.customIndustry.trim() === "")) {
    return false;
  }
  return true;
}, {
  message: "Please specify your industry",
  path: ["customIndustry"],
});

type SignupForm = z.infer<typeof signupSchema>;

export default function Signup() {
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>("user");
  const { toast } = useToast();

  const form = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: "user",
      customRole: "",
      companyName: "",
      companySize: "1-10",
      industry: "",
      customIndustry: "",
      website: "",
      phoneNumber: "",
    },
  });

  const signupMutation = useMutation({
    mutationFn: (data: Omit<SignupForm, "confirmPassword">) => 
      apiRequest("POST", "/api/auth/signup", data),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Account created successfully! Please sign in.",
      });
      setLocation("/login");
    },
    onError: (error: any) => {
      let errorMessage = "We couldn't create your account. Please check your information and try again.";
      
      // Extract user-friendly message from error response
      if (error?.message) {
        // Remove HTTP status codes and technical details
        let message = error.message.replace(/^\d+:\s*/, ''); // Remove status codes like "400: "
        
        // Remove JSON formatting if present
        if (message.includes('{"error":') || message.includes('{"message":')) {
          try {
            const parsed = JSON.parse(message);
            message = parsed.error || parsed.message || message;
          } catch {
            // If JSON parsing fails, use the original message
          }
        }
        
        if (!message.includes('Failed to fetch') && !message.includes('NetworkError')) {
          errorMessage = message;
        }
      }
      
      toast({
        title: "Account Creation Failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SignupForm) => {
    const { confirmPassword, ...signupData } = data;
    signupMutation.mutate(signupData);
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Animated background overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/60 via-purple-900/60 to-pink-900/60"></div>
      
      {/* Floating elements */}
      <div className="absolute top-20 left-20 w-32 h-32 bg-white/10 rounded-full blur-xl animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-40 h-40 bg-purple-400/20 rounded-full blur-xl animate-pulse delay-1000"></div>
      <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-blue-400/15 rounded-full blur-lg animate-pulse delay-500"></div>
      
      <div className="w-full max-w-5xl relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-white/20 backdrop-blur-sm rounded-full p-4 mr-4">
            <img 
              src={newLogo} 
              alt="ForeFold AI Logo" 
                className="h-12 w-12 drop-shadow-lg"
            />
          </div>
            <div className="text-left">
              <h1 className="text-4xl font-bold text-white drop-shadow-lg">LeadsFlow</h1>
              <p className="text-white/90 text-lg">powered by ForeFold AI</p>
            </div>
          </div>
          
          
        </div>

                {/* Main Content */}
        <div className="flex justify-center">
          <Card className="bg-white/95 backdrop-blur-md border-0 shadow-2xl rounded-2xl w-full max-w-6xl">
      <CardHeader className="text-center pb-6">
        <CardTitle className="text-3xl font-bold text-gray-900">
          Start Your Free Trial
        </CardTitle>
        <CardDescription className="text-gray-600 text-lg">
          Create your account and begin your lead generation journey
            </CardDescription>
          </CardHeader>
      
      <CardContent className="px-16 pb-12">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <UserPlus className="mr-2 h-5 w-5 text-blue-600" />
              Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                  Full Name *
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  className="h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                  {...form.register("name")}
                  data-testid="input-name"
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-red-600">{form.formState.errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email Address *
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  className="h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                  {...form.register("email")}
                  data-testid="input-email"
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-red-600">{form.formState.errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="role" className="text-sm font-medium text-gray-700">
                  Role *
                </Label>
                <Select
                  onValueChange={(value) => {
                  form.setValue("role", value as "user" | "manager" | "other");
                  setSelectedRole(value);
                  if (value !== "other") {
                    form.setValue("customRole", "");
                  }
                  }}
                >
                  <SelectTrigger className="h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg" data-testid="select-role">
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Sales Representative</SelectItem>
                    <SelectItem value="manager">Sales Manager</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.role && (
                  <p className="text-sm text-red-600">{form.formState.errors.role.message}</p>
                )}
              </div>

              {selectedRole === "other" && (
                <div className="space-y-2">
                  <Label htmlFor="customRole" className="text-sm font-medium text-gray-700">
                    Specify Role *
                  </Label>
                  <Input
                    id="customRole"
                    type="text"
                    placeholder="Enter your role"
                    className="h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                    {...form.register("customRole")}
                    data-testid="input-custom-role"
                  />
                  {form.formState.errors.customRole && (
                    <p className="text-sm text-red-600">{form.formState.errors.customRole.message}</p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="phoneNumber" className="text-sm font-medium text-gray-700">
                  Phone Number
                </Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  className="h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                  {...form.register("phoneNumber")}
                  data-testid="input-phone-number"
                />
                {form.formState.errors.phoneNumber && (
                  <p className="text-sm text-red-600">{form.formState.errors.phoneNumber.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Company Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Building className="mr-2 h-5 w-5 text-green-600" />
              Company Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="companyName" className="text-sm font-medium text-gray-700">
                  Company Name *
                </Label>
                <Input
                  id="companyName"
                  type="text"
                  placeholder="Acme Corporation"
                  className="h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                  {...form.register("companyName")}
                  data-testid="input-company-name"
                />
                {form.formState.errors.companyName && (
                  <p className="text-sm text-red-600">{form.formState.errors.companyName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="companySize" className="text-sm font-medium text-gray-700">
                  Company Size *
                </Label>
                <Select onValueChange={(value) => form.setValue("companySize", value as any)}>
                  <SelectTrigger className="h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg" data-testid="select-company-size">
                    <SelectValue placeholder="Select company size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-10">1-10 employees</SelectItem>
                    <SelectItem value="11-50">11-50 employees</SelectItem>
                    <SelectItem value="51-200">51-200 employees</SelectItem>
                    <SelectItem value="201-500">201-500 employees</SelectItem>
                    <SelectItem value="501-1000">501-1000 employees</SelectItem>
                    <SelectItem value="1000+">1000+ employees</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.companySize && (
                  <p className="text-sm text-red-600">{form.formState.errors.companySize.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="industry" className="text-sm font-medium text-gray-700">
                  Industry *
                </Label>
                <Select onValueChange={(value) => {
                  form.setValue("industry", value);
                  if (value !== "other") {
                    form.setValue("customIndustry", "");
                  }
                }}>
                  <SelectTrigger className="h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg" data-testid="select-industry">
                    <SelectValue placeholder="Select your industry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="real-estate">Real Estate</SelectItem>
                    <SelectItem value="automotive">Automotive</SelectItem>
                    <SelectItem value="textile">Textile</SelectItem>
                    <SelectItem value="electronics">Electronics</SelectItem>
                    <SelectItem value="pharmaceuticals">Pharmaceuticals</SelectItem>
                    <SelectItem value="food-beverage">Food & Beverage</SelectItem>
                    <SelectItem value="construction">Construction</SelectItem>
                    <SelectItem value="furniture">Furniture</SelectItem>
                    <SelectItem value="agriculture">Agriculture</SelectItem>
                    <SelectItem value="chemicals">Chemicals</SelectItem>
                    <SelectItem value="aerospace">Aerospace</SelectItem>
                    <SelectItem value="healthcare">Healthcare</SelectItem>
                    <SelectItem value="retail">Retail</SelectItem>
                    <SelectItem value="energy-oil-gas">Energy (Oil & Gas)</SelectItem>
                    <SelectItem value="renewable-energy">Renewable Energy</SelectItem>
                    <SelectItem value="plastics">Plastics</SelectItem>
                    <SelectItem value="paper-pulp">Paper & Pulp</SelectItem>
                    <SelectItem value="telecommunications">Telecommunications</SelectItem>
                    <SelectItem value="mining">Mining</SelectItem>
                    <SelectItem value="marine">Marine</SelectItem>
                    <SelectItem value="jewelry">Jewelry</SelectItem>
                    <SelectItem value="printing-publishing">Printing & Publishing</SelectItem>
                    <SelectItem value="cosmetics">Cosmetics</SelectItem>
                    <SelectItem value="logistics">Logistics</SelectItem>
                    <SelectItem value="education">Education</SelectItem>
                    <SelectItem value="manpower-services">Manpower Services</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.industry && (
                  <p className="text-sm text-red-600">{form.formState.errors.industry.message}</p>
                )}
              </div>

              {form.watch("industry") === "other" && (
                <div className="space-y-2">
                  <Label htmlFor="customIndustry" className="text-sm font-medium text-gray-700">
                    Specify Industry *
                  </Label>
                  <Input
                    id="customIndustry"
                    type="text"
                    placeholder="Enter your industry"
                    className="h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                    {...form.register("customIndustry")}
                    data-testid="input-custom-industry"
                  />
                  {form.formState.errors.customIndustry && (
                    <p className="text-sm text-red-600">{form.formState.errors.customIndustry.message}</p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="website" className="text-sm font-medium text-gray-700">
                  Website
                </Label>
                <Input
                  id="website"
                  type="url"
                  placeholder="https://www.company.com"
                  className="h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                  {...form.register("website")}
                  data-testid="input-website"
                />
                {form.formState.errors.website && (
                  <p className="text-sm text-red-600">{form.formState.errors.website.message}</p>
                )}
              </div>
            </div>
              </div>

          {/* Security */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Shield className="mr-2 h-5 w-5 text-purple-600" />
              Security
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password *
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    className="h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg pr-12"
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

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                  Confirm Password *
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    className="h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg pr-12"
                    {...form.register("confirmPassword")}
                    data-testid="input-confirm-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    data-testid="button-toggle-confirm-password"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
                {form.formState.errors.confirmPassword && (
                  <p className="text-sm text-red-600">{form.formState.errors.confirmPassword.message}</p>
                )}
              </div>
            </div>
              </div>

              <Button
                type="submit"
            className="w-full h-14 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 text-lg"
                disabled={signupMutation.isPending}
                data-testid="button-signup"
              >
                {signupMutation.isPending ? (
              <div className="flex items-center justify-center">
                <ButtonLoader size={20} color="#ffffff" />
                <span className="ml-3">Creating your account...</span>
              </div>
                ) : (
                  <>
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
            </form>

        <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <button
                  onClick={() => setLocation("/login")}
              className="text-indigo-600 hover:text-indigo-500 font-semibold transition-colors"
                  data-testid="link-login"
                >
              Sign in here
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
    
  </div>


 {/* Footer */}
 <div className="mt-8 text-center">
          <div className="text-xs text-white/70 space-y-1">
            <p>© 2024 ForeFold Consulting Services LLP. All rights reserved.</p>
            <p>ForeFold, LeadsFlow, and related trademarks are owned by ForeFold Consulting Services LLP.</p>
          </div>
        </div>
      </div>
    </div>
    
  );
}