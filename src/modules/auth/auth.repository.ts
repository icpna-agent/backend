import { database } from "@/db/connection";
import { User, user, UserDto } from "@/db/tables/user.table";
import { Injectable } from "@nestjs/common";
import { eq, or } from "drizzle-orm";
import { DatabaseError } from "pg";

export const UNIQUE_VIOLATION_CODES = ["USERNAME_ALREADY_EXISTS", "PHONE_ALREADY_EXISTS", "DUPLICATE_VALUE"];

@Injectable()
export class AuthRepository {
    async findOneByUserOrPhone(userOrPhone: string): Promise<User | null> {
        const conditions = 
            or(
                eq(user.username, userOrPhone),
                eq(user.phone, userOrPhone),
            );

        const result = await database
            .select()
            .from(user)
            .where(conditions)
            .limit(1);
        return result[0] ?? null;
    }

    async createUser(dto: UserDto): Promise<User | null> {
        try {
            const inserted = await database
                .insert(user)
                .values(dto)
                .returning();

            // returning() yields an array of inserted rows
            return inserted[0] ?? null;
        } catch (err: unknown) {
            // Postgres unique violation
            if (err instanceof DatabaseError && err.code === "23505") {
                const detail: string = err.constraint || err.detail || "";
                if (detail.includes("username") || detail.includes("user_username_key") ) {
                    throw new Error(UNIQUE_VIOLATION_CODES[0]);
                }
                if (detail.includes("phone") || detail.includes("user_phone_key")) {
                    throw new Error(UNIQUE_VIOLATION_CODES[1]);
                }
                throw new Error(UNIQUE_VIOLATION_CODES[2]);
            }

            throw err;
        }
    }
}