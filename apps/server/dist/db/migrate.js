import { config } from "dotenv";
import { resolve } from "path";
import https from "https";
import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";
// Load env from monorepo root
config({ path: resolve(process.cwd(), "../../.env") });
// Custom fetch that forces IPv4 to avoid ETIMEDOUT issues on systems
// where Node.js undici (built-in fetch) struggles with dual-stack DNS
function ipv4Fetch(url, init) {
    return new Promise((resolve, reject) => {
        const parsedUrl = new URL(url.toString());
        const options = {
            hostname: parsedUrl.hostname,
            port: Number(parsedUrl.port) || 443,
            path: parsedUrl.pathname + parsedUrl.search,
            method: init?.method || "GET",
            headers: init?.headers || {},
            family: 4,
        };
        const req = https.request(options, (res) => {
            const chunks = [];
            res.on("data", (chunk) => chunks.push(chunk));
            res.on("end", () => {
                const body = Buffer.concat(chunks);
                const bodyText = body.toString();
                resolve(new globalThis.Response(bodyText, {
                    status: res.statusCode,
                    headers: res.headers,
                }));
            });
        });
        req.on("error", reject);
        const reqBody = init?.body;
        if (reqBody) {
            req.write(reqBody);
        }
        req.end();
    });
}
neonConfig.fetchFunction = ipv4Fetch;
const sql = neon(process.env.DATABASE_URL);
const db = drizzle({ client: sql });
async function main() {
    console.log("⏳ Running migrations...");
    await migrate(db, { migrationsFolder: "./drizzle", migrationsSchema: "public" });
    console.log("✅ Migrations applied successfully!");
    process.exit(0);
}
main().catch((err) => {
    console.error("❌ Migration failed:", err);
    process.exit(1);
});
