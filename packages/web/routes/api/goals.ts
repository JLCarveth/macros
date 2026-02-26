import { Handlers } from "$fresh/server.ts";
import { getCookie, verifyAccessToken } from "../../utils/auth.ts";
import { getUserGoals, upsertUserGoals } from "../../utils/db.ts";

export const handler: Handlers = {
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
      const goals = await getUserGoals(payload.userId);
      return new Response(JSON.stringify(goals), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Get goals error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to get goals" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  },

  async PUT(req) {
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
      const { calories, proteinG, carbsG, fatG, goalWeightKg } = body;

      if (
        typeof calories !== "number" || calories < 0 ||
        typeof proteinG !== "number" || proteinG < 0 ||
        typeof carbsG !== "number" || carbsG < 0 ||
        typeof fatG !== "number" || fatG < 0
      ) {
        return new Response(
          JSON.stringify({ error: "Invalid goal values. All must be non-negative numbers." }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      if (goalWeightKg !== undefined && goalWeightKg !== null && (typeof goalWeightKg !== "number" || goalWeightKg <= 0)) {
        return new Response(
          JSON.stringify({ error: "Invalid goal weight. Must be a positive number." }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      const goals = await upsertUserGoals(payload.userId, {
        calories: Math.round(calories),
        proteinG: Math.round(proteinG),
        carbsG: Math.round(carbsG),
        fatG: Math.round(fatG),
        goalWeightKg: goalWeightKg ?? null,
      });

      return new Response(JSON.stringify(goals), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Upsert goals error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to save goals" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  },
};
