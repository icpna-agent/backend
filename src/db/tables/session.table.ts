import { integer, jsonb, serial, text, timestamp } from "drizzle-orm/pg-core";
import { pgTable } from "drizzle-orm/pg-core";
import { user } from "./user.table";

export const session = pgTable(
    "session",
    {
        id: serial("id").primaryKey(),
        user_id: integer("user_id").notNull().references(() => user.id),
        session_token: text("session_token").notNull().unique(),
        tab_id: text("tab_id").notNull(),
        status: text("status").notNull().default("active"),
        created_at: timestamp("created_at").notNull().defaultNow(),
        expires_at: timestamp("expires_at").notNull(),
        last_activity_at: timestamp("last_activity_at"),
        revoked_at: timestamp("revoked_at"),
        ip_address: text("ip_address"),
        user_agent: text("user_agent"),
        device: text("device"),
        metadata: jsonb("metadata"),
    },
);

export type Session = typeof session.$inferSelect;
export type SessionDto = typeof session.$inferInsert;
