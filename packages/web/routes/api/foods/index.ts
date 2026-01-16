import { Handlers } from "$fresh/server.ts";
import { getCookie, verifyAccessToken } from "../../../utils/auth.ts";
import { getUserFoods, createNutritionRecord } from "../../../utils/db.ts";
import type { CreateNutritionRecordInput } from "@nutrition-llama/shared";

export const handler: Handlers = {
  // GET /api/foods - List all user's foods
  async GET(req) {
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
      const foods = await getUserFoods(payload.userId);
      return new Response(JSON.stringify(foods), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Get foods error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to get foods" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  },

  // POST /api/foods - Create a new food
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

      // Validate required fields
      if (!body.name || !body.servingSizeValue || !body.servingSizeUnit || body.calories === undefined) {
        return new Response(
          JSON.stringify({ error: "Missing required fields: name, servingSizeValue, servingSizeUnit, calories" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      // Validate serving size unit
      if (!["g", "ml"].includes(body.servingSizeUnit)) {
        return new Response(
          JSON.stringify({ error: "servingSizeUnit must be 'g' or 'ml'" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      const input: CreateNutritionRecordInput = {
        name: body.name,
        servingSizeValue: Number(body.servingSizeValue),
        servingSizeUnit: body.servingSizeUnit,
        calories: Number(body.calories),
        totalFat: body.totalFat !== undefined ? Number(body.totalFat) : undefined,
        carbohydrates: body.carbohydrates !== undefined ? Number(body.carbohydrates) : undefined,
        fiber: body.fiber !== undefined ? Number(body.fiber) : undefined,
        sugars: body.sugars !== undefined ? Number(body.sugars) : undefined,
        protein: body.protein !== undefined ? Number(body.protein) : undefined,
        cholesterol: body.cholesterol !== undefined ? Number(body.cholesterol) : undefined,
        sodium: body.sodium !== undefined ? Number(body.sodium) : undefined,
        upcCode: body.upcCode || undefined,
        source: body.source || "manual",
      };

      const food = await createNutritionRecord(payload.userId, input);

      return new Response(JSON.stringify(food), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Create food error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to create food" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  },
};
