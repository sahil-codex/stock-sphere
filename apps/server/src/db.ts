
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./auth/auth-schema";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is missing.");
}

const client = postgres(databaseUrl, {
  ssl: "require",
  connect_timeout: 20,
});

export const db = drizzle(client, { schema });
