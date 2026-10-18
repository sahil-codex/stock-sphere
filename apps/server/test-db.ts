import dotenv from "dotenv";
import { neon } from "@neondatabase/serverless";

dotenv.config({ path: "../../.env" });

async function main() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is missing");
  }

  try {
    const sql = neon(databaseUrl);
    const result = await sql`SELECT current_database() AS database`;

    console.log("Database connection successful:", result);
  } catch (error) {
    console.error("Database connection failed:", error);
    process.exitCode = 1;
  }
}

main();