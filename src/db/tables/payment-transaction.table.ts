import {
  decimal,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { user } from './user.table';

export const paymentStatusEnum = pgEnum('payment_status', [
  'pending',
  'approved',
  'rejected',
  'cancelled',
  'refunded',
  'failed',
]);

export type PaymentProviderResponse = Record<string, unknown>;

export const paymentTransaction = pgTable(
  'payment_transaction',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    externalReference: varchar('external_reference', { length: 80 }).notNull(),
    providerPreferenceId: varchar('provider_preference_id', { length: 180 }),
    providerPaymentId: varchar('provider_payment_id', { length: 180 }),
    status: paymentStatusEnum('status').default('pending').notNull(),
    amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
    currency: varchar('currency', { length: 10 }).default('PEN').notNull(),
    checkoutUrl: text('checkout_url'),
    statusDetail: text('status_detail'),
    rawProviderResponse: jsonb(
      'raw_provider_response',
    ).$type<PaymentProviderResponse>(),
    engineEnabledAt: timestamp('engine_enabled_at'),
    engineError: text('engine_error'),
    paidAt: timestamp('paid_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => [
    uniqueIndex('payment_transaction_external_reference_unique_active_idx')
      .on(table.externalReference)
      .where(sql`${table.deletedAt} IS NULL`),
    uniqueIndex('payment_transaction_provider_payment_id_unique_active_idx')
      .on(table.providerPaymentId)
      .where(sql`${table.providerPaymentId} IS NOT NULL AND ${table.deletedAt} IS NULL`),
    index('payment_transaction_user_id_idx').on(table.userId),
    index('payment_transaction_status_idx').on(table.status),
    index('payment_transaction_created_at_idx').on(table.createdAt),
  ],
);

export type PaymentTransaction = typeof paymentTransaction.$inferSelect;
export type PaymentTransactionDto = typeof paymentTransaction.$inferInsert;
