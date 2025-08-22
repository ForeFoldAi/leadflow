import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

// Load environment variables
config();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required. Please set it in your .env file.");
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
