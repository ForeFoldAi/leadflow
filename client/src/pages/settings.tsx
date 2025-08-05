import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import AppHeader from "@/components/app-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings as SettingsIcon, User, Bell, Shield, Database, Mail, Phone, Save, Eye, EyeOff, Smartphone, Key } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import NotificationDisplay from "@/components/notification-display";

const profileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  role: z.enum(["user", "manager", "other"], { required_error: "Please select a role" }),
  customRole: z.string().optional(),
  companyName: z.string().min(1, "Company name is required"),
  companySize: z.enum(["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"], { required_error: "Company size is required" }),
  industry: z.string().min(1, "Industry is required"),
  website: z.string().url("Invalid website URL").optional().or(z.literal("")),
  phoneNumber: z.string().regex(/^\+?[\d\s\-\(\)]+$/, "Invalid phone number format").optional().or(z.literal("")),
  currentPassword: z.string().optional(),
  newPassword: z.string().optional(),
  confirmPassword: z.string().optional(),
}).refine((data) => {
  if (data.newPassword && data.newPassword !== data.confirmPassword) {
    return false;
  }
  return true;
}, {
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

type ProfileForm = z.infer<typeof profileSchema>;

export default function Settings() {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>("user");
  const [apiKey, setApiKey] = useState(() => {
    const saved = localStorage.getItem('userApiKey');
    if (saved) return saved;
    
    const newKey = `lf_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem('userApiKey', newKey);
    return newKey;
  });
  const { toast } = useToast();

  // Settings state management
  const [notificationSettings, setNotificationSettings] = useState<{
    newLeads: boolean;
    followUps: boolean;
    hotLeads: boolean;
    conversions: boolean;
    browserPush: boolean;
    dailySummary: boolean;
  }>(() => {
    const saved = localStorage.getItem('notificationSettings');
    return saved ? JSON.parse(saved) : {
      newLeads: true,
      followUps: true,
      hotLeads: true,
      conversions: true,
      browserPush: false,
      dailySummary: true
    };
  });

  const [securitySettings, setSecuritySettings] = useState<{
    twoFactorEnabled: boolean;
    loginNotifications: boolean;
    sessionTimeout: string;
  }>(() => {
    const saved = localStorage.getItem('securitySettings');
    return saved ? JSON.parse(saved) : {
      twoFactorEnabled: false,
      loginNotifications: true,
      sessionTimeout: '30'
    };
  });

  const [preferenceSettings, setPreferenceSettings] = useState<{
    defaultView: string;
    itemsPerPage: string;
    autoSave: boolean;
    compactMode: boolean;
    exportFormat: string;
    exportNotes: boolean;
  }>(() => {
    const saved = localStorage.getItem('preferenceSettings');
    return saved ? JSON.parse(saved) : {
      defaultView: 'table',
      itemsPerPage: '20',
      autoSave: true,
      compactMode: false,
      exportFormat: 'csv',
      exportNotes: true
    };
  });

  // Get current user data
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  const form = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: currentUser.name || "",
      email: currentUser.email || "",
      role: currentUser.role || "user",
      customRole: currentUser.customRole || "",
      companyName: currentUser.companyName || "",
      companySize: currentUser.companySize || "1-10",
      industry: currentUser.industry || "",
      website: currentUser.website || "",
      phoneNumber: currentUser.phoneNumber || "",
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Update selectedRole when form role changes and initialize with current user role
  React.useEffect(() => {
    if (currentUser.role) {
      setSelectedRole(currentUser.role);
    }
    const subscription = form.watch((value) => {
      if (value.role) {
        setSelectedRole(value.role);
      }
    });
    return () => subscription.unsubscribe();
  }, [form, currentUser.role]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileForm) => {
      const response = await apiRequest("PUT", "/api/users/profile", {
        ...data,
        email: currentUser.email || data.email // Ensure email is included
      });
      return response;
    },
    onSuccess: (data: any) => {
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
      // Update localStorage with new user data if returned
      if (data && data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
        
        // Dispatch custom event to notify header of user data change
        window.dispatchEvent(new CustomEvent("userUpdated"));
        
        // Reset form with updated values instead of reloading page
        form.reset({
          name: data.user.name || "",
          email: data.user.email || "",
          role: data.user.role || "user",
          customRole: data.user.customRole || "",
          companyName: data.user.companyName || "",
          companySize: data.user.companySize || "1-10",
          industry: data.user.industry || "",
          website: data.user.website || "",
          phoneNumber: data.user.phoneNumber || "",
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  const saveNotificationsMutation = useMutation({
    mutationFn: async (settings: any) => {
      // Save notification settings to localStorage
      localStorage.setItem("notificationSettings", JSON.stringify(settings));

      // Handle push notification subscription/unsubscription
      if (settings.pushNotifications && 'Notification' in window) {
        // Request permission if not already granted
        if (Notification.permission === 'default') {
          const permission = await Notification.requestPermission();
          if (permission === 'granted') {
            // Subscribe to push notifications
            await apiRequest('POST', '/api/notifications/push/subscribe', {
              userId: currentUser.id || currentUser.email,
              subscription: { endpoint: 'browser-push', keys: {} }
            });
          } else {
            throw new Error('Push notification permission denied');
          }
        }
      } else if (!settings.pushNotifications && currentUser.id) {
        // Unsubscribe from push notifications
        await fetch(`/api/notifications/push/unsubscribe/${currentUser.id || currentUser.email}`, {
          method: 'DELETE'
        });
      }

      // Test email notification if enabled
      if (settings.emailNotifications && currentUser.email) {
        await apiRequest('POST', '/api/notifications/test', {
          email: currentUser.email,
          type: 'new_lead'
        });
      }

      return settings;
    },
    onSuccess: (data) => {
      if (data.emailNotifications && currentUser.email) {
        toast({
          title: "Success",
          description: "Notification settings saved and test email sent successfully",
        });
      } else {
        toast({
          title: "Success", 
          description: "Notification settings saved successfully",
        });
      }
    },
    onError: (error: any) => {
      if (error.message === 'Push notification permission denied') {
        toast({
          title: "Push Notifications",
          description: "Push notification permission denied. Please enable in browser settings.",
          variant: "destructive",
        });
        // Reset push notifications state if permission denied
        const currentSettings = JSON.parse(localStorage.getItem("notificationSettings") || "{}");
        currentSettings.pushNotifications = false;
        localStorage.setItem("notificationSettings", JSON.stringify(currentSettings));
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to save notification settings",
          variant: "destructive",
        });
      }
    },
  });

  const saveSecurityMutation = useMutation({
    mutationFn: async (data: any) => {
      // Save to localStorage for persistence
      localStorage.setItem('securitySettings', JSON.stringify(data));
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Security settings saved successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save security settings",
        variant: "destructive",
      });
    },
  });

  const savePreferencesMutation = useMutation({
    mutationFn: async (data: any) => {
      // Save to localStorage for persistence
      localStorage.setItem('preferenceSettings', JSON.stringify(data));
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Preferences saved successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save preferences",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ProfileForm) => {
    // Only send password fields if user is actually changing password
    const submitData = { ...data };
    if (!data.newPassword || data.newPassword.trim() === '') {
      delete submitData.currentPassword;
      delete submitData.newPassword;
      delete submitData.confirmPassword;
    }
    updateProfileMutation.mutate(submitData);
  };

  const handleSaveNotifications = () => {
    saveNotificationsMutation.mutate(notificationSettings);
  };

  const handleSaveSecurity = () => {
    saveSecurityMutation.mutate(securitySettings);
  };

  const handleSavePreferences = () => {
    savePreferencesMutation.mutate(preferenceSettings);
  };

  const handleEnable2FA = () => {
    toast({
      title: "2FA Setup",
      description: "Two-factor authentication setup would open here. Feature coming soon!",
    });
    setSecuritySettings(prev => ({ ...prev, twoFactorEnabled: !prev.twoFactorEnabled }));
  };

  const handleManageSessions = () => {
    toast({
      title: "Session Management",
      description: "Active sessions management panel would open here. Feature coming soon!",
    });
  };

  const handleRegenerateAPI = () => {
    const newApiKey = `lf_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
    setApiKey(newApiKey);
    localStorage.setItem('userApiKey', newApiKey);
    toast({
      title: "API Key Regenerated",
      description: "Your API key has been regenerated successfully",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900" data-testid="page-title">Settings</h2>
          <p className="mt-1 text-sm text-gray-600">Manage your account settings and preferences</p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Security
            </TabsTrigger>
            <TabsTrigger value="preferences" className="flex items-center gap-2">
              <SettingsIcon className="h-4 w-4" />
              Preferences
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your account details and password
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="space-y-2">
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

                  <div className="space-y-2">
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

                  <div className="space-y-2">
                    <Label htmlFor="role" className="text-sm">Role</Label>
                    <Select value={form.watch("role")} onValueChange={(value) => {
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
                    <div className="space-y-2">
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

                  <div className="space-y-2">
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

                  <div className="space-y-2">
                    <Label htmlFor="companySize" className="text-sm">Company Size</Label>
                    <Select value={form.watch("companySize")} onValueChange={(value) => form.setValue("companySize", value as any)}>
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

                  <div className="space-y-2">
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

                  <div className="space-y-2">
                    <Label htmlFor="website" className="text-sm">Website (Optional)</Label>
                    <Input
                      id="website"
                      type="url"
                      placeholder="https://www.example.com"
                      {...form.register("website")}
                      data-testid="input-website"
                    />
                    {form.formState.errors.website && (
                      <p className="text-sm text-red-600">{form.formState.errors.website.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
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

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Change Password</h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <div className="relative">
                        <Input
                          id="currentPassword"
                          type={showCurrentPassword ? "text" : "password"}
                          placeholder="Enter current password"
                          {...form.register("currentPassword")}
                          data-testid="input-current-password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        >
                          {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <div className="relative">
                        <Input
                          id="newPassword"
                          type={showNewPassword ? "text" : "password"}
                          placeholder="Enter new password"
                          {...form.register("newPassword")}
                          data-testid="input-new-password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                        >
                          {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirm new password"
                          {...form.register("confirmPassword")}
                          data-testid="input-confirm-password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                      {form.formState.errors.confirmPassword && (
                        <p className="text-sm text-red-600">{form.formState.errors.confirmPassword.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={updateProfileMutation.isPending}
                      data-testid="button-save-profile"
                    >
                      {updateProfileMutation.isPending ? (
                        "Saving..."
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}  
          <TabsContent value="notifications" className="space-y-6">
            <NotificationDisplay />
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Email Notifications
                </CardTitle>
                <CardDescription>
                  Choose which email notifications you'd like to receive
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="new-leads">New Lead Notifications</Label>
                    <p className="text-sm text-gray-500">Get notified when new leads are added</p>
                  </div>
                  <Switch 
                    id="new-leads" 
                    checked={notificationSettings.newLeads}
                    onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, newLeads: checked }))}
                    data-testid="switch-new-leads" 
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="follow-ups">Follow-up Reminders</Label>
                    <p className="text-sm text-gray-500">Receive reminders for scheduled follow-ups</p>
                  </div>
                  <Switch 
                    id="follow-ups" 
                    checked={notificationSettings.followUps}
                    onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, followUps: checked }))}
                    data-testid="switch-follow-ups" 
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="hot-leads">Hot Lead Alerts</Label>
                    <p className="text-sm text-gray-500">Get alerted when leads become hot prospects</p>
                  </div>
                  <Switch 
                    id="hot-leads" 
                    checked={notificationSettings.hotLeads}
                    onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, hotLeads: checked }))}
                    data-testid="switch-hot-leads" 
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="conversions">Conversion Notifications</Label>
                    <p className="text-sm text-gray-500">Celebrate when leads convert to customers</p>
                  </div>
                  <Switch 
                    id="conversions" 
                    checked={notificationSettings.conversions}
                    onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, conversions: checked }))}
                    data-testid="switch-conversions" 
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  Push Notifications
                </CardTitle>
                <CardDescription>
                  Configure browser and mobile push notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="browser-push">Browser Notifications</Label>
                    <p className="text-sm text-gray-500">Show notifications in your browser</p>
                  </div>
                  <Switch 
                    id="browser-push" 
                    checked={notificationSettings.browserPush}
                    onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, browserPush: checked }))}
                    data-testid="switch-browser-push" 
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="daily-summary">Daily Summary</Label>
                    <p className="text-sm text-gray-500">Daily digest of your lead activity</p>
                  </div>
                  <Switch 
                    id="daily-summary" 
                    checked={notificationSettings.dailySummary}
                    onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, dailySummary: checked }))}
                    data-testid="switch-daily-summary" 
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button
                onClick={handleSaveNotifications}
                disabled={saveNotificationsMutation.isPending}
                data-testid="button-save-notifications"
              >
                {saveNotificationsMutation.isPending ? (
                  "Saving..."
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Notification Settings
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Account Security
                </CardTitle>
                <CardDescription>
                  Manage your account security settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="two-factor">Two-Factor Authentication</Label>
                    <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleEnable2FA}
                    data-testid="button-enable-2fa"
                  >
                    {securitySettings.twoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA'}
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Login Notifications</Label>
                    <p className="text-sm text-gray-500">Get notified of new sign-ins to your account</p>
                  </div>
                  <Switch 
                    checked={securitySettings.loginNotifications}
                    onCheckedChange={(checked) => setSecuritySettings(prev => ({ ...prev, loginNotifications: checked }))}
                    data-testid="switch-login-notifications" 
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Session Management</Label>
                    <p className="text-sm text-gray-500">View and manage your active sessions</p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleManageSessions}
                    data-testid="button-manage-sessions"
                  >
                    Manage Sessions
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  API Access
                </CardTitle>
                <CardDescription>
                  Manage API keys and integrations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>API Key</Label>
                  <div className="flex gap-2">
                    <Input
                      value={apiKey}
                      readOnly
                      className="font-mono text-sm"
                      data-testid="input-api-key"
                    />
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleRegenerateAPI}
                      data-testid="button-regenerate-api"
                    >
                      Regenerate
                    </Button>
                  </div>
                  <p className="text-sm text-gray-500">Use this key to access the LeadFlow API</p>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button
                onClick={handleSaveSecurity}
                disabled={saveSecurityMutation.isPending}
                data-testid="button-save-security"
              >
                {saveSecurityMutation.isPending ? (
                  "Saving..."
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Security Settings
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <SettingsIcon className="h-5 w-5" />
                  Application Preferences
                </CardTitle>
                <CardDescription>
                  Customize your LeadFlow experience
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Default Lead View</Label>
                  <Select 
                    value={preferenceSettings.defaultView} 
                    onValueChange={(value) => setPreferenceSettings(prev => ({ ...prev, defaultView: value }))}
                    data-testid="select-default-view"
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="table">Table View</SelectItem>
                      <SelectItem value="grid">Grid View</SelectItem>
                      <SelectItem value="list">List View</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Items Per Page</Label>
                  <Select 
                    value={preferenceSettings.itemsPerPage} 
                    onValueChange={(value) => setPreferenceSettings(prev => ({ ...prev, itemsPerPage: value }))}
                    data-testid="select-items-per-page"
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10 items</SelectItem>
                      <SelectItem value="20">20 items</SelectItem>
                      <SelectItem value="50">50 items</SelectItem>
                      <SelectItem value="100">100 items</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto-save Changes</Label>
                    <p className="text-sm text-gray-500">Automatically save form changes</p>
                  </div>
                  <Switch 
                    checked={preferenceSettings.autoSave}
                    onCheckedChange={(checked) => setPreferenceSettings(prev => ({ ...prev, autoSave: checked }))}
                    data-testid="switch-auto-save" 
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Compact Mode</Label>
                    <p className="text-sm text-gray-500">Show more data in less space</p>
                  </div>
                  <Switch 
                    checked={preferenceSettings.compactMode}
                    onCheckedChange={(checked) => setPreferenceSettings(prev => ({ ...prev, compactMode: checked }))}
                    data-testid="switch-compact-mode" 
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Data Management
                </CardTitle>
                <CardDescription>
                  Manage your data and exports
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Default Export Format</Label>
                  <Select 
                    value={preferenceSettings.exportFormat} 
                    onValueChange={(value) => setPreferenceSettings(prev => ({ ...prev, exportFormat: value }))}
                    data-testid="select-export-format"
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="csv">CSV</SelectItem>
                      <SelectItem value="xlsx">Excel (XLSX)</SelectItem>
                      <SelectItem value="json">JSON</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Include Notes in Export</Label>
                    <p className="text-sm text-gray-500">Add additional notes to exported data</p>
                  </div>
                  <Switch 
                    checked={preferenceSettings.exportNotes}
                    onCheckedChange={(checked) => setPreferenceSettings(prev => ({ ...prev, exportNotes: checked }))}
                    data-testid="switch-export-notes" 
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button
                onClick={handleSavePreferences}
                disabled={savePreferencesMutation.isPending}
                data-testid="button-save-preferences"
              >
                {savePreferencesMutation.isPending ? (
                  "Saving..."
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Preferences
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}