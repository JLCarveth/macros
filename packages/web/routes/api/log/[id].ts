import { Handlers } from "$fresh/server.ts";
import { getCookie, verifyAccessToken } from "../../../utils/auth.ts";
import { getFoodLogEntry, updateFoodLogEntry, deleteFoodLogEntry } from "../../../utils/db.ts";

export const handler: Handlers = {
  // GET /api/log/:id - Get a single log entry
  async GET(req, ctx) {
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
      const { id } = ctx.params;
      const entry = await getFoodLogEntry(id, payload.userId);

      if (!entry) {
        return new Response(
          JSON.stringify({ error: "Log entry not found" }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }

      return new Response(JSON.stringify(entry), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Get log entry error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to get log entry" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  },

  // PUT /api/log/:id - Update a log entry
  async PUT(req, ctx) {
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
      const { id } = ctx.params;
      const body = await req.json();

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

      const entry = await updateFoodLogEntry(
        id,
        payload.userId,
        body.servings,
        body.mealType
      );

      if (!entry) {
        return new Response(
          JSON.stringify({ error: "Log entry not found" }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }

      return new Response(JSON.stringify(entry), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Update log entry error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to update log entry" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  },

  // DELETE /api/log/:id - Delete a log entry
  async DELETE(req, ctx) {
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
      const { id } = ctx.params;
      await deleteFoodLogEntry(id, payload.userId);

      return new Response(null, { status: 204 });
    } catch (error) {
      console.error("Delete log entry error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to delete log entry" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  },
};
