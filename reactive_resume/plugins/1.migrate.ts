import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { definePlugin } from "nitro";
import { Pool } from "pg";

function isTruthy(value: string | undefined): boolean {
  return ["1", "true", "yes", "on"].includes((value ?? "").toLowerCase());
}

async function migrateDatabase() {
  console.info("Running database migrations...");

  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  const pool = new Pool({ connectionString });
  const db = drizzle({ client: pool });

  try {
    await migrate(db, { migrationsFolder: "./migrations" });
    console.info("Database migrations completed");
  } catch (error) {
    console.error({ err: error }, "Database migrations failed");
    throw error;
  } finally {
    await pool.end();
  }
}

export default definePlugin(async () => {
  if (isTruthy(process.env.SKIP_DB_MIGRATIONS)) {
    console.warn("Skipping database migrations because SKIP_DB_MIGRATIONS is enabled");
    return;
  }

  try {
    await migrateDatabase();
  } catch (error) {
    if (process.env.NODE_ENV === "production") {
      throw error;
    }

    console.warn("Continuing startup without successful database migrations (non-production mode)");
  }
});
