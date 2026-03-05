import { Handlers } from "$fresh/server.ts";
import { getCookie, verifyAccessToken } from "../../../utils/auth.ts";
import { createRecipe, getUserRecipes } from "../../../utils/db.ts";
import type { CreateRecipeInput } from "@nutrition-llama/shared";

export const handler: Handlers = {
  async GET(req) {
    const accessToken = getCookie(req, "access_token");
    if (!accessToken) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const payload = await verifyAccessToken(accessToken);
    if (!payload) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    try {
      const recipes = await getUserRecipes(payload.userId);
      return new Response(JSON.stringify(recipes), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Get recipes error:", error);
      return new Response(JSON.stringify({ error: "Failed to get recipes" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },

  async POST(req) {
    const accessToken = getCookie(req, "access_token");
    if (!accessToken) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const payload = await verifyAccessToken(accessToken);
    if (!payload) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    try {
      const body = await req.json();

      if (!body.name || typeof body.name !== "string" || !body.name.trim()) {
        return new Response(JSON.stringify({ error: "name is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (!body.servings || typeof body.servings !== "number" || body.servings <= 0) {
        return new Response(JSON.stringify({ error: "servings must be a positive number" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (!Array.isArray(body.ingredients) || body.ingredients.length === 0) {
        return new Response(
          JSON.stringify({ error: "ingredients must be a non-empty array" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      for (const ing of body.ingredients) {
        if (!ing.nutritionRecordId || typeof ing.nutritionRecordId !== "string") {
          return new Response(
            JSON.stringify({ error: "each ingredient must have nutritionRecordId" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }
        if (!ing.amountServings || typeof ing.amountServings !== "number" || ing.amountServings <= 0) {
          return new Response(
            JSON.stringify({ error: "each ingredient must have amountServings > 0" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }
      }

      const input: CreateRecipeInput = {
        name: body.name.trim(),
        description: body.description ?? undefined,
        servings: body.servings,
        ingredients: body.ingredients,
      };

      const recipe = await createRecipe(payload.userId, input);
      return new Response(JSON.stringify(recipe), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Create recipe error:", error);
      return new Response(JSON.stringify({ error: "Failed to create recipe" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
};
