import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { cors } from "hono/cors";
import { db } from "./db";
import { sql, and, eq, desc } from "drizzle-orm";
import { z } from "zod";
import { auth } from "./auth/auth";
import { products,stockTransactions } from "./db/schema";
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

const updateProductSchema = z
  .object({
    name: z.string().trim().min(1).max(150).optional(),
    category: z.string().trim().min(1).max(100).optional(),
    price: z.number().finite().nonnegative().optional(),
    lowStockThreshold: z.number().int().nonnegative().optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Provide at least one field to update",
  });

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

    const { quantity, price, ...details } = parsed.data;

    const result = await db.execute(sql`
      WITH new_product AS (
        INSERT INTO products (
          user_id,
          name,
          category,
          quantity,
          price,
          low_stock_threshold
        )
        VALUES (
          ${userId},
          ${details.name},
          ${details.category},
          ${quantity},
          ${price.toFixed(2)},
          ${details.lowStockThreshold}
        )
        RETURNING *
      ),
      opening_transaction AS (
        INSERT INTO stock_transactions (
          product_id,
          type,
          quantity
        )
        SELECT id, 'IN'::stock_transaction_type, quantity
        FROM new_product
        WHERE quantity > 0
        RETURNING id
      )
      SELECT new_product.*
      FROM new_product
    `);

    const row = result.rows[0];

    if (!row) {
      return c.json({ error: "Failed to create product" }, 500);
    }

    return c.json({ product: row }, 201);
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


const stockTransactionSchema = z.object({
  type: z.enum(["IN", "OUT"]),
  quantity: z.number().int().positive(),
});

// Record stock IN or OUT atomically.
app.post("/api/products/:id/transactions", async (c) => {
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

    const parsed = stockTransactionSchema.safeParse(body);

    if (!parsed.success) {
      return c.json(
        { error: "Invalid transaction data", details: parsed.error.issues },
        400,
      );
    }

    const { type, quantity } = parsed.data;

    // One SQL statement: change stock and record the transaction.
    // The product ownership check prevents cross-user modifications.
    const result = await db.execute(sql`
      WITH updated_product AS (
        UPDATE products
        SET
          quantity = quantity ${
            type === "IN"
              ? sql`+ ${quantity}`
              : sql`- ${quantity}`
          },
          updated_at = NOW()
        WHERE id = ${id.data}
          AND user_id = ${userId}
          ${
            type === "OUT"
              ? sql`AND quantity >= ${quantity}`
              : sql``
          }
        RETURNING id, quantity
      ),
      inserted_transaction AS (
        INSERT INTO stock_transactions (product_id, type, quantity)
        SELECT id, ${type}::stock_transaction_type, ${quantity}
        FROM updated_product
        RETURNING id, product_id, type, quantity, created_at
      )
      SELECT
        inserted_transaction.id,
        inserted_transaction.product_id AS "productId",
        inserted_transaction.type,
        inserted_transaction.quantity,
        inserted_transaction.created_at AS "createdAt",
        updated_product.quantity AS "updatedQuantity"
      FROM inserted_transaction
      JOIN updated_product
        ON updated_product.id = inserted_transaction.product_id
    `);

    const transaction = result.rows[0];

    if (!transaction) {
      const [product] = await db
        .select({ id: products.id })
        .from(products)
        .where(and(
          eq(products.id, id.data),
          eq(products.userId, userId),
        ))
        .limit(1);

      if (!product) {
        return c.json({ error: "Product not found" }, 404);
      }

      return c.json(
        { error: "Insufficient stock for this transaction" },
        409,
      );
    }

    return c.json({ transaction }, 201);
  } catch (error) {
    console.error("Create stock transaction failed:", error);
    return c.json({ error: "Failed to record stock transaction" }, 500);
  }
});

// List transaction history for the signed-in user.
app.get("/api/transactions", async (c) => {
  try {
    const userId = await getSessionUserId(c.req.raw.headers);

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const result = await db
      .select({
        id: stockTransactions.id,
        productId: stockTransactions.productId,
        productName: products.name,
        type: stockTransactions.type,
        quantity: stockTransactions.quantity,
        createdAt: stockTransactions.createdAt,
      })
      .from(stockTransactions)
      .innerJoin(products, eq(stockTransactions.productId, products.id))
      .where(eq(products.userId, userId))
      .orderBy(desc(stockTransactions.createdAt));

    return c.json({ transactions: result });
  } catch (error) {
    console.error("List stock transactions failed:", error);
    return c.json({ error: "Failed to fetch transactions" }, 500);
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

app.get("/api/health/db-details", async (c) => {
  try {
    const result = await db.execute(sql`
      SELECT
        current_database() AS database_name,
        current_schema() AS schema_name,
        current_setting('search_path') AS search_path,
        to_regclass('public.products') AS products_table
    `);

    return c.json({ database: result.rows });
  } catch (error) {
    console.error("Database diagnostics failed:", error);
    return c.json({ error: "Database diagnostics failed" }, 500);
  }
});

const port = Number(process.env.PORT) || 3001;

serve({
  fetch: app.fetch,
  port,
  hostname: "0.0.0.0",
});

console.log(`Server running on port: ${port}`);
