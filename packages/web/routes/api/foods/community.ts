import { Handlers } from "$fresh/server.ts";
import { getCookie, verifyAccessToken } from "../../../utils/auth.ts";
import { contributeCommunityFood } from "../../../utils/db.ts";

export const handler: Handlers = {
  // POST /api/foods/community - Contribute a food to the community pool
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
      if (!body.name || !body.servingSizeValue || !body.servingSizeUnit || body.calories == null || !body.upcCode) {
        return new Response(
          JSON.stringify({ error: "Missing required fields: name, servingSizeValue, servingSizeUnit, calories, upcCode" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      const input = {
        name: body.name,
        servingSizeValue: Number(body.servingSizeValue),
        servingSizeUnit: body.servingSizeUnit,
        calories: Number(body.calories),
        totalFat: body.totalFat != null ? Number(body.totalFat) : undefined,
        carbohydrates: body.carbohydrates != null ? Number(body.carbohydrates) : undefined,
        fiber: body.fiber != null ? Number(body.fiber) : undefined,
        sugars: body.sugars != null ? Number(body.sugars) : undefined,
        protein: body.protein != null ? Number(body.protein) : undefined,
        cholesterol: body.cholesterol != null ? Number(body.cholesterol) : undefined,
        sodium: body.sodium != null ? Number(body.sodium) : undefined,
        upcCode: body.upcCode,
        source: body.source || "community" as const,
        offProductUrl: body.offProductUrl,
      };

      const { created, food } = await contributeCommunityFood(payload.userId, input);

      return new Response(
        JSON.stringify({ created, food }),
        {
          status: created ? 201 : 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch (error) {
      console.error("Contribute community food error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to contribute food" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  },
};
