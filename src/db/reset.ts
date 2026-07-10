import { sql } from "drizzle-orm";
import { database } from "./connection";

async function reset() {
  try {
    console.log("🗑️  Eliminando todas las tablas y objetos del schema public...");

    await database.execute(sql`DROP SCHEMA public CASCADE`);
    await database.execute(sql`CREATE SCHEMA public`);

    console.log("✅ Base de datos limpiada exitosamente");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error al limpiar la base de datos:", error);
    process.exit(1);
  }
}

reset();
