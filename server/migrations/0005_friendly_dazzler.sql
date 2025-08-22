DROP TABLE "two_factor_attempts" CASCADE;--> statement-breakpoint
DROP TABLE "two_factor_auth" CASCADE;--> statement-breakpoint
ALTER TABLE "security_settings" ADD COLUMN "two_factor_method" text DEFAULT 'email' NOT NULL;--> statement-breakpoint
ALTER TABLE "security_settings" ADD COLUMN "two_factor_secret" text;--> statement-breakpoint
ALTER TABLE "security_settings" ADD COLUMN "two_factor_backup_codes" jsonb;--> statement-breakpoint
ALTER TABLE "security_settings" ADD COLUMN "last_two_factor_setup" timestamp;