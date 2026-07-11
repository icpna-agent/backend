//import { dbConfig } from "@/db/config";
import { Config } from "drizzle-kit";

export default {
    schema: "./src/db/tables/*.table.ts",
    out: "./drizzle",
    dialect: "postgresql",
    dbCredentials: {
        host: process.env.DB_HOST ?? 'localhost',
        port: parseInt(process.env.DB_PORT ?? '5432'),
        user: process.env.DB_USER ?? 'user',
        password: process.env.DB_PASSWORD ?? '',
        database: process.env.DB_NAME ?? 'database',
        ssl: process.env.NODE_ENV === 'production' ? {
            rejectUnauthorized: false,
        } : false,
    },
} satisfies Config;