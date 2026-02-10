import { Handlers } from "$fresh/server.ts";
import { getCookie, verifyAccessToken } from "../../../../utils/auth.ts";
import { getFoodByUpc } from "../../../../utils/db.ts";

export const handler: Handlers = {
  // GET /api/foods/upc/:code - Find food by UPC code
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
      const { code } = ctx.params;
      const food = await getFoodByUpc(code, payload.userId);

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
      console.error("Get food by UPC error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to find food" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  },
};
