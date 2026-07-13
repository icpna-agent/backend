import { Pool } from 'pg';
import { dbConfig } from '@db/config.db';
import { user } from './tables/user.table';
import { session } from './tables/session.table';
import { paymentTransaction } from './tables/payment-transaction.table';
import { subscription } from './tables/subscription.table';
import { drizzle } from 'drizzle-orm/node-postgres';

const pool = new Pool(dbConfig);

const schema = {
  user,
  session,
  paymentTransaction,
  subscription,
};

export const database = drizzle(pool, { schema });
