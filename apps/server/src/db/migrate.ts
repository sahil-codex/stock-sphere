import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import dns from "node:dns/promises";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const possibleEnvPaths = [
  path.resolve(process.cwd(), "../../.env"),
  path.resolve(process.cwd(), ".env"),
  path.resolve(__dirname, "../../../.env"),
];

for (const envPath of possibleEnvPaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
}

const rawUrl = process.env.DATABASE_URL;

if (!rawUrl) {
  console.error("❌ DATABASE_URL is not defined in .env");
  process.exit(1);
}

const cleanUrl = rawUrl.replace("-pooler", "").replace("&channel_binding=require", "");
const parsed = new URL(cleanUrl);

let host = parsed.hostname;
try {
  const ips = await dns.resolve4(parsed.hostname);
  if (ips.length > 0) {
    host = ips[0];
  }
} catch {
  // fallback to hostname
}

console.log(`⏳ Connecting to Neon database (${host})...`);

const sql = postgres({
  host,
  port: Number(parsed.port) || 5432,
  database: parsed.pathname.slice(1),
  username: parsed.username,
  password: decodeURIComponent(parsed.password),
  ssl: { servername: parsed.hostname, rejectUnauthorized: false },
  max: 1,
  connect_timeout: 10,
});

const db = drizzle(sql);

async function main() {
  try {
    const drizzleDir = path.resolve(__dirname, "../../drizzle");
    await migrate(db, { migrationsFolder: drizzleDir });
    console.log("✅ Migrations applied successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

main();
