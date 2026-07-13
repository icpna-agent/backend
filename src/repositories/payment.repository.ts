import { database } from '@db/connection.db';
import {
  PaymentProviderResponse,
  PaymentTransactionDto,
  paymentTransaction,
} from '@db/tables/payment-transaction.table';
import { subscription } from '@db/tables/subscription.table';
import { user } from '@db/tables/user.table';
import { Injectable } from '@nestjs/common';
import { and, desc, eq, gt, isNull, ne } from 'drizzle-orm';

@Injectable()
export class PaymentRepository {
  async findUserById(userId: number) {
    const result = await database
      .select()
      .from(user)
      .where(and(eq(user.id, userId), isNull(user.deletedAt)))
      .limit(1);
    return result[0];
  }

  async createPayment(data: PaymentTransactionDto) {
    const result = await database
      .insert(paymentTransaction)
      .values(data)
      .returning();
    return result[0];
  }

  async findReusablePending(userId: number, createdAfter: Date) {
    const result = await database
      .select()
      .from(paymentTransaction)
      .where(
        and(
          eq(paymentTransaction.userId, userId),
          eq(paymentTransaction.status, 'pending'),
          gt(paymentTransaction.createdAt, createdAfter),
          isNull(paymentTransaction.deletedAt),
        ),
      )
      .orderBy(desc(paymentTransaction.createdAt))
      .limit(1);
    return result[0];
  }

  async findByExternalReference(externalReference: string) {
    const result = await database
      .select()
      .from(paymentTransaction)
      .where(
        and(
          eq(paymentTransaction.externalReference, externalReference),
          isNull(paymentTransaction.deletedAt),
        ),
      )
      .limit(1);
    return result[0];
  }

  async updatePayment(
    id: number,
    data: Partial<{
      providerPreferenceId: string | null;
      providerPaymentId: string | null;
      status:
        | 'pending'
        | 'approved'
        | 'rejected'
        | 'cancelled'
        | 'refunded'
        | 'failed';
      checkoutUrl: string | null;
      statusDetail: string | null;
      rawProviderResponse: PaymentProviderResponse | null;
      engineEnabledAt: Date | null;
      engineError: string | null;
      paidAt: Date | null;
    }>,
  ) {
    const result = await database
      .update(paymentTransaction)
      .set({ ...data, updatedAt: new Date() })
      .where(
        and(
          eq(paymentTransaction.id, id),
          isNull(paymentTransaction.deletedAt),
        ),
      )
      .returning();
    return result[0];
  }

  async approveAndActivate(
    paymentId: number,
    data: {
      providerPaymentId: string;
      statusDetail: string | null;
      rawProviderResponse: PaymentProviderResponse;
      paidAt: Date;
      startsAt: Date;
      expiresAt: Date;
    },
  ) {
    return database.transaction(async (tx) => {
      const approved = await tx
        .update(paymentTransaction)
        .set({
          providerPaymentId: data.providerPaymentId,
          status: 'approved',
          statusDetail: data.statusDetail,
          rawProviderResponse: data.rawProviderResponse,
          paidAt: data.paidAt,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(paymentTransaction.id, paymentId),
            ne(paymentTransaction.status, 'approved'),
            isNull(paymentTransaction.deletedAt),
          ),
        )
        .returning();

      if (!approved[0]) {
        return { activated: false };
      }

      const existingSubscription = await tx
        .select({ id: subscription.id })
        .from(subscription)
        .where(
          and(
            eq(subscription.userId, approved[0].userId),
            isNull(subscription.deletedAt),
          ),
        )
        .limit(1);

      if (existingSubscription[0]) {
        await tx
          .update(subscription)
          .set({
            plan: 'basic',
            status: 'active',
            startsAt: data.startsAt,
            expiresAt: data.expiresAt,
            lastPaymentId: approved[0].id,
            updatedAt: new Date(),
          })
          .where(eq(subscription.id, existingSubscription[0].id));
      } else {
        await tx.insert(subscription).values({
          userId: approved[0].userId,
          plan: 'basic',
          status: 'active',
          startsAt: data.startsAt,
          expiresAt: data.expiresAt,
          lastPaymentId: approved[0].id,
        });
      }

      return { activated: true };
    });
  }

  async findSubscription(userId: number) {
    const result = await database
      .select()
      .from(subscription)
      .where(
        and(eq(subscription.userId, userId), isNull(subscription.deletedAt)),
      )
      .limit(1);
    return result[0];
  }

  async markSubscriptionExpired(userId: number) {
    await database
      .update(subscription)
      .set({ status: 'expired', updatedAt: new Date() })
      .where(
        and(
          eq(subscription.userId, userId),
          eq(subscription.status, 'active'),
          isNull(subscription.deletedAt),
        ),
      );
  }

  async findPaymentHistory(userId: number) {
    return database
      .select({
        id: paymentTransaction.id,
        amount: paymentTransaction.amount,
        currency: paymentTransaction.currency,
        status: paymentTransaction.status,
        statusDetail: paymentTransaction.statusDetail,
        paidAt: paymentTransaction.paidAt,
        createdAt: paymentTransaction.createdAt,
      })
      .from(paymentTransaction)
      .where(
        and(
          eq(paymentTransaction.userId, userId),
          isNull(paymentTransaction.deletedAt),
        ),
      )
      .orderBy(desc(paymentTransaction.createdAt))
      .limit(50);
  }
}
