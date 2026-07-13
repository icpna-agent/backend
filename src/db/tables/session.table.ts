import { index, integer, jsonb, pgTable, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { user } from "./user.table";

export const session = pgTable(
    "session",
    {
        id: serial("id").primaryKey(),
        userId: integer("user_id").notNull().references(() => user.id),
        sessionToken: text("session_token").notNull(),
        tabId: text("tab_id").notNull(),
        status: text("status").notNull().default("active"),
        createdAt: timestamp("created_at").notNull().defaultNow(),
        updatedAt: timestamp("updated_at").notNull().defaultNow(),
        deletedAt: timestamp("deleted_at"),
        expiresAt: timestamp("expires_at").notNull(),
        lastActivityAt: timestamp("last_activity_at"),
        revokedAt: timestamp("revoked_at"),
        ipAddress: text("ip_address"),
        userAgent: text("user_agent"),
        device: text("device"),
        metadata: jsonb("metadata"),
    },
    (table) => [
        uniqueIndex("session_session_token_unique_idx").on(table.sessionToken),
        index("session_user_id_idx").on(table.userId),
        index("session_created_at_idx").on(table.createdAt),
    ],
);

export type Session = typeof session.$inferSelect;
export type SessionDto = typeof session.$inferInsert;
