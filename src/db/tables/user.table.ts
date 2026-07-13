import { sql } from "drizzle-orm";
import { index, pgTable, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const user = pgTable(
    "user",
    {
        id: serial("id").primaryKey(),
        username: text("username").notNull(),
        password: text("password").notNull(),
        phone: text("phone").notNull(),
        mail: text("mail").notNull(),
        refreshHash: text("refresh_hash"),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at").defaultNow().notNull(),
        deletedAt: timestamp("deleted_at"),
    },
    (table) => [
        uniqueIndex("user_username_unique_active_idx")
            .on(table.username)
            .where(sql`${table.deletedAt} IS NULL`),
        uniqueIndex("user_phone_unique_active_idx")
            .on(table.phone)
            .where(sql`${table.deletedAt} IS NULL`),
        index("user_created_at_idx").on(table.createdAt),
    ],
);

export type User = typeof user.$inferSelect;
export type UserDto = typeof user.$inferInsert;
export type UserUpdateDto = Omit<Partial<UserDto>, "id">;
