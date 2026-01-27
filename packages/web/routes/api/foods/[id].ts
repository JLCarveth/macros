import { Handlers } from "$fresh/server.ts";
import { getCookie, verifyAccessToken } from "../../../utils/auth.ts";
import { getFoodById, getFoodByIdAllowSystem, updateNutritionRecord, deleteNutritionRecord } from "../../../utils/db.ts";

export const handler: Handlers = {
  // GET /api/foods/:id - Get a single food
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
      const food = await getFoodByIdAllowSystem(id, payload.userId);

      if (!food) {
        return new Response(
          JSON.stringify({ error: "Food not found" }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }

      return new Response(JSON.stringify(food), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Get food error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to get food" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  },

  // PUT /api/foods/:id - Update a food
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

      const food = await updateNutritionRecord(id, payload.userId, body);

      if (!food) {
        return new Response(
          JSON.stringify({ error: "Food not found" }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }

      return new Response(JSON.stringify(food), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Update food error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to update food" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  },

  // DELETE /api/foods/:id - Delete a food
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
      await deleteNutritionRecord(id, payload.userId);

      return new Response(null, { status: 204 });
    } catch (error) {
      console.error("Delete food error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to delete food" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  },
};
