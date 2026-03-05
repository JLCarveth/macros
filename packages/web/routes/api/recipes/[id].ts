import { Handlers } from "$fresh/server.ts";
import { getCookie, verifyAccessToken } from "../../../utils/auth.ts";
import { getRecipeById, updateRecipe, deleteRecipe } from "../../../utils/db.ts";

export const handler: Handlers = {
  async GET(req, ctx) {
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
      const { id } = ctx.params;
      const recipe = await getRecipeById(id, payload.userId);
      if (!recipe) {
        return new Response(JSON.stringify({ error: "Not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify(recipe), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Get recipe error:", error);
      return new Response(JSON.stringify({ error: "Failed to get recipe" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },

  async PUT(req, ctx) {
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
      const { id } = ctx.params;
      const body = await req.json();

      if (body.servings !== undefined && (typeof body.servings !== "number" || body.servings <= 0)) {
        return new Response(JSON.stringify({ error: "servings must be a positive number" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (body.ingredients !== undefined) {
        if (!Array.isArray(body.ingredients) || body.ingredients.length === 0) {
          return new Response(
            JSON.stringify({ error: "ingredients must be a non-empty array" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }
      }

      const recipe = await updateRecipe(id, payload.userId, body);
      if (!recipe) {
        return new Response(JSON.stringify({ error: "Not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify(recipe), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Update recipe error:", error);
      return new Response(JSON.stringify({ error: "Failed to update recipe" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },

  async DELETE(req, ctx) {
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
      const { id } = ctx.params;
      const deleted = await deleteRecipe(id, payload.userId);
      if (!deleted) {
        return new Response(JSON.stringify({ error: "Not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response(null, { status: 204 });
    } catch (error) {
      console.error("Delete recipe error:", error);
      return new Response(JSON.stringify({ error: "Failed to delete recipe" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
};
