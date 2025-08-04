import { sql } from "drizzle-orm";
import { pgTable, text, varchar, date } from "drizzle-orm/pg-core";
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
  leadStatus: z.enum(["new", "followup", "qualified", "hot", "converted", "lost"], { required_error: "Lead status is required" }),
  additionalNotes: z.string().max(100, "Maximum 100 characters allowed").optional(),
}).omit({ id: true });

export type InsertLead = z.infer<typeof insertLeadSchema>;
export type Lead = typeof leads.$inferSelect;
