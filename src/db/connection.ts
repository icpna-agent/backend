import { Pool } from "pg";
import { dbConfig } from "./config";
import { user } from "./tables/user.table";
import { session } from "./tables/session.table";
import { drizzle } from "drizzle-orm/node-postgres";

const pool = new Pool(dbConfig);

const schema = {
    user,
    session,
};

export const database = drizzle(pool, { schema });