import { Pool } from "pg";
import { dbConfig } from "./config";
import { user } from "./tables/user.table";
import { session } from "./tables/session.table";
import { subscription } from "./tables/subscription.table";
import { payment } from "./tables/payment.table";
import { drizzle } from "drizzle-orm/node-postgres";

const pool = new Pool(dbConfig);

const schema = {
    user,
    session,
    subscription,
    payment,
};

export const database = drizzle(pool, { schema });