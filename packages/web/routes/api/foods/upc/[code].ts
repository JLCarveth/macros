import { Handlers } from "$fresh/server.ts";
import { getAuthPayload } from "../../../../utils/auth.ts";
import { getFoodByUpc, getCommunityFoodByUpc } from "../../../../utils/db.ts";
import { lookupOffProduct } from "../../../../utils/openfoodfacts.ts";

export const handler: Handlers = {
  // GET /api/foods/upc/:code - Find food by UPC code (cascade: user -> community -> OFF)
  async GET(req, ctx) {
    const auth = await getAuthPayload(req);
    if (auth instanceof Response) return auth;

    try {
      const { code } = ctx.params;

      // 1. Check user's own foods first
      const userFood = await getFoodByUpc(code, auth.userId);
      if (userFood) {
        return new Response(
          JSON.stringify({ ...userFood, lookupSource: "user" }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      // 2. Check community foods
      const communityFood = await getCommunityFoodByUpc(code);
      if (communityFood) {
        return new Response(
          JSON.stringify({ ...communityFood, lookupSource: "community" }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      // 3. Check Open Food Facts
      try {
        const offResult = await lookupOffProduct(code);
        if (offResult) {
          return new Response(
            JSON.stringify({
              ...offResult.food,
              lookupSource: "openfoodfacts",
              offProductUrl: offResult.productUrl,
              offImageUrl: offResult.imageUrl,
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        }
      } catch (offError) {
        console.error("Open Food Facts lookup failed:", offError);
        // Don't fail the request — just fall through to not found
      }

      return new Response(
        JSON.stringify({ error: "Food not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    } catch (error) {
      console.error("Get food by UPC error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to find food" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  },
};
