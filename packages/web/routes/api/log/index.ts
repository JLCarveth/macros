import { Handlers } from "$fresh/server.ts";
import { getCookie, verifyAccessToken } from "../../../utils/auth.ts";
import { createFoodLogEntry, createNutritionRecord } from "../../../utils/db.ts";
import type { CreateFoodLogInput, CreateNutritionRecordInput } from "@nutrition-llama/shared";

// Calculate calories from macros: protein=4cal/g, carbs=4cal/g, fat=9cal/g
function calculateCaloriesFromMacros(protein: number, carbs: number, fat: number): number {
  return Math.round(protein * 4 + carbs * 4 + fat * 9);
}

export const handler: Handlers = {
  // POST /api/log - Create a new food log entry
  async POST(req) {
    const accessToken = getCookie(req, "access_token");
    if (!accessToken) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const payload = await verifyAccessToken(accessToken);
    if (!payload) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    try {
      const body = await req.json();

      // Validate that either nutritionRecordId or quickMacros is provided
      const hasNutritionRecordId = !!body.nutritionRecordId;
      const hasQuickMacros = body.quickMacros &&
        typeof body.quickMacros.protein === "number" &&
        typeof body.quickMacros.carbs === "number" &&
        typeof body.quickMacros.fat === "number";

      if (!hasNutritionRecordId && !hasQuickMacros) {
        return new Response(
          JSON.stringify({ error: "Either nutritionRecordId or quickMacros (protein, carbs, fat) is required" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      // Validate meal type if provided
      if (body.mealType && !["breakfast", "lunch", "dinner", "snack"].includes(body.mealType)) {
        return new Response(
          JSON.stringify({ error: "mealType must be breakfast, lunch, dinner, or snack" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      // Validate servings if provided
      if (body.servings !== undefined && (isNaN(body.servings) || body.servings <= 0)) {
        return new Response(
          JSON.stringify({ error: "servings must be a positive number" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      let nutritionRecordId = body.nutritionRecordId;

      // If quick macros provided, create a nutrition record first
      if (hasQuickMacros) {
        const { protein, carbs, fat, name } = body.quickMacros;

        // Validate macro values are non-negative
        if (protein < 0 || carbs < 0 || fat < 0) {
          return new Response(
            JSON.stringify({ error: "Macro values must be non-negative" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }

        const calories = calculateCaloriesFromMacros(protein, carbs, fat);

        const nutritionInput: CreateNutritionRecordInput = {
          name: name || "Quick Entry",
          servingSizeValue: 1,
          servingSizeUnit: "g",
          calories,
          protein,
          carbohydrates: carbs,
          totalFat: fat,
          source: "manual",
        };

        const nutritionRecord = await createNutritionRecord(payload.userId, nutritionInput);
        nutritionRecordId = nutritionRecord.id;
      }

      const input: CreateFoodLogInput = {
        nutritionRecordId,
        servings: body.servings,
        loggedDate: body.loggedDate,
        mealType: body.mealType,
      };

      const entry = await createFoodLogEntry(payload.userId, input);

      return new Response(JSON.stringify(entry), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Create log entry error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to create log entry" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  },
};
