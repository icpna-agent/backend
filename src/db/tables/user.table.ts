import { pgTable, text, serial } from "drizzle-orm/pg-core";

export const user = pgTable(
    "user",
    {
        id: serial("id").primaryKey(),
        username: text("username").unique().notNull(),
        password: text("password").notNull(),
        phone: text("phone").unique().notNull(),
        mail: text("mail").notNull(),
        refreshHash: text("refresh_hash"),
    },
);

export type User = typeof user.$inferSelect;
export type UserDto = typeof user.$inferInsert;
export type UserUpdateDto = Omit<Partial<UserDto>, "id">;