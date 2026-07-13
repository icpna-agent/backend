import {
  index,
  integer,
  pgEnum,
  pgTable,
  serial,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { paymentTransaction } from './payment-transaction.table';
import { user } from './user.table';

export const subscriptionStatusEnum = pgEnum('subscription_status', [
  'active',
  'inactive',
  'cancelled',
  'expired',
]);

export const subscription = pgTable(
  'subscription',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    plan: varchar('plan', { length: 40 }).default('basic').notNull(),
    status: subscriptionStatusEnum('status').default('inactive').notNull(),
    startsAt: timestamp('starts_at'),
    expiresAt: timestamp('expires_at'),
    lastPaymentId: integer('last_payment_id').references(
      () => paymentTransaction.id,
    ),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => [
    uniqueIndex('subscription_user_id_unique_active_idx')
      .on(table.userId)
      .where(sql`${table.deletedAt} IS NULL`),
    index('subscription_status_idx').on(table.status),
    index('subscription_expires_at_idx').on(table.expiresAt),
  ],
);

export type Subscription = typeof subscription.$inferSelect;
