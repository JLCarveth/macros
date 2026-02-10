/**
 * Database utility functions using PostgreSQL
 */

import postgres from "npm:postgres";
import type {
  User,
  UserWithPassword,
  NutritionRecord,
  NutritionRecordWithSource,
  CreateNutritionRecordInput,
  FoodLogEntry,
  FoodLogEntryWithNutrition,
  CreateFoodLogInput,
  DailySummary,
  MealType,
} from "@nutrition-llama/shared";

// Create connection with built-in pooling
const sql = postgres({
  hostname: Deno.env.get("PGHOST") || "localhost",
  port: Number(Deno.env.get("PGPORT")) || 5432,
  user: Deno.env.get("PGUSER"),
  password: Deno.env.get("PGPASSWORD"),
  database: Deno.env.get("PGDATABASE"),
  max: 10,
});

// ============ USER FUNCTIONS ============

export async function createUser(
  email: string,
  passwordHash: string,
  displayName?: string
): Promise<User> {
  const [row] = await sql`
    INSERT INTO users (email, password_hash, display_name)
    VALUES (${email}, ${passwordHash}, ${displayName || null})
    RETURNING id, email, display_name, created_at, updated_at
  `;

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
  const [row] = await sql`
    SELECT id, email, password_hash, display_name, created_at, updated_at
    FROM users WHERE email = ${email}
  `;

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
  const [row] = await sql`
    SELECT id, email, display_name, created_at, updated_at
    FROM users WHERE id = ${id}
  `;

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
  const [row] = await sql`
    INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
    VALUES (${userId}, ${tokenHash}, ${expiresAt})
    RETURNING id
  `;

  if (!row) throw new Error("Failed to create refresh token");
  return row.id;
}

export async function getRefreshToken(
  tokenHash: string
): Promise<{ userId: string; expiresAt: Date; revokedAt: Date | null } | null> {
  const [row] = await sql`
    SELECT user_id, expires_at, revoked_at
    FROM refresh_tokens WHERE token_hash = ${tokenHash}
  `;

  if (!row) return null;

  return {
    userId: row.user_id,
    expiresAt: row.expires_at,
    revokedAt: row.revoked_at,
  };
}

export async function revokeRefreshToken(tokenHash: string): Promise<void> {
  await sql`
    UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = ${tokenHash}
  `;
}

export async function revokeAllUserTokens(userId: string): Promise<void> {
  await sql`
    UPDATE refresh_tokens SET revoked_at = NOW()
    WHERE user_id = ${userId} AND revoked_at IS NULL
  `;
}

// ============ NUTRITION RECORD FUNCTIONS ============

function mapNutritionRecord(row: Record<string, unknown>): NutritionRecord {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    name: row.name as string,
    servingSizeValue: row.serving_size_value as number,
    servingSizeUnit: row.serving_size_unit as "g" | "ml",
    calories: row.calories as number,
    totalFat: row.total_fat as number | null,
    carbohydrates: row.carbohydrates as number | null,
    fiber: row.fiber as number | null,
    sugars: row.sugars as number | null,
    protein: row.protein as number | null,
    cholesterol: row.cholesterol as number | null,
    sodium: row.sodium as number | null,
    upcCode: row.upc_code as string | null,
    source: row.source as "manual" | "scan" | "api",
    createdAt: row.created_at as Date,
  };
}

export async function createNutritionRecord(
  userId: string,
  input: CreateNutritionRecordInput
): Promise<NutritionRecord> {
  const [row] = await sql`
    INSERT INTO nutrition_records (
      user_id, name, serving_size_value, serving_size_unit, calories,
      total_fat, carbohydrates, fiber, sugars, protein, cholesterol, sodium,
      upc_code, source
    )
    VALUES (
      ${userId}, ${input.name}, ${input.servingSizeValue}, ${input.servingSizeUnit},
      ${input.calories}, ${input.totalFat ?? null}, ${input.carbohydrates ?? null},
      ${input.fiber ?? null}, ${input.sugars ?? null}, ${input.protein ?? null},
      ${input.cholesterol ?? null}, ${input.sodium ?? null},
      ${input.upcCode ?? null}, ${input.source ?? "manual"}
    )
    RETURNING *
  `;

  if (!row) throw new Error("Failed to create nutrition record");
  return mapNutritionRecord(row);
}

