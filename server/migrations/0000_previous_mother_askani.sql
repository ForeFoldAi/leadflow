CREATE TABLE "leads" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"phone_number" text NOT NULL,
	"email" text,
	"date_of_birth" date,
	"city" text,
	"state" text,
	"country" text,
	"pincode" text,
	"company_name" text,
	"designation" text,
	"customer_category" text NOT NULL,
	"last_contacted_date" date,
	"last_contacted_by" text,
	"next_followup_date" date,
	"customer_interested_in" text,
	"preferred_communication_channel" text,
	"custom_communication_channel" text,
	"lead_source" text NOT NULL,
	"custom_lead_source" text,
	"custom_referral_source" text,
	"custom_generated_by" text,
	"lead_status" text NOT NULL,
	"lead_created_by" text,
	"additional_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"read" boolean DEFAULT false NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_settings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"new_leads" boolean DEFAULT true NOT NULL,
	"follow_ups" boolean DEFAULT true NOT NULL,
	"hot_leads" boolean DEFAULT true NOT NULL,
	"conversions" boolean DEFAULT true NOT NULL,
	"browser_push" boolean DEFAULT false NOT NULL,
	"daily_summary" boolean DEFAULT false NOT NULL,
	"email_notifications" boolean DEFAULT true NOT NULL,
	"push_subscription" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "security_settings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"two_factor_enabled" boolean DEFAULT false NOT NULL,
	"login_notifications" boolean DEFAULT true NOT NULL,
	"session_timeout" text DEFAULT '30' NOT NULL,
	"api_key" text NOT NULL,
	"last_password_change" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_preferences" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"default_view" text DEFAULT 'table' NOT NULL,
	"items_per_page" text DEFAULT '20' NOT NULL,
	"auto_save" boolean DEFAULT true NOT NULL,
	"compact_mode" boolean DEFAULT false NOT NULL,
	"export_format" text DEFAULT 'csv' NOT NULL,
	"export_notes" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_sessions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"session_token" text NOT NULL,
	"user_agent" text,
	"ip_address" text,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_sessions_session_token_unique" UNIQUE("session_token")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"name" text NOT NULL,
	"role" text DEFAULT 'user' NOT NULL,
	"custom_role" text,
	"company_name" text NOT NULL,
	"company_size" text NOT NULL,
	"industry" text NOT NULL,
	"website" text,
	"phone_number" text,
	"subscription_status" text DEFAULT 'trial' NOT NULL,
	"subscription_plan" text DEFAULT 'basic' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "notification_logs" ADD CONSTRAINT "notification_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_settings" ADD CONSTRAINT "notification_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "security_settings" ADD CONSTRAINT "security_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;