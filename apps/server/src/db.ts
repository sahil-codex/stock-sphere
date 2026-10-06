import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./auth/auth-schema";
import dns from "node:dns/promises";

const rawUrl = process.env.DATABASE_URL;

if (!rawUrl) {
  throw new Error("DATABASE_URL environment variable is missing.");
}

const parsed = new URL(rawUrl);

let host = parsed.hostname;
try {
  const ips = await dns.resolve4(parsed.hostname);
  if (ips.length > 0) {
    host = ips[0];
  }
} catch {
  // fallback to hostname if resolve4 fails
}

const client = postgres({
  host,
  port: Number(parsed.port) || 5432,
  database: parsed.pathname.slice(1),
  username: parsed.username,
  password: decodeURIComponent(parsed.password),
  ssl: { servername: parsed.hostname, rejectUnauthorized: false },
});

export const db = drizzle(client, { schema });