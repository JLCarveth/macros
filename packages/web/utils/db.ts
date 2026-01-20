/**
 * Database utility functions using PostgreSQL
 */

import { Client, Pool } from "postgres";
import type {
  User,
  UserWithPassword,
  NutritionRecord,
  CreateNutritionRecordInput,
  FoodLogEntry,
  FoodLogEntryWithNutrition,
  CreateFoodLogInput,
  DailySummary,
  MealType,
} from "@nutrition-llama/shared";

// Create a connection pool
let pool: Pool | null = null;

/**
 * Build database connection config from environment variables.
 * Prefers individual PG* variables, falls back to DATABASE_URL.
 */
function getConnectionConfig(): string | {
  hostname: string;
  port: number;
  user: string;
  password: string;
  database: string;
} {
  const pgHost = Deno.env.get("PGHOST");
  const pgUser = Deno.env.get("PGUSER");
  const pgPassword = Deno.env.get("PGPASSWORD");
  const pgDatabase = Deno.env.get("PGDATABASE");
  const pgPort = Deno.env.get("PGPORT");

  // Prefer individual PG* variables if PGHOST is set
  if (pgHost) {
    if (!pgUser || !pgDatabase) {
      throw new Error(
        "When using PGHOST, PGUSER and PGDATABASE are also required"
      );
    }
    return {
      hostname: pgHost,
      port: pgPort ? parseInt(pgPort, 10) : 5432,
      user: pgUser,
      password: pgPassword || "",
      database: pgDatabase,
    };
  }

  // Fall back to DATABASE_URL
  const databaseUrl = Deno.env.get("DATABASE_URL");
  if (!databaseUrl) {
    throw new Error(
      "Database configuration required: set PGHOST/PGUSER/PGDATABASE or DATABASE_URL"
    );
  }
  return databaseUrl;
}

function getPool(): Pool {
  if (!pool) {
    const config = getConnectionConfig();
    pool = new Pool(config, 10);
  }
  return pool;
}

async function query<T>(sql: string, args: unknown[] = []): Promise<T[]> {
  const pool = getPool();
  const client = await pool.connect();
  try {
    const result = await client.queryObject<T>(sql, args);
    return result.rows;
  } finally {
    client.release();
  }
}

async function queryOne<T>(sql: string, args: unknown[] = []): Promise<T | null> {
  const rows = await query<T>(sql, args);
  return rows[0] || null;
}

// ============ USER FUNCTIONS ============