export async function getUserFoods(userId: string): Promise<NutritionRecord[]> {
  const rows = await sql`
    SELECT * FROM nutrition_records WHERE user_id = ${userId} ORDER BY created_at DESC
  `;

  return rows.map(mapNutritionRecord);
}

export async function getFoodById(
  id: string,
  userId: string
): Promise<NutritionRecord | null> {
  const [row] = await sql`
    SELECT * FROM nutrition_records WHERE id = ${id} AND user_id = ${userId}
  `;

  if (!row) return null;
  return mapNutritionRecord(row);
}

export async function getFoodByUpc(
  upcCode: string,
  userId: string
): Promise<NutritionRecord | null> {
  const [row] = await sql`
    SELECT * FROM nutrition_records WHERE upc_code = ${upcCode} AND user_id = ${userId}
  `;

  if (!row) return null;
  return mapNutritionRecord(row);
}

export async function updateNutritionRecord(
  id: string,
  userId: string,
  input: Partial<CreateNutritionRecordInput>
): Promise<NutritionRecord | null> {
  // Build update object with only defined fields
  const updates: Record<string, unknown> = {};
  if (input.name !== undefined) updates.name = input.name;
  if (input.servingSizeValue !== undefined) updates.serving_size_value = input.servingSizeValue;
  if (input.servingSizeUnit !== undefined) updates.serving_size_unit = input.servingSizeUnit;
  if (input.calories !== undefined) updates.calories = input.calories;
  if (input.totalFat !== undefined) updates.total_fat = input.totalFat;
  if (input.carbohydrates !== undefined) updates.carbohydrates = input.carbohydrates;
  if (input.fiber !== undefined) updates.fiber = input.fiber;
  if (input.sugars !== undefined) updates.sugars = input.sugars;
  if (input.protein !== undefined) updates.protein = input.protein;
  if (input.cholesterol !== undefined) updates.cholesterol = input.cholesterol;
  if (input.sodium !== undefined) updates.sodium = input.sodium;
  if (input.upcCode !== undefined) updates.upc_code = input.upcCode;

  if (Object.keys(updates).length === 0) {
    return getFoodById(id, userId);
  }

  const [row] = await sql`
    UPDATE nutrition_records SET ${sql(updates)}
    WHERE id = ${id} AND user_id = ${userId}
    RETURNING *
  `;

  if (!row) return null;
  return mapNutritionRecord(row);
}

export async function deleteNutritionRecord(
  id: string,
  userId: string
): Promise<boolean> {
  await sql`
    DELETE FROM nutrition_records WHERE id = ${id} AND user_id = ${userId}
  `;
  return true;
}

// ============ SYSTEM / SEARCH FUNCTIONS ============

let cachedSystemUserId: string | null = null;

export async function getSystemUserId(): Promise<string | null> {
  if (cachedSystemUserId) return cachedSystemUserId;

  const [row] = await sql`
    SELECT id FROM users WHERE email = 'system@nutrition-llama.com'
  `;

  if (row) {
    cachedSystemUserId = row.id as string;
  }

  return cachedSystemUserId;
}

function mapNutritionRecordWithSource(
  row: Record<string, unknown>,
  systemUserId: string | null
): NutritionRecordWithSource {
  return {
    ...mapNutritionRecord(row),
    isSystem: row.user_id === systemUserId,
  };
}

export async function searchFoods(
  userId: string,
  query: string,
  source: "all" | "user" | "system" = "all",
  limit: number = 20
): Promise<NutritionRecordWithSource[]> {
  const systemUserId = await getSystemUserId();
  const pattern = `%${query}%`;

  let rows: Record<string, unknown>[];

  if (source === "user") {
    rows = await sql`
      SELECT * FROM nutrition_records
      WHERE user_id = ${userId} AND name ILIKE ${pattern}
      ORDER BY name ASC
      LIMIT ${limit}
    `;
  } else if (source === "system") {
    if (!systemUserId) return [];
    rows = await sql`
      SELECT * FROM nutrition_records
      WHERE user_id = ${systemUserId} AND name ILIKE ${pattern}
      ORDER BY name ASC
      LIMIT ${limit}
    `;
  } else {
    // "all" - user foods first, then system foods
    if (!systemUserId) {
      rows = await sql`
        SELECT * FROM nutrition_records
        WHERE user_id = ${userId} AND name ILIKE ${pattern}
        ORDER BY name ASC
        LIMIT ${limit}
      `;
    } else {
      rows = await sql`
        (
          SELECT *, 0 as sort_order FROM nutrition_records
          WHERE user_id = ${userId} AND name ILIKE ${pattern}
        )
        UNION ALL
        (
          SELECT *, 1 as sort_order FROM nutrition_records
          WHERE user_id = ${systemUserId} AND name ILIKE ${pattern}
        )
        ORDER BY sort_order ASC, name ASC
        LIMIT ${limit}
      `;
    }
  }

  return rows.map((row) => mapNutritionRecordWithSource(row, systemUserId));
}

