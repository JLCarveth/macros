import { Handlers } from "$fresh/server.ts";
import { getCookie, verifyAccessToken } from "../../../utils/auth.ts";
import { createFoodLogEntry } from "../../../utils/db.ts";
import type { CreateFoodLogInput } from "@nutrition-llama/shared";

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

      // Validate required fields
      if (!body.nutritionRecordId) {
        return new Response(
          JSON.stringify({ error: "nutritionRecordId is required" }),
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

      const input: CreateFoodLogInput = {
        nutritionRecordId: body.nutritionRecordId,
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
