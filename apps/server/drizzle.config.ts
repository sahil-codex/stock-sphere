import "dotenv/config";
import { defineConfig } from "drizzle-kit";
import dotenv from "dotenv";
dotenv.config({
  path: "../../.env",
});

export default defineConfig({
  schema: "./src/auth/auth-schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});