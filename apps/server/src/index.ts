import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { cors } from "hono/cors";
import { db } from "./db";
import { sql } from "drizzle-orm";
import { auth } from "./auth/auth";

const app = new Hono();

app.use(
  "/api/auth/*",
  cors({
    origin: "https://stock-sphere-1.onrender.com",
    credentials: true,
  }),
);

app.get("/api/health/db", async (c) => {
  try {
    await db.execute(sql`SELECT 1`);
    return c.json({ database: "connected" });
  } catch {
    return c.json({ database: "disconnected" }, 503);
  }
});

app.on(["GET", "POST"], "/api/auth/*", (c) => {
  return auth.handler(c.req.raw);
});

app.get("/", (c) => {
  return c.json({
    message: "StockSphere API is running",
  });
});

app.get("/api/health", (c) => {
  return c.json({
    status: "ok",
  });
});

const port = Number(process.env.PORT) || 3001;

serve({
  fetch: app.fetch,
  port,
  hostname:"0.0.0.0",
});

console.log(`Server running on port:${port}`);