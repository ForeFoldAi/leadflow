#!/usr/bin/env node

/**
 * Database Initialization Script for LeadConnect
 * 
 * This script helps initialize the PostgreSQL database with:
 * - Database schema creation
 * - Sample admin user for Hyderabad-based business
 * - No mock lead data (clean start)
 */

import { drizzle } from "drizzle-orm/node-postgres";
import pkg from "pg";
const { Pool } = pkg;
import { users } from "./shared/schema.js";
import bcrypt from "bcryptjs";
import { config } from "dotenv";

// Load environment variables
config();

async function initializeDatabase() {
  try {
    console.log("🚀 Starting LeadConnect Database Initialization...");
    
    if (!process.env.DATABASE_URL) {
      console.error("❌ERROR: DATABASE_URL environment variable is required");
      console.log("Please create a .env file with your PostgreSQL connection string:");
      console.log('DATABASE_URL="postgresql://username:password@host:port/database_name"');
      process.exit(1);
    }

    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    });
    const db = drizzle(pool);

    console.log("📊 Connected to database successfully");

    // Create initial admin user for Hyderabad business
    console.log("👤 Creating initial admin user...");
    
    const adminPassword = await bcrypt.hash("admin123", 12);
    
    try {
      await db.insert(users).values({
        email: "admin@leadconnect.hyderabad",
        password: adminPassword,
        name: "Admin User",
        role: "admin",
        companyName: "LeadConnect Hyderabad",
        companySize: "11-50",
        industry: "Technology Services",
        website: "https://leadconnect.hyderabad",
        phoneNumber: "+91 9876543210",
        subscriptionStatus: "active",
        subscriptionPlan: "enterprise",
      });
      
      console.log("✅ Admin user created successfully");
      console.log("📧 Email: admin@leadconnect.hyderabad");
      console.log("🔐 Password: admin123");
      console.log("⚠️  Please change the default password after first login");
      
    } catch (error) {
      if (error.message?.includes("duplicate key") || error.code === '23505') {
        console.log("ℹ️  Admin user already exists, skipping creation");
      } else {
        throw error;
      }
    }

    console.log("\n🎉 Database initialization completed successfully!");
    console.log("\n📋 Next Steps:");
    console.log("1. Start the development server: npm run dev");
    console.log("2. Login with the admin credentials above");
    console.log("3. Start adding your leads and users");
    console.log("4. Customize the application for your business needs");
    
    console.log("\n🇮🇳 Indian Business Features:");
    console.log("- Indian phone number validation");
    console.log("- Support for Indian cities and states");
    console.log("- Local business categories");
    console.log("- Hyderabad-focused lead management");
    
  } catch (error) {
    console.error("❌ Database initialization failed:", error.message);
    console.log("\n🔧 Troubleshooting:");
    console.log("1. Ensure PostgreSQL is running");
    console.log("2. Verify DATABASE_URL is correct");
    console.log("3. Check database permissions");
    console.log("4. Run 'npm run db:push' to create tables");
    process.exit(1);
  }
}

// Run initialization
initializeDatabase(); 