import { useState } from "react";
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

const profileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  role: z.enum(["admin", "user", "manager"]),
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
});

type ProfileForm = z.infer<typeof profileSchema>;

export default function Settings() {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { toast } = useToast();

  // Get current user data
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  const form = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: currentUser.name || "",
      email: currentUser.email || "",
      role: currentUser.role || "user",
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileForm) => {
      const response = await apiRequest("PUT", "/api/users/profile", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
      form.reset();
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
    mutationFn: async (data: any) => {
      // Simulate API call for notifications settings
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Notification preferences saved successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save notification preferences",
        variant: "destructive",
      });
    },
  });

  const saveSecurityMutation = useMutation({
    mutationFn: async (data: any) => {
      // Simulate API call for security settings
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
      // Simulate API call for preferences
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
    updateProfileMutation.mutate(data);
  };

  const handleSaveNotifications = () => {
    saveNotificationsMutation.mutate({});
  };

  const handleSaveSecurity = () => {
    saveSecurityMutation.mutate({});
  };

  const handleSavePreferences = () => {
    savePreferencesMutation.mutate({});
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
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        placeholder="Enter your full name"
                        {...form.register("name")}
                        data-testid="input-name"
                      />
                      {form.formState.errors.name && (
                        <p className="text-sm text-red-600">{form.formState.errors.name.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        {...form.register("email")}
                        data-testid="input-email"
                      />
                      {form.formState.errors.email && (
                        <p className="text-sm text-red-600">{form.formState.errors.email.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select value={form.watch("role")} onValueChange={(value) => form.setValue("role", value as any)}>
                      <SelectTrigger data-testid="select-role">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="user">User</SelectItem>
                      </SelectContent>
                    </Select>
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
                  <Switch id="new-leads" defaultChecked data-testid="switch-new-leads" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="follow-ups">Follow-up Reminders</Label>
                    <p className="text-sm text-gray-500">Receive reminders for scheduled follow-ups</p>
                  </div>
                  <Switch id="follow-ups" defaultChecked data-testid="switch-follow-ups" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="hot-leads">Hot Lead Alerts</Label>
                    <p className="text-sm text-gray-500">Get alerted when leads become hot prospects</p>
                  </div>
                  <Switch id="hot-leads" defaultChecked data-testid="switch-hot-leads" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="conversions">Conversion Notifications</Label>
                    <p className="text-sm text-gray-500">Celebrate when leads convert to customers</p>
                  </div>
                  <Switch id="conversions" defaultChecked data-testid="switch-conversions" />
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
                  <Switch id="browser-push" data-testid="switch-browser-push" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="daily-summary">Daily Summary</Label>
                    <p className="text-sm text-gray-500">Daily digest of your lead activity</p>
                  </div>
                  <Switch id="daily-summary" defaultChecked data-testid="switch-daily-summary" />
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
                  <Button variant="outline" size="sm" data-testid="button-enable-2fa">
                    Enable 2FA
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Login Notifications</Label>
                    <p className="text-sm text-gray-500">Get notified of new sign-ins to your account</p>
                  </div>
                  <Switch defaultChecked data-testid="switch-login-notifications" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Session Management</Label>
                    <p className="text-sm text-gray-500">View and manage your active sessions</p>
                  </div>
                  <Button variant="outline" size="sm" data-testid="button-manage-sessions">
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
                      value="lf_xxxxxxxxxxxxxxxxxxxxxxxx"
                      readOnly
                      className="font-mono text-sm"
                      data-testid="input-api-key"
                    />
                    <Button variant="outline" size="sm" data-testid="button-regenerate-api">
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
                  <Select defaultValue="table" data-testid="select-default-view">
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
                  <Select defaultValue="20" data-testid="select-items-per-page">
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
                  <Switch defaultChecked data-testid="switch-auto-save" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Compact Mode</Label>
                    <p className="text-sm text-gray-500">Show more data in less space</p>
                  </div>
                  <Switch data-testid="switch-compact-mode" />
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
                  <Select defaultValue="csv" data-testid="select-export-format">
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
                  <Switch defaultChecked data-testid="switch-export-notes" />
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