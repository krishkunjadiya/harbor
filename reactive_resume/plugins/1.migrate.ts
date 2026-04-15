import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { definePlugin } from "nitro";
import { Pool } from "pg";

function isTruthy(value: string | undefined): boolean {
  return ["1", "true", "yes", "on"].includes((value ?? "").toLowerCase());
}

function resolveMigrationsFolder(): string | null {
  const pluginDir = dirname(fileURLToPath(import.meta.url));
  const candidates = [
    resolve(process.cwd(), "migrations"),
    resolve(pluginDir, "../migrations"),
  ];

  for (const folder of candidates) {
    if (existsSync(folder)) return folder;
  }

  return null;
}

async function migrateDatabase() {
  console.info("Running database migrations...");

  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  const migrationsFolder = resolveMigrationsFolder();

  if (!migrationsFolder) {
    console.warn(
      "Skipping database migrations because migrations folder is not available in runtime package",
    );
    return;
  }

  const pool = new Pool({ connectionString });
  const db = drizzle({ client: pool });

  try {
    await migrate(db, { migrationsFolder });
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
