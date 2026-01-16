/**
 * Database migration runner for PostgreSQL
 * Usage: deno run --allow-net --allow-read --allow-env scripts/migrate.ts
 */

import { Client } from "https://deno.land/x/postgres@v0.19.3/mod.ts";

const MIGRATIONS_DIR = "./migrations";

interface Migration {
  id: number;
  name: string;
  appliedAt: Date;
}

async function getClient(): Promise<Client> {
  const databaseUrl = Deno.env.get("DATABASE_URL");
  if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  const client = new Client(databaseUrl);
  await client.connect();
  return client;
}

async function ensureMigrationsTable(client: Client): Promise<void> {
  await client.queryArray(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) UNIQUE NOT NULL,
      applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);
}

async function getAppliedMigrations(client: Client): Promise<Set<string>> {
  const result = await client.queryObject<{ name: string }>(
    "SELECT name FROM _migrations ORDER BY id"
  );
  return new Set(result.rows.map((row) => row.name));
}

async function getMigrationFiles(): Promise<string[]> {
  const files: string[] = [];

  for await (const entry of Deno.readDir(MIGRATIONS_DIR)) {
    if (entry.isFile && entry.name.endsWith(".sql")) {
      files.push(entry.name);
    }
  }

  // Sort by migration number (assumes format: 001_name.sql)
  return files.sort((a, b) => {
    const numA = parseInt(a.split("_")[0]);
    const numB = parseInt(b.split("_")[0]);
    return numA - numB;
  });
}

async function runMigration(client: Client, filename: string): Promise<void> {
  const filepath = `${MIGRATIONS_DIR}/${filename}`;
  const sql = await Deno.readTextFile(filepath);

  console.log(`Running migration: ${filename}`);

  try {
    // Run migration in a transaction
    await client.queryArray("BEGIN");
    await client.queryArray(sql);
    await client.queryArray(
      "INSERT INTO _migrations (name) VALUES ($1)",
      [filename]
    );
    await client.queryArray("COMMIT");
    console.log(`✓ Migration applied: ${filename}`);
  } catch (error) {
    await client.queryArray("ROLLBACK");
    throw new Error(`Failed to apply migration ${filename}: ${error}`);
  }
}

async function migrate(): Promise<void> {
  console.log("Starting database migration...\n");

  const client = await getClient();

  try {
    await ensureMigrationsTable(client);

    const applied = await getAppliedMigrations(client);
    const files = await getMigrationFiles();

    const pending = files.filter((f) => !applied.has(f));

    if (pending.length === 0) {
      console.log("No pending migrations.");
      return;
    }

    console.log(`Found ${pending.length} pending migration(s):\n`);

    for (const file of pending) {
      await runMigration(client, file);
    }

    console.log("\n✓ All migrations applied successfully!");
  } finally {
    await client.end();
  }
}

async function rollback(): Promise<void> {
  console.log("Rolling back last migration...\n");

  const client = await getClient();

  try {
    const result = await client.queryObject<Migration>(
      "SELECT * FROM _migrations ORDER BY id DESC LIMIT 1"
    );

    if (result.rows.length === 0) {
      console.log("No migrations to roll back.");
      return;
    }

    const lastMigration = result.rows[0];
    console.log(`Rolling back: ${lastMigration.name}`);

    // Note: This doesn't actually reverse the SQL - you'd need down migrations
    // For now, just remove from tracking table
    await client.queryArray(
      "DELETE FROM _migrations WHERE name = $1",
      [lastMigration.name]
    );

    console.log(`✓ Removed migration record: ${lastMigration.name}`);
    console.log("Note: Database changes were not reversed. Create a new migration to undo changes.");
  } finally {
    await client.end();
  }
}

async function status(): Promise<void> {
  console.log("Migration status:\n");

  const client = await getClient();

  try {
    await ensureMigrationsTable(client);

    const applied = await getAppliedMigrations(client);
    const files = await getMigrationFiles();

    for (const file of files) {
      const status = applied.has(file) ? "✓" : "○";
      console.log(`${status} ${file}`);
    }

    const pending = files.filter((f) => !applied.has(f));
    console.log(`\n${applied.size} applied, ${pending.length} pending`);
  } finally {
    await client.end();
  }
}

// CLI
const command = Deno.args[0] || "up";

switch (command) {
  case "up":
    await migrate();
    break;
  case "down":
    await rollback();
    break;
  case "status":
    await status();
    break;
  default:
    console.log("Usage: migrate.ts [up|down|status]");
    console.log("  up     - Apply pending migrations (default)");
    console.log("  down   - Roll back last migration");
    console.log("  status - Show migration status");
    Deno.exit(1);
}
