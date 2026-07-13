import { dbConfig } from "@db/config.db";
import { Config } from "drizzle-kit";

export default {
    schema: "./src/db/tables/*.table.ts",
    out: "./drizzle",
    dialect: "postgresql",
    dbCredentials: dbConfig,
} satisfies Config;
