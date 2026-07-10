import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./user.table";

export const subscription = pgTable(
    "subscription",
    {
        id: serial("id").primaryKey(),
        user_id: integer("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
        status: text("status").notNull().default("inactive"), // 'active' | 'inactive' | 'expired'
        started_at: timestamp("started_at").notNull().defaultNow(),
        expires_at: timestamp("expires_at").notNull(),
        created_at: timestamp("created_at").notNull().defaultNow(),
        updated_at: timestamp("updated_at").notNull().defaultNow(),
    },
);

export type Subscription = typeof subscription.$inferSelect;
export type SubscriptionDto = typeof subscription.$inferInsert;