export async function createUser(
  email: string,
  passwordHash: string,
  displayName?: string
): Promise<User> {
  const row = await queryOne<{
    id: string;
    email: string;
    display_name: string | null;
    created_at: Date;
    updated_at: Date;
  }>(
    `INSERT INTO users (email, password_hash, display_name)
     VALUES ($1, $2, $3)
     RETURNING id, email, display_name, created_at, updated_at`,
    [email, passwordHash, displayName || null]
  );

  if (!row) throw new Error("Failed to create user");

  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getUserByEmail(email: string): Promise<UserWithPassword | null> {
  const row = await queryOne<{
    id: string;
    email: string;
    password_hash: string;
    display_name: string | null;
    created_at: Date;
    updated_at: Date;
  }>(
    `SELECT id, email, password_hash, display_name, created_at, updated_at
     FROM users WHERE email = $1`,
    [email]
  );

  if (!row) return null;

  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    displayName: row.display_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getUserById(id: string): Promise<User | null> {
  const row = await queryOne<{
    id: string;
    email: string;
    display_name: string | null;
    created_at: Date;
    updated_at: Date;
  }>(
    `SELECT id, email, display_name, created_at, updated_at
     FROM users WHERE id = $1`,
    [id]
  );

  if (!row) return null;

  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ============ REFRESH TOKEN FUNCTIONS ============

export async function createRefreshToken(
  userId: string,
  tokenHash: string,
  expiresAt: Date
): Promise<string> {
  const row = await queryOne<{ id: string }>(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)
     RETURNING id`,
    [userId, tokenHash, expiresAt]
  );

  if (!row) throw new Error("Failed to create refresh token");
  return row.id;
}

export async function getRefreshToken(
  tokenHash: string
): Promise<{ userId: string; expiresAt: Date; revokedAt: Date | null } | null> {
  const row = await queryOne<{
    user_id: string;
    expires_at: Date;
    revoked_at: Date | null;
  }>(
    `SELECT user_id, expires_at, revoked_at
     FROM refresh_tokens WHERE token_hash = $1`,
    [tokenHash]
  );

  if (!row) return null;

  return {
    userId: row.user_id,
    expiresAt: row.expires_at,
    revokedAt: row.revoked_at,
  };
}

export async function revokeRefreshToken(tokenHash: string): Promise<void> {
  await query(
    `UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = $1`,
    [tokenHash]
  );
}

export async function revokeAllUserTokens(userId: string): Promise<void> {
  await query(
    `UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL`,
    [userId]
  );
}

// ============ NUTRITION RECORD FUNCTIONS ============

function mapNutritionRecord(row: {
  id: string;
  user_id: string;
  name: string;
  serving_size_value: number;
  serving_size_unit: string;
  calories: number;
  total_fat: number | null;
  carbohydrates: number | null;
  fiber: number | null;
  sugars: number | null;
  protein: number | null;
  cholesterol: number | null;
  sodium: number | null;
  upc_code: string | null;
  source: string;
  created_at: Date;
}): NutritionRecord {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    servingSizeValue: row.serving_size_value,
    servingSizeUnit: row.serving_size_unit as "g" | "ml",
    calories: row.calories,
    totalFat: row.total_fat,
    carbohydrates: row.carbohydrates,
    fiber: row.fiber,
    sugars: row.sugars,
    protein: row.protein,
    cholesterol: row.cholesterol,
    sodium: row.sodium,
    upcCode: row.upc_code,
    source: row.source as "manual" | "scan" | "api",
    createdAt: row.created_at,
  };
}

export async function createNutritionRecord(
  userId: string,
  input: CreateNutritionRecordInput
): Promise<NutritionRecord> {
  const row = await queryOne<{
    id: string;
    user_id: string;
    name: string;
    serving_size_value: number;
    serving_size_unit: string;
    calories: number;
    total_fat: number | null;
    carbohydrates: number | null;
    fiber: number | null;
    sugars: number | null;
    protein: number | null;
    cholesterol: number | null;
    sodium: number | null;
    upc_code: string | null;
    source: string;
    created_at: Date;
  }>(
    `INSERT INTO nutrition_records (
       user_id, name, serving_size_value, serving_size_unit, calories,
       total_fat, carbohydrates, fiber, sugars, protein, cholesterol, sodium,
       upc_code, source
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
     RETURNING *`,
    [
      userId,
      input.name,
      input.servingSizeValue,
      input.servingSizeUnit,
      input.calories,
      input.totalFat ?? null,
      input.carbohydrates ?? null,
      input.fiber ?? null,
      input.sugars ?? null,
      input.protein ?? null,
      input.cholesterol ?? null,
      input.sodium ?? null,
      input.upcCode ?? null,
      input.source ?? "manual",
    ]
  );

  if (!row) throw new Error("Failed to create nutrition record");
  return mapNutritionRecord(row);
}

export async function getUserFoods(userId: string): Promise<NutritionRecord[]> {
  const rows = await query<{
    id: string;
    user_id: string;
    name: string;
    serving_size_value: number;
    serving_size_unit: string;
    calories: number;
    total_fat: number | null;
    carbohydrates: number | null;
    fiber: number | null;
    sugars: number | null;
    protein: number | null;
    cholesterol: number | null;
    sodium: number | null;
    upc_code: string | null;
    source: string;
    created_at: Date;
  }>(
    `SELECT * FROM nutrition_records WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId]
  );

  return rows.map(mapNutritionRecord);
}

export async function getFoodById(
  id: string,
  userId: string
): Promise<NutritionRecord | null> {
  const row = await queryOne<{
    id: string;
    user_id: string;
    name: string;
    serving_size_value: number;
    serving_size_unit: string;
    calories: number;
    total_fat: number | null;
    carbohydrates: number | null;
    fiber: number | null;
    sugars: number | null;
    protein: number | null;
    cholesterol: number | null;
    sodium: number | null;
    upc_code: string | null;
    source: string;
    created_at: Date;
  }>(
    `SELECT * FROM nutrition_records WHERE id = $1 AND user_id = $2`,
    [id, userId]
  );

  if (!row) return null;
  return mapNutritionRecord(row);
}

export async function getFoodByUpc(
  upcCode: string,
  userId: string
): Promise<NutritionRecord | null> {
  const row = await queryOne<{
    id: string;
    user_id: string;
    name: string;
    serving_size_value: number;
    serving_size_unit: string;
    calories: number;
    total_fat: number | null;
    carbohydrates: number | null;
    fiber: number | null;
    sugars: number | null;
    protein: number | null;
    cholesterol: number | null;
    sodium: number | null;
    upc_code: string | null;
    source: string;
    created_at: Date;
  }>(
    `SELECT * FROM nutrition_records WHERE upc_code = $1 AND user_id = $2`,
    [upcCode, userId]
  );

  if (!row) return null;
  return mapNutritionRecord(row);
}

export async function updateNutritionRecord(
  id: string,
  userId: string,
  input: Partial<CreateNutritionRecordInput>
): Promise<NutritionRecord | null> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (input.name !== undefined) {
    fields.push(`name = $${paramIndex++}`);
    values.push(input.name);
  }
  if (input.servingSizeValue !== undefined) {
    fields.push(`serving_size_value = $${paramIndex++}`);
    values.push(input.servingSizeValue);
  }
  if (input.servingSizeUnit !== undefined) {
    fields.push(`serving_size_unit = $${paramIndex++}`);
    values.push(input.servingSizeUnit);
  }
  if (input.calories !== undefined) {
    fields.push(`calories = $${paramIndex++}`);
    values.push(input.calories);
  }
  if (input.totalFat !== undefined) {
    fields.push(`total_fat = $${paramIndex++}`);
    values.push(input.totalFat);
  }
  if (input.carbohydrates !== undefined) {
    fields.push(`carbohydrates = $${paramIndex++}`);
    values.push(input.carbohydrates);
  }
  if (input.fiber !== undefined) {
    fields.push(`fiber = $${paramIndex++}`);
    values.push(input.fiber);
  }
  if (input.sugars !== undefined) {
    fields.push(`sugars = $${paramIndex++}`);
    values.push(input.sugars);
  }
  if (input.protein !== undefined) {
    fields.push(`protein = $${paramIndex++}`);
    values.push(input.protein);
  }
  if (input.cholesterol !== undefined) {
    fields.push(`cholesterol = $${paramIndex++}`);
    values.push(input.cholesterol);
  }
  if (input.sodium !== undefined) {
    fields.push(`sodium = $${paramIndex++}`);
    values.push(input.sodium);
  }
  if (input.upcCode !== undefined) {
    fields.push(`upc_code = $${paramIndex++}`);
    values.push(input.upcCode);
  }

  if (fields.length === 0) {
    return getFoodById(id, userId);
  }

  values.push(id, userId);

  const row = await queryOne<{
    id: string;
    user_id: string;
    name: string;
    serving_size_value: number;
    serving_size_unit: string;
    calories: number;
    total_fat: number | null;
    carbohydrates: number | null;
    fiber: number | null;
    sugars: number | null;
    protein: number | null;
    cholesterol: number | null;
    sodium: number | null;
    upc_code: string | null;
    source: string;
    created_at: Date;
  }>(
    `UPDATE nutrition_records SET ${fields.join(", ")}
     WHERE id = $${paramIndex++} AND user_id = $${paramIndex}
     RETURNING *`,
    values
  );

  if (!row) return null;
  return mapNutritionRecord(row);
}

export async function deleteNutritionRecord(
  id: string,
  userId: string
): Promise<boolean> {
  const result = await query(
    `DELETE FROM nutrition_records WHERE id = $1 AND user_id = $2`,
    [id, userId]
  );
  return true;
}

// ============ FOOD LOG FUNCTIONS ============

export async function createFoodLogEntry(
  userId: string,
  input: CreateFoodLogInput
): Promise<FoodLogEntry> {
  const row = await queryOne<{
    id: string;
    user_id: string;
    nutrition_record_id: string;
    servings: number;
    logged_date: string;
    meal_type: string;
    created_at: Date;
  }>(
    `INSERT INTO food_log (user_id, nutrition_record_id, servings, logged_date, meal_type)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [
      userId,
      input.nutritionRecordId,
      input.servings ?? 1.0,
      input.loggedDate ?? new Date().toISOString().split("T")[0],
      input.mealType ?? "snack",
    ]
  );

  if (!row) throw new Error("Failed to create food log entry");

  return {
    id: row.id,
    userId: row.user_id,
    nutritionRecordId: row.nutrition_record_id,
    servings: row.servings,
    loggedDate: row.logged_date,
    mealType: row.meal_type as MealType,
    createdAt: row.created_at,
  };
}

export async function getFoodLogEntry(
  id: string,
  userId: string
): Promise<FoodLogEntry | null> {
  const row = await queryOne<{
    id: string;
    user_id: string;
    nutrition_record_id: string;
    servings: number;
    logged_date: string;
    meal_type: string;
    created_at: Date;
  }>(
    `SELECT * FROM food_log WHERE id = $1 AND user_id = $2`,
    [id, userId]
  );

  if (!row) return null;

  return {
    id: row.id,
    userId: row.user_id,
    nutritionRecordId: row.nutrition_record_id,
    servings: row.servings,
    loggedDate: row.logged_date,
    mealType: row.meal_type as MealType,
    createdAt: row.created_at,
  };
}

export async function updateFoodLogEntry(
  id: string,
  userId: string,
  servings?: number,
  mealType?: MealType
): Promise<FoodLogEntry | null> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (servings !== undefined) {
    fields.push(`servings = $${paramIndex++}`);
    values.push(servings);
  }
  if (mealType !== undefined) {
    fields.push(`meal_type = $${paramIndex++}`);
    values.push(mealType);
  }

  if (fields.length === 0) {
    return getFoodLogEntry(id, userId);
  }

  values.push(id, userId);

  const row = await queryOne<{
    id: string;
    user_id: string;
    nutrition_record_id: string;
    servings: number;
    logged_date: string;
    meal_type: string;
    created_at: Date;
  }>(
    `UPDATE food_log SET ${fields.join(", ")}
     WHERE id = $${paramIndex++} AND user_id = $${paramIndex}
     RETURNING *`,
    values
  );

  if (!row) return null;

  return {
    id: row.id,
    userId: row.user_id,
    nutritionRecordId: row.nutrition_record_id,
    servings: row.servings,
    loggedDate: row.logged_date,
    mealType: row.meal_type as MealType,
    createdAt: row.created_at,
  };
}

export async function deleteFoodLogEntry(
  id: string,
  userId: string
): Promise<boolean> {
  await query(
    `DELETE FROM food_log WHERE id = $1 AND user_id = $2`,
    [id, userId]
  );
  return true;
}

export async function getDailySummary(
  userId: string,
  date: string
): Promise<DailySummary | null> {
  // Get all log entries with nutrition data for the day
  const rows = await query<{
    id: string;
    user_id: string;
    nutrition_record_id: string;
    servings: number;
    logged_date: string;
    meal_type: string;
    created_at: Date;
    food_id: string;
    food_user_id: string;
    food_name: string;
    serving_size_value: number;
    serving_size_unit: string;
    calories: number;
    total_fat: number | null;
    carbohydrates: number | null;
    fiber: number | null;
    sugars: number | null;
    protein: number | null;
    cholesterol: number | null;
    sodium: number | null;
    upc_code: string | null;
    source: string;
    food_created_at: Date;
  }>(
    `SELECT
       fl.*,
       nr.id as food_id,
       nr.user_id as food_user_id,
       nr.name as food_name,
       nr.serving_size_value,
       nr.serving_size_unit,
       nr.calories,
       nr.total_fat,
       nr.carbohydrates,
       nr.fiber,
       nr.sugars,
       nr.protein,
       nr.cholesterol,
       nr.sodium,
       nr.upc_code,
       nr.source,
       nr.created_at as food_created_at
     FROM food_log fl
     JOIN nutrition_records nr ON fl.nutrition_record_id = nr.id
     WHERE fl.user_id = $1 AND fl.logged_date = $2
     ORDER BY fl.created_at`,
    [userId, date]
  );

  const entries: FoodLogEntryWithNutrition[] = rows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    nutritionRecordId: row.nutrition_record_id,
    servings: row.servings,
    loggedDate: row.logged_date,
    mealType: row.meal_type as MealType,
    createdAt: row.created_at,
    nutritionRecord: {
      id: row.food_id,
      userId: row.food_user_id,
      name: row.food_name,
      servingSizeValue: row.serving_size_value,
      servingSizeUnit: row.serving_size_unit as "g" | "ml",
      calories: row.calories,
      totalFat: row.total_fat,
      carbohydrates: row.carbohydrates,
      fiber: row.fiber,
      sugars: row.sugars,
      protein: row.protein,
      cholesterol: row.cholesterol,
      sodium: row.sodium,
      upcCode: row.upc_code,
      source: row.source as "manual" | "scan" | "api",
      createdAt: row.food_created_at,
    },
  }));

  // Calculate totals
  let totalCalories = 0;
  let totalFat = 0;
  let totalCarbohydrates = 0;
  let totalProtein = 0;
  let totalFiber = 0;
  let totalSugars = 0;
  let totalSodium = 0;
  let totalCholesterol = 0;

  for (const entry of entries) {
    const servings = entry.servings;
    const nr = entry.nutritionRecord;
    totalCalories += nr.calories * servings;
    totalFat += (nr.totalFat || 0) * servings;
    totalCarbohydrates += (nr.carbohydrates || 0) * servings;
    totalProtein += (nr.protein || 0) * servings;
    totalFiber += (nr.fiber || 0) * servings;
    totalSugars += (nr.sugars || 0) * servings;
    totalSodium += (nr.sodium || 0) * servings;
    totalCholesterol += (nr.cholesterol || 0) * servings;
  }

  return {
    date,
    totalCalories,
    totalFat,
    totalCarbohydrates,
    totalProtein,
    totalFiber,
    totalSugars,
    totalSodium,
    totalCholesterol,
    entries,
  };
}
