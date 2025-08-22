import { sql } from "drizzle-orm";
import { pgTable, text, varchar, date, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

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

export const leads = pgTable("leads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }), // User who owns this lead
  name: text("name").notNull(),
  phoneNumber: text("phone_number").notNull(),
  email: text("email"),
  dateOfBirth: date("date_of_birth"),
  city: text("city"),
  state: text("state"),
  country: text("country"),
  pincode: text("pincode"),
  companyName: text("company_name"),
  designation: text("designation"),
  customerCategory: text("customer_category").notNull(), // "existing" | "potential"
  lastContactedDate: date("last_contacted_date"),
  lastContactedBy: text("last_contacted_by"),
  nextFollowupDate: date("next_followup_date"),
  customerInterestedIn: text("customer_interested_in"),
  preferredCommunicationChannel: text("preferred_communication_channel"), // "email" | "phone" | "whatsapp" | "sms" | "in-person" | "linkedin" | "other"
  customCommunicationChannel: text("custom_communication_channel"), // Used when preferredCommunicationChannel is "other"
  leadSource: text("lead_source").notNull(), // "website" | "referral" | "linkedin" | "facebook" | "twitter" | "campaign" | "instagram" | "generated_by" | "on_field" | "other"
  customLeadSource: text("custom_lead_source"), // Used when leadSource is "other"
  customReferralSource: text("custom_referral_source"), // Used when leadSource is "referral"
  customGeneratedBy: text("custom_generated_by"), // Used when leadSource is "generated_by"
  leadStatus: text("lead_status").notNull(), // "new" | "followup" | "qualified" | "hot" | "converted" | "lost"
  leadCreatedBy: text("lead_created_by"), // New field for who created the lead
  additionalNotes: text("additional_notes"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const insertLeadSchema = createInsertSchema(leads, {
  userId: z.string().optional(), // Will be set automatically based on authenticated user
  name: z.string().min(1, "Name is required"),
  phoneNumber: z.string().min(1, "Phone number is required").regex(/^(\+91[\s\-]?)?[6-9]\d{9}$|^\+?[\d\s\-\(\)]+$/, "Please enter a valid Indian phone number (e.g., +91 9876543210 or 9876543210)"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  dateOfBirth: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  pincode: z.string().optional(),
  companyName: z.string().optional(),
  designation: z.string().optional(),
  customerCategory: z.enum(["existing", "potential"], { required_error: "Customer category is required" }),
  lastContactedDate: z.string().optional(),
  lastContactedBy: z.string().max(50, "Maximum 50 characters allowed").optional(),
  nextFollowupDate: z.string().optional(),
  customerInterestedIn: z.string().max(100, "Maximum 100 characters allowed").optional(),
  preferredCommunicationChannel: z.enum(["email", "phone", "whatsapp", "sms", "in-person", "linkedin", "other"]).optional(),
  customCommunicationChannel: z.string().max(50, "Maximum 50 characters allowed").optional(),
  leadSource: z.enum(["website", "referral", "linkedin", "facebook", "twitter", "campaign", "instagram", "generated_by", "on_field", "other"], { required_error: "Lead source is required" }),
  customLeadSource: z.string().max(50, "Maximum 50 characters allowed").optional(),
  customReferralSource: z.string().max(50, "Maximum 50 characters allowed").optional(),
  customGeneratedBy: z.string().max(50, "Maximum 50 characters allowed").optional(),
  leadStatus: z.enum(["new", "followup", "qualified", "hot", "converted", "lost"], { required_error: "Lead status is required" }),
  leadCreatedBy: z.string().max(50, "Maximum 50 characters allowed").optional(),
  additionalNotes: z.string().max(100, "Maximum 100 characters allowed").optional(),
}).omit({ id: true, createdAt: true });

export type InsertLead = z.infer<typeof insertLeadSchema>;
export type Lead = typeof leads.$inferSelect;

// Users table for authentication
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull().default("user"), // "admin" | "user" | "manager" | "other"
  customRole: text("custom_role"), // Used when role is "other"
  companyName: text("company_name").notNull(),
  companySize: text("company_size").notNull(),
  industry: text("industry").notNull(),
  website: text("website"),
  phoneNumber: text("phone_number"),
  subscriptionStatus: text("subscription_status").notNull().default("trial"), // "trial" | "active" | "cancelled" | "expired"
  subscriptionPlan: text("subscription_plan").notNull().default("basic"), // "basic" | "professional" | "enterprise"
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const insertUserSchema = createInsertSchema(users, {
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(1, "Name is required"),
  role: z.enum(["admin", "user", "manager", "other"]).default("user"),
  customRole: z.string().max(50, "Maximum 50 characters allowed").optional(),
  companyName: z.string().min(1, "Company name is required"),
  companySize: z.enum(["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"], { required_error: "Company size is required" }),
  industry: z.string().min(1, "Industry is required"),
  website: flexibleUrlSchema.optional().or(z.literal("")),
  phoneNumber: z.string().regex(/^(\+91[\s\-]?)?[6-9]\d{9}$|^\+?[\d\s\-\(\)]+$/, "Please enter a valid Indian phone number (e.g., +91 9876543210 or 9876543210)").optional().or(z.literal("")),
  subscriptionStatus: z.enum(["trial", "active", "cancelled", "expired"]).default("trial"),
  subscriptionPlan: z.enum(["basic", "professional", "enterprise"]).default("basic"),
}).omit({ id: true, createdAt: true, updatedAt: true, isActive: true });

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// User Preferences table
export const userPreferences = pgTable("user_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  defaultView: text("default_view").notNull().default("table"), // "table" | "grid" | "list"
  itemsPerPage: text("items_per_page").notNull().default("20"), // "10" | "20" | "50" | "100"
  autoSave: boolean("auto_save").notNull().default(true),
  compactMode: boolean("compact_mode").notNull().default(false),
  exportFormat: text("export_format").notNull().default("csv"), // "csv" | "xlsx" | "pdf"
  exportNotes: boolean("export_notes").notNull().default(true),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const insertUserPreferencesSchema = createInsertSchema(userPreferences, {
  userId: z.string().min(1, "User ID is required"),
  defaultView: z.enum(["table", "grid", "list"]).default("table"),
  itemsPerPage: z.enum(["10", "20", "50", "100"]).default("20"),
  autoSave: z.boolean().default(true),
  compactMode: z.boolean().default(false),
  exportFormat: z.enum(["csv", "xlsx", "pdf"]).default("csv"),
  exportNotes: z.boolean().default(true),
}).omit({ id: true, createdAt: true, updatedAt: true });

export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;
export type UserPreferences = typeof userPreferences.$inferSelect;

// Notification Settings table
export const notificationSettings = pgTable("notification_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  newLeads: boolean("new_leads").notNull().default(true),
  followUps: boolean("follow_ups").notNull().default(true),
  hotLeads: boolean("hot_leads").notNull().default(true),
  conversions: boolean("conversions").notNull().default(true),
  browserPush: boolean("browser_push").notNull().default(false),
  dailySummary: boolean("daily_summary").notNull().default(false),
  emailNotifications: boolean("email_notifications").notNull().default(true),
  pushSubscription: jsonb("push_subscription"), // Store push notification subscription data
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const insertNotificationSettingsSchema = createInsertSchema(notificationSettings, {
  userId: z.string().min(1, "User ID is required"),
  newLeads: z.boolean().default(true),
  followUps: z.boolean().default(true),
  hotLeads: z.boolean().default(true),
  conversions: z.boolean().default(true),
  browserPush: z.boolean().default(false),
  dailySummary: z.boolean().default(false),
  emailNotifications: z.boolean().default(true),
  pushSubscription: z.any().optional(),
}).omit({ id: true, createdAt: true, updatedAt: true });

export type InsertNotificationSettings = z.infer<typeof insertNotificationSettingsSchema>;
export type NotificationSettings = typeof notificationSettings.$inferSelect;

// Security Settings table
export const securitySettings = pgTable("security_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  twoFactorEnabled: boolean("two_factor_enabled").notNull().default(false),
  twoFactorMethod: text("two_factor_method").notNull().default("email"), // "email" | "sms" | "authenticator"
  twoFactorSecret: text("two_factor_secret"), // For authenticator apps (future use)
  twoFactorBackupCodes: jsonb("two_factor_backup_codes"), // Backup codes for account recovery
  loginNotifications: boolean("login_notifications").notNull().default(true),
  sessionTimeout: text("session_timeout").notNull().default("30"), // minutes
  apiKey: text("api_key").notNull(),
  lastPasswordChange: timestamp("last_password_change"),
  lastTwoFactorSetup: timestamp("last_two_factor_setup"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const insertSecuritySettingsSchema = createInsertSchema(securitySettings, {
  userId: z.string().min(1, "User ID is required"),
  twoFactorEnabled: z.boolean().default(false),
  loginNotifications: z.boolean().default(true),
  sessionTimeout: z.enum(["15", "30", "60", "120", "240"]).default("30"),
  apiKey: z.string().min(1, "API key is required"),
  lastPasswordChange: z.string().optional(),
}).omit({ id: true, createdAt: true, updatedAt: true });

export type InsertSecuritySettings = z.infer<typeof insertSecuritySettingsSchema>;
export type SecuritySettings = typeof securitySettings.$inferSelect;

// Notification Logs table
export const notificationLogs = pgTable("notification_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // "new_lead" | "lead_update" | "lead_converted" | "followup" | "system"
  title: text("title").notNull(),
  message: text("message").notNull(),
  read: boolean("read").notNull().default(false),
  metadata: jsonb("metadata"), // Store additional data like lead ID, changes, etc.
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const insertNotificationLogSchema = createInsertSchema(notificationLogs, {
  userId: z.string().min(1, "User ID is required"),
  type: z.enum(["new_lead", "lead_update", "lead_converted", "followup", "system"]),
  title: z.string().min(1, "Title is required"),
  message: z.string().min(1, "Message is required"),
  read: z.boolean().default(false),
  metadata: z.any().optional(),
}).omit({ id: true, createdAt: true });

export type InsertNotificationLog = z.infer<typeof insertNotificationLogSchema>;
export type NotificationLog = typeof notificationLogs.$inferSelect;

// User Sessions table (for session management)
export const userSessions = pgTable("user_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  sessionToken: text("session_token").notNull().unique(),
  userAgent: text("user_agent"),
  ipAddress: text("ip_address"),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const insertUserSessionSchema = createInsertSchema(userSessions, {
  userId: z.string().min(1, "User ID is required"),
  sessionToken: z.string().min(1, "Session token is required"),
  userAgent: z.string().optional(),
  ipAddress: z.string().optional(),
  expiresAt: z.string().min(1, "Expiration date is required"),
}).omit({ id: true, createdAt: true });

export type InsertUserSession = z.infer<typeof insertUserSessionSchema>;
export type UserSession = typeof userSessions.$inferSelect;

// Password Reset table for OTP-based password reset
export const passwordResets = pgTable("password_resets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  otp: text("otp").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").notNull().default(false),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const insertPasswordResetSchema = createInsertSchema(passwordResets, {
  userId: z.string().min(1, "User ID is required"),
  email: z.string().email("Invalid email address"),
  otp: z.string().min(6, "OTP must be at least 6 characters").max(6, "OTP must be exactly 6 characters"),
  expiresAt: z.string().min(1, "Expiration date is required"),
  used: z.boolean().default(false),
}).omit({ id: true, createdAt: true });

export type InsertPasswordReset = z.infer<typeof insertPasswordResetSchema>;
export type PasswordReset = typeof passwordResets.$inferSelect;
