import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { cors } from "hono/cors";
import { db } from "./db";
import { sql, and, eq, desc } from "drizzle-orm";
import { z } from "zod";
import { auth } from "./auth/auth";
import { products } from "./db/schema";
import type { InferInsertModel } from "drizzle-orm";

const app = new Hono();

const allowedOrigins = new Set([
  "http://localhost:5173",
  "https://stock-sphere-1.onrender.com",
]);

app.use(
  "/api/*",
  cors({
    origin: (origin) =>
      allowedOrigins.has(origin) ? origin : undefined,
    credentials: true,
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  }),
);

// Better Auth routes
app.on(["GET", "POST"], "/api/auth/*", (c) => {
  return auth.handler(c.req.raw);
});

// Validate product input
const productSchema = z.object({
  name: z.string().trim().min(1).max(150),
  category: z.string().trim().min(1).max(100),
  quantity: z.number().int().nonnegative(),
  price: z.number().finite().nonnegative(),
  lowStockThreshold: z.number().int().nonnegative(),
});

const updateProductSchema = productSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: "Provide at least one field to update" },
);

const productIdSchema = z.string().uuid();

// Return the authenticated user's ID from Better Auth.
async function getSessionUserId(headers: Headers) {
  const session = await auth.api.getSession({ headers });
  return session?.user?.id ?? null;
}

// List products belonging to the signed-in user
app.get("/api/products", async (c) => {
  try {
    const userId = await getSessionUserId(c.req.raw.headers);

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const result = await db
      .select()
      .from(products)
      .where(eq(products.userId, userId))
      .orderBy(desc(products.createdAt));

    return c.json({ products: result });
  } catch (error) {
    console.error("List products failed:", error);
    return c.json({ error: "Failed to fetch products" }, 500);
  }
});

// Create a product
app.post("/api/products", async (c) => {
  try {
    const userId = await getSessionUserId(c.req.raw.headers);

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    let body: unknown;

    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: "Invalid JSON body" }, 400);
    }

    const parsed = productSchema.safeParse(body);

    if (!parsed.success) {
      return c.json(
        { error: "Invalid product data", details: parsed.error.issues },
        400,
      );
    }

    const [product] = await db
      .insert(products)
      .values({
        ...parsed.data,
        price: parsed.data.price.toFixed(2),
        userId,
      })
      .returning();

    return c.json({ product }, 201);
  } catch (error) {
    console.error("Create product failed:", error);
    return c.json({ error: "Failed to create product" }, 500);
  }
});

// Get one product owned by the signed-in user
app.get("/api/products/:id", async (c) => {
  try {
    const userId = await getSessionUserId(c.req.raw.headers);

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const id = productIdSchema.safeParse(c.req.param("id"));

    if (!id.success) {
      return c.json({ error: "Invalid product ID" }, 400);
    }

    const [product] = await db
      .select()
      .from(products)
      .where(and(eq(products.id, id.data), eq(products.userId, userId)))
      .limit(1);

    if (!product) {
      return c.json({ error: "Product not found" }, 404);
    }

    return c.json({ product });
  } catch (error) {
    console.error("Get product failed:", error);
    return c.json({ error: "Failed to fetch product" }, 500);
  }
});

// Update a product owned by the signed-in user
app.patch("/api/products/:id", async (c) => {
  try {
    const userId = await getSessionUserId(c.req.raw.headers);

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const id = productIdSchema.safeParse(c.req.param("id"));

    if (!id.success) {
      return c.json({ error: "Invalid product ID" }, 400);
    }

    let body: unknown;

    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: "Invalid JSON body" }, 400);
    }

    const parsed = updateProductSchema.safeParse(body);

    if (!parsed.success) {
      return c.json(
        { error: "Invalid product data", details: parsed.error.issues },
        400,
      );
    }

   
const { price, ...otherChanges } = parsed.data;

const changes: Partial<InferInsertModel<typeof products>> = {
  ...otherChanges,
  ...(price !== undefined ? { price: price.toFixed(2) } : {}),
  updatedAt: new Date(),
};


    const [product] = await db
      .update(products)
      .set(changes)
      .where(and(eq(products.id, id.data), eq(products.userId, userId)))
      .returning();

    if (!product) {
      return c.json({ error: "Product not found" }, 404);
    }

    return c.json({ product });
  } catch (error) {
    console.error("Update product failed:", error);
    return c.json({ error: "Failed to update product" }, 500);
  }
});

// Delete a product owned by the signed-in user
app.delete("/api/products/:id", async (c) => {
  try {
    const userId = await getSessionUserId(c.req.raw.headers);

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const id = productIdSchema.safeParse(c.req.param("id"));

    if (!id.success) {
      return c.json({ error: "Invalid product ID" }, 400);
    }

    const [deleted] = await db
      .delete(products)
      .where(and(eq(products.id, id.data), eq(products.userId, userId)))
      .returning({ id: products.id });

    if (!deleted) {
      return c.json({ error: "Product not found" }, 404);
    }

    return c.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Delete product failed:", error);
    return c.json({ error: "Failed to delete product" }, 500);
  }
});

// Health endpoints
app.get("/api/health/db", async (c) => {
  try {
    await db.execute(sql`SELECT 1`);
    return c.json({ database: "connected" });
  } catch {
    return c.json({ database: "disconnected" }, 503);
  }
});

app.get("/", (c) =>
  c.json({ message: "StockSphere API is running" }),
);

app.get("/api/health", (c) => c.json({ status: "ok" }));

const port = Number(process.env.PORT) || 3001;

serve({
  fetch: app.fetch,
  port,
  hostname: "0.0.0.0",
});

console.log(`Server running on port: ${port}`);
