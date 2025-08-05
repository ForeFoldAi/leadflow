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
import { Eye, EyeOff, UserPlus, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

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
  website: z.string().url("Invalid website URL").optional().or(z.literal("")),
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
      toast({
        title: "Error",
        description: error.message || "Signup failed",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SignupForm) => {
    const { confirmPassword, ...signupData } = data;
    signupMutation.mutate(signupData);
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-2">
      <div className="w-full max-w-lg">
        <div className="text-center mb-4">
          <div className="mx-auto mb-2">
            <img 
              src="/forefold-logo.png" 
              alt="ForeFold AI Logo" 
              className="h-12 w-12 mx-auto object-contain"
            />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">LeadFlow</h1>
            <p className="text-gray-600 text-sm">by ForeFoldAI</p>
          </div>
        </div>

        <Card className="max-h-[85vh] overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-center text-lg">Get Started</CardTitle>
            <CardDescription className="text-center text-sm">
              Create your account to start managing leads
            </CardDescription>
          </CardHeader>
          <CardContent className="max-h-[70vh] overflow-y-auto px-6">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
              <div className="space-y-1">
                <Label htmlFor="name" className="text-sm">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  {...form.register("name")}
                  data-testid="input-name"
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-red-600">{form.formState.errors.name.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="email" className="text-sm">Email</Label>
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

              <div className="space-y-1">
                <Label htmlFor="role" className="text-sm">Role</Label>
                <Select onValueChange={(value) => {
                  form.setValue("role", value as "user" | "manager" | "other");
                  setSelectedRole(value);
                  if (value !== "other") {
                    form.setValue("customRole", "");
                  }
                }}>
                  <SelectTrigger data-testid="select-role">
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
                <div className="space-y-1">
                  <Label htmlFor="customRole" className="text-sm">Specify Role</Label>
                  <Input
                    id="customRole"
                    type="text"
                    placeholder="Enter your role"
                    {...form.register("customRole")}
                    data-testid="input-custom-role"
                  />
                  {form.formState.errors.customRole && (
                    <p className="text-sm text-red-600">{form.formState.errors.customRole.message}</p>
                  )}
                </div>
              )}

              <div className="space-y-1">
                <Label htmlFor="companyName" className="text-sm">Company Name</Label>
                <Input
                  id="companyName"
                  type="text"
                  placeholder="Acme Corporation"
                  {...form.register("companyName")}
                  data-testid="input-company-name"
                />
                {form.formState.errors.companyName && (
                  <p className="text-sm text-red-600">{form.formState.errors.companyName.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="companySize" className="text-sm">Company Size</Label>
                <Select onValueChange={(value) => form.setValue("companySize", value as any)}>
                  <SelectTrigger data-testid="select-company-size">
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

              <div className="space-y-1">
                <Label htmlFor="industry" className="text-sm">Industry</Label>
                <Input
                  id="industry"
                  type="text"
                  placeholder="Technology, Healthcare, Finance, etc."
                  {...form.register("industry")}
                  data-testid="input-industry"
                />
                {form.formState.errors.industry && (
                  <p className="text-sm text-red-600">{form.formState.errors.industry.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="website" className="text-sm">Website (Optional)</Label>
                <Input
                  id="website"
                  type="url"
                  placeholder="https://www.company.com"
                  {...form.register("website")}
                  data-testid="input-website"
                />
                {form.formState.errors.website && (
                  <p className="text-sm text-red-600">{form.formState.errors.website.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="phoneNumber" className="text-sm">Phone Number (Optional)</Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  {...form.register("phoneNumber")}
                  data-testid="input-phone-number"
                />
                {form.formState.errors.phoneNumber && (
                  <p className="text-sm text-red-600">{form.formState.errors.phoneNumber.message}</p>
                )}
              </div>



              <div className="space-y-1">
                <Label htmlFor="password" className="text-sm">Password</Label>
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

              <div className="space-y-1">
                <Label htmlFor="confirmPassword" className="text-sm">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
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

              <Button
                type="submit"
                className="w-full"
                disabled={signupMutation.isPending}
                data-testid="button-signup"
              >
                {signupMutation.isPending ? (
                  "Creating account..."
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Create Account
                  </>
                )}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <button
                  onClick={() => setLocation("/login")}
                  className="text-blue-600 hover:text-blue-500 font-medium"
                  data-testid="link-login"
                >
                  Sign in
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}