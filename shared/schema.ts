import { sql } from "drizzle-orm";
import { pgTable, text, varchar, date, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const leads = pgTable("leads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  phoneNumber: text("phone_number").notNull(),
  email: text("email").notNull(),
  dateOfBirth: date("date_of_birth"),
  city: text("city").notNull(),
  state: text("state").notNull(),
  country: text("country").notNull(),
  pincode: text("pincode").notNull(),
  companyName: text("company_name"),
  designation: text("designation"),
  customerCategory: text("customer_category").notNull(), // "existing" | "potential"
  lastContactedDate: date("last_contacted_date"),
  lastContactedBy: text("last_contacted_by"),
  nextFollowupDate: date("next_followup_date"),
  customerInterestedIn: text("customer_interested_in"),
  preferredCommunicationChannel: text("preferred_communication_channel"), // "email" | "phone" | "whatsapp" | "sms" | "in-person"
  leadSource: text("lead_source"), // "website" | "referral" | "linkedin" | "facebook" | "twitter" | "campaign" | "other"
  customLeadSource: text("custom_lead_source"), // Used when leadSource is "other"
  leadStatus: text("lead_status").notNull(), // "new" | "followup" | "qualified" | "hot" | "converted" | "lost"
  additionalNotes: text("additional_notes"),
});

export const insertLeadSchema = createInsertSchema(leads, {
  name: z.string().min(1, "Name is required"),
  phoneNumber: z.string().min(1, "Phone number is required").regex(/^\+?[\d\s\-\(\)]+$/, "Invalid phone number format"),
  email: z.string().email("Invalid email address"),
  dateOfBirth: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  country: z.string().min(1, "Country is required"),
  pincode: z.string().min(1, "Pincode is required").regex(/^\d{5,6}$/, "Invalid pincode format"),
  companyName: z.string().optional(),
  designation: z.string().optional(),
  customerCategory: z.enum(["existing", "potential"], { required_error: "Customer category is required" }),
  lastContactedDate: z.string().optional(),
  lastContactedBy: z.string().max(50, "Maximum 50 characters allowed").optional(),
  nextFollowupDate: z.string().optional(),
  customerInterestedIn: z.string().max(100, "Maximum 100 characters allowed").optional(),
  preferredCommunicationChannel: z.enum(["email", "phone", "whatsapp", "sms", "in-person"]).optional(),
  leadSource: z.enum(["website", "referral", "linkedin", "facebook", "twitter", "campaign", "other"]).optional(),
  customLeadSource: z.string().max(50, "Maximum 50 characters allowed").optional(),
  leadStatus: z.enum(["new", "followup", "qualified", "hot", "converted", "lost"], { required_error: "Lead status is required" }),
  additionalNotes: z.string().max(100, "Maximum 100 characters allowed").optional(),
}).omit({ id: true });

export type InsertLead = z.infer<typeof insertLeadSchema>;
export type Lead = typeof leads.$inferSelect;

// Users table for authentication
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull().default("user"), // "admin" | "user" | "manager"
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const insertUserSchema = createInsertSchema(users, {
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(1, "Name is required"),
  role: z.enum(["admin", "user", "manager"]).default("user"),
}).omit({ id: true, createdAt: true, updatedAt: true });

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