export async function getFoodByIdAllowSystem(
  id: string,
  userId: string
): Promise<NutritionRecordWithSource | null> {
  const systemUserId = await getSystemUserId();

  let row: Record<string, unknown> | undefined;

  if (systemUserId) {
    [row] = await sql`
      SELECT * FROM nutrition_records
      WHERE id = ${id} AND (user_id = ${userId} OR user_id = ${systemUserId})
    `;
  } else {
    [row] = await sql`
      SELECT * FROM nutrition_records
      WHERE id = ${id} AND user_id = ${userId}
    `;
  }

  if (!row) return null;
  return mapNutritionRecordWithSource(row, systemUserId);
}

export async function countFoods(
  userId: string,
  source: "user" | "system"
): Promise<number> {
  if (source === "user") {
    const [row] = await sql`
      SELECT COUNT(*)::int as count FROM nutrition_records WHERE user_id = ${userId}
    `;
    return row?.count ?? 0;
  } else {
    const systemUserId = await getSystemUserId();
    if (!systemUserId) return 0;
    const [row] = await sql`
      SELECT COUNT(*)::int as count FROM nutrition_records WHERE user_id = ${systemUserId}
    `;
    return row?.count ?? 0;
  }
}

// ============ FOOD LOG FUNCTIONS ============

export async function createFoodLogEntry(
  userId: string,
  input: CreateFoodLogInput
): Promise<FoodLogEntry> {
  const [row] = await sql`
    INSERT INTO food_log (user_id, nutrition_record_id, servings, logged_date, meal_type)
    VALUES (
      ${userId}, ${input.nutritionRecordId}, ${input.servings ?? 1.0},
      ${input.loggedDate ?? new Date().toISOString().split("T")[0]},
      ${input.mealType ?? "snack"}
    )
    RETURNING *
  `;

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
  const [row] = await sql`
    SELECT * FROM food_log WHERE id = ${id} AND user_id = ${userId}
  `;

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
  const updates: Record<string, unknown> = {};
  if (servings !== undefined) updates.servings = servings;
  if (mealType !== undefined) updates.meal_type = mealType;

  if (Object.keys(updates).length === 0) {
    return getFoodLogEntry(id, userId);
  }

  const [row] = await sql`
    UPDATE food_log SET ${sql(updates)}
    WHERE id = ${id} AND user_id = ${userId}
    RETURNING *
  `;

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
  await sql`
    DELETE FROM food_log WHERE id = ${id} AND user_id = ${userId}
  `;
  return true;
}

export async function getDailySummary(
  userId: string,
  date: string
): Promise<DailySummary | null> {
  const rows = await sql`
    SELECT
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
    WHERE fl.user_id = ${userId} AND fl.logged_date = ${date}
    ORDER BY fl.created_at
  `;

  const entries: FoodLogEntryWithNutrition[] = rows.map((row) => ({
    id: row.id as string,
    userId: row.user_id as string,
    nutritionRecordId: row.nutrition_record_id as string,
    servings: row.servings as number,
    loggedDate: row.logged_date as string,
    mealType: row.meal_type as MealType,
    createdAt: row.created_at as Date,
    nutritionRecord: {
      id: row.food_id as string,
      userId: row.food_user_id as string,
      name: row.food_name as string,
      servingSizeValue: row.serving_size_value as number,
      servingSizeUnit: row.serving_size_unit as "g" | "ml",
      calories: row.calories as number,
      totalFat: row.total_fat as number | null,
      carbohydrates: row.carbohydrates as number | null,
      fiber: row.fiber as number | null,
      sugars: row.sugars as number | null,
      protein: row.protein as number | null,
      cholesterol: row.cholesterol as number | null,
      sodium: row.sodium as number | null,
      upcCode: row.upc_code as string | null,
      source: row.source as "manual" | "scan" | "api",
      createdAt: row.food_created_at as Date,
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
