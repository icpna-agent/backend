import { Injectable } from "@nestjs/common";
import { database } from "@/db/connection";
import { payment, subscription } from "@/db/tables";
import { eq, and } from "drizzle-orm";
import type { Payment, Subscription } from "@/db/tables";

@Injectable()
export class PaymentRepository {
    async createPayment(data: {
        user_id: number;
        mp_payment_id?: string;
        mp_request_id?: string;
        amount: string;
        currency: string;
        status: string;
    }): Promise<Payment> {
        const result = await database
            .insert(payment)
            .values(data)
            .returning();
        return result[0];
    }

    async getPaymentByRequestId(requestId: string): Promise<Payment | undefined> {
        const result = await database
            .select()
            .from(payment)
            .where(eq(payment.mp_request_id, requestId))
            .limit(1);
        return result[0];
    }

    async updatePaymentStatus(
        paymentId: number,
        status: string,
        mp_payment_id?: string,
    ): Promise<Payment> {
        const updates: any = { status, updated_at: new Date() };
        if (mp_payment_id) {
            updates.mp_payment_id = mp_payment_id;
        }
        const result = await database
            .update(payment)
            .set(updates)
            .where(eq(payment.id, paymentId))
            .returning();
        return result[0];
    }

    async getActiveSubscription(userId: number): Promise<Subscription | undefined> {
        const result = await database
            .select()
            .from(subscription)
            .where(and(eq(subscription.user_id, userId), eq(subscription.status, "active")))
            .orderBy(subscription.expires_at)
            .limit(1);
        return result[0];
    }

    async createSubscription(data: {
        user_id: number;
        status: string;
        expires_at: Date;
    }): Promise<Subscription> {
        const result = await database
            .insert(subscription)
            .values({
                ...data,
                started_at: new Date(),
                created_at: new Date(),
                updated_at: new Date(),
            })
            .returning();
        return result[0];
    }

    async updateSubscription(
        subscriptionId: number,
        data: Partial<{
            status: string;
            expires_at: Date;
        }>,
    ): Promise<Subscription> {
        const result = await database
            .update(subscription)
            .set({ ...data, updated_at: new Date() })
            .where(eq(subscription.id, subscriptionId))
            .returning();
        return result[0];
    }
}
