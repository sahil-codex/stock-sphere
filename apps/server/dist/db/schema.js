import { uuid, varchar, integer, numeric, timestamp, pgEnum, index, check, pgTable, text, } from "drizzle-orm/pg-core";
import { user } from "@/auth/auth-schema";
import { sql } from "drizzle-orm";
export const products = pgTable("products", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 150 }).notNull(),
    category: varchar("category", { length: 100 }).notNull(),
    quantity: integer("quantity").notNull().default(0),
    price: numeric("price", { precision: 10, scale: 2 }).notNull(),
    lowStockThreshold: integer("low_stock_threshold")
        .notNull()
        .default(5),
    createdAt: timestamp("created_at")
        .defaultNow()
        .notNull(),
    updatedAt: timestamp("updated_at")
        .defaultNow()
        .notNull(),
}, (table) => [
    check("products_quantity_nonnegative", sql `${table.quantity} >= 0`),
    check("products_price_nonnegative", sql `${table.price} >= 0`),
    check("products_threshold_nonnegative", sql `${table.lowStockThreshold} >= 0`),
    index("products_name_idx").on(table.name),
]);
export const stockTransactionType = pgEnum("stock_transaction_type", [
    "IN",
    "OUT",
]);
export const stockTransactions = pgTable("stock_transactions", {
    id: uuid("id").defaultRandom().primaryKey(),
    productId: uuid("product_id")
        .notNull()
        .references(() => products.id, { onDelete: "restrict" }),
    type: stockTransactionType("type").notNull(),
    quantity: integer("quantity").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
    check("stock_transactions_quantity_positive", sql `${table.quantity} > 0`),
    index("stock_transactions_product_id_idx").on(table.productId),
]);
