import { database } from '@/db/connection';
import { User, user, UserDto, UserUpdateDto } from '@/db/tables/user.table';
import { Injectable } from '@nestjs/common';
import { eq, or } from 'drizzle-orm';
import { DrizzleQueryError } from 'drizzle-orm/errors';
import { DatabaseError } from 'pg';

export const UNIQUE_VIOLATION_CODES = [
    'El usuario ya existe',
    'Este número ya ha sido usado',
    'usuario duplicado'
];

@Injectable()
export class AuthRepository {
    async findById(id: number): Promise<User | null> {
        const result = await database
            .select()
            .from(user)
            .where(eq(user.id, id))
            .limit(1);
        
        return result[0] ?? null;
    }

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
            if (err instanceof DrizzleQueryError
                && err.cause instanceof DatabaseError
                && err.cause.code === '23505') {
                const detail: string = err.cause.constraint || err.cause.detail || '';
                if (detail.includes('username') || detail.includes('user_username_key') ) {
                    throw new Error(UNIQUE_VIOLATION_CODES[0]);
                }
                if (detail.includes('phone') || detail.includes('user_phone_key')) {
                    throw new Error(UNIQUE_VIOLATION_CODES[1]);
                }
                throw new Error(UNIQUE_VIOLATION_CODES[2]);
            }

            throw err;
        }
    }

    async updateUser(userId: number, updates: UserUpdateDto): Promise<User | null> {
        const fieldsToUpdate = Object.fromEntries(
            Object.entries(updates).filter(([, value]) => value !== undefined),
        ) as UserUpdateDto;

        if (Object.keys(fieldsToUpdate).length === 0) {
            return null;
        }

        try {
            const updated = await database
                .update(user)
                .set(fieldsToUpdate)
                .where(eq(user.id, userId))
                .returning();

            return updated[0] ?? null;
        } catch (err: unknown) {
            if (err instanceof DrizzleQueryError
                && err.cause instanceof DatabaseError
                && err.cause.code === '23505') {
                const detail: string = err.cause.constraint || err.cause.detail || '';
                if (detail.includes('username') || detail.includes('user_username_key')) {
                    throw new Error(UNIQUE_VIOLATION_CODES[0]);
                }
                if (detail.includes('phone') || detail.includes('user_phone_key')) {
                    throw new Error(UNIQUE_VIOLATION_CODES[1]);
                }
                throw new Error(UNIQUE_VIOLATION_CODES[2]);
            }

            throw err;
        }
    }
}