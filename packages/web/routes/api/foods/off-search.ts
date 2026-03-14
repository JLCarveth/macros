import { Handlers } from "$fresh/server.ts";
import { getAuthPayload } from "../../../utils/auth.ts";
import { searchOffProducts } from "../../../utils/openfoodfacts.ts";

export const handler: Handlers = {
  // GET /api/foods/off-search?q=oreos&limit=20
  async GET(req) {
    const auth = await getAuthPayload(req);
    if (auth instanceof Response) return auth;

    const url = new URL(req.url);
    const q = url.searchParams.get("q")?.trim() || "";
    const limit = Math.min(Math.max(parseInt(url.searchParams.get("limit") || "20"), 1), 50);

    if (q.length < 2) {
      return new Response(
        JSON.stringify({ results: [] }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    // Returns [] on rate limit — UI degrades gracefully
    const results = await searchOffProducts(q, limit);

    return new Response(
      JSON.stringify({ results }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  },
};
