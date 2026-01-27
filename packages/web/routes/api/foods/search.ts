import { Handlers } from "$fresh/server.ts";
import { getCookie, verifyAccessToken } from "../../../utils/auth.ts";
import { searchFoods, countFoods, getUserFoods } from "../../../utils/db.ts";

export const handler: Handlers = {
  // GET /api/foods/search?q=chicken&source=all&limit=20
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
      const url = new URL(req.url);
      const q = url.searchParams.get("q")?.trim() || "";
      const source = (url.searchParams.get("source") || "all") as "all" | "user" | "system";
      const limit = Math.min(Math.max(parseInt(url.searchParams.get("limit") || "20"), 1), 50);

      // Validate source parameter
      if (!["all", "user", "system"].includes(source)) {
        return new Response(
          JSON.stringify({ error: "source must be 'all', 'user', or 'system'" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      let results;

      if (q.length < 2) {
        // When query is empty or too short: show recent user foods for "all"/"user", nothing for "system"
        if (source === "system") {
          results = [];
        } else {
          // Return recent user foods with isSystem: false
          const userFoods = await getUserFoods(payload.userId);
          results = userFoods.slice(0, limit).map((f) => ({ ...f, isSystem: false }));
        }
      } else {
        results = await searchFoods(payload.userId, q, source, limit);
      }

      // Get counts for tab badges
      const [userCount, systemCount] = await Promise.all([
        countFoods(payload.userId, "user"),
        countFoods(payload.userId, "system"),
      ]);

      return new Response(
        JSON.stringify({ results, counts: { user: userCount, system: systemCount } }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } catch (error) {
      console.error("Search foods error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to search foods" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  },
};
