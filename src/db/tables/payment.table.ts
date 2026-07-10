import { pgTable, serial, integer, text, timestamp, numeric } from "drizzle-orm/pg-core";
import { user } from "./user.table";

export const payment = pgTable(
    "payment",
    {
        id: serial("id").primaryKey(),
        user_id: integer("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
        mp_payment_id: text("mp_payment_id").unique(), // Mercado Pago payment ID
        mp_request_id: text("mp_request_id").unique(), // For webhook idempotency
        amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
        currency: text("currency").notNull().default("PEN"),
        status: text("status").notNull().default("pending"), // 'pending' | 'approved' | 'rejected' | 'failed'
        created_at: timestamp("created_at").notNull().defaultNow(),
        updated_at: timestamp("updated_at").notNull().defaultNow(),
    },
);

export type Payment = typeof payment.$inferSelect;
export type PaymentDto = typeof payment.$inferInsert;
