/**
 * One-time seed script: marks existing migrations as already applied
 * in the public.__drizzle_migrations tracking table.
 *
 * Run this once to sync the migration tracker with the current DB state.
 * After this, `pnpm db:migrate` will only apply NEW migrations.
 */
import { config } from "dotenv";
import { resolve, join } from "path";
import { readFileSync } from "fs";
import { createHash } from "crypto";
import https from "https";
config({ path: resolve(process.cwd(), "../../.env") });
const DATABASE_URL = process.env.DATABASE_URL;
const parsedUrl = new URL(DATABASE_URL);
// ---- Custom IPv4 fetch (avoids undici ETIMEDOUT on dual-stack DNS) ----
function ipv4Post(path, body) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: parsedUrl.hostname,
            port: 443,
            path,
            method: "POST",
            family: 4,
            headers: {
                "Content-Type": "application/json",
                "Neon-Connection-String": DATABASE_URL,
                "Content-Length": Buffer.byteLength(body),
            },
        };
        const req = https.request(options, (res) => {
            let data = "";
            res.on("data", (d) => (data += d));
            res.on("end", () => resolve(data));
        });
        req.on("error", reject);
        req.write(body);
        req.end();
    });
}
async function runSQL(sql) {
    const body = JSON.stringify({ query: sql, params: [] });
    const result = await ipv4Post("/sql/v1", body);
    return JSON.parse(result);
}
const MIGRATIONS_FOLDER = "./drizzle";
const journalPath = join(MIGRATIONS_FOLDER, "meta", "_journal.json");
const journal = JSON.parse(readFileSync(journalPath, "utf-8"));
async function main() {
    console.log("⏳ Seeding migration tracker table...");
    // Create tracker table in public schema if not exists
    await runSQL(`
    CREATE TABLE IF NOT EXISTS public."__drizzle_migrations" (
      id SERIAL PRIMARY KEY,
      hash text NOT NULL,
      created_at bigint
    )
  `);
    // Check if already seeded
    const existing = (await runSQL(`SELECT hash FROM public."__drizzle_migrations" ORDER BY created_at ASC`));
    if (existing.rows && existing.rows.length >= journal.entries.length) {
        console.log(`✅ Already seeded (${existing.rows.length} migrations tracked). Nothing to do.`);
        process.exit(0);
    }
    const existingHashes = new Set((existing.rows || []).map((r) => r.hash));
    for (const entry of journal.entries) {
        const sqlPath = join(MIGRATIONS_FOLDER, `${entry.tag}.sql`);
        const sqlContent = readFileSync(sqlPath, "utf-8");
        const hash = createHash("sha256").update(sqlContent).digest("hex");
        if (existingHashes.has(hash)) {
            console.log(`  ⏭  Skipping already-tracked: ${entry.tag}`);
            continue;
        }
        await runSQL(`INSERT INTO public."__drizzle_migrations" (hash, created_at) VALUES ('${hash}', ${entry.when})`);
        console.log(`  ✅ Marked as applied: ${entry.tag}`);
    }
    console.log("✅ Migration tracker seeded successfully!");
    process.exit(0);
}
main().catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
});
