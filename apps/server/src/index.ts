import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { cors } from "hono/cors";

import { auth } from "./auth/auth";

const app = new Hono();

app.use(
  "/api/auth/*",
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);

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

serve({
  fetch: app.fetch,
  port: 3001,
});

console.log("Server running on http://localhost:3001");