import { Handlers } from "$fresh/server.ts";
import { getCookie, verifyAccessToken } from "../../../utils/auth.ts";
import { getDailySummary } from "../../../utils/db.ts";

export const handler: Handlers = {
  // GET /api/log/daily?date=YYYY-MM-DD - Get daily summary
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
      const date = url.searchParams.get("date");

      if (!date) {
        return new Response(
          JSON.stringify({ error: "date query parameter is required (YYYY-MM-DD)" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      // Validate date format
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return new Response(
          JSON.stringify({ error: "Invalid date format. Use YYYY-MM-DD" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      const summary = await getDailySummary(payload.userId, date);

      return new Response(JSON.stringify(summary), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Get daily summary error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to get daily summary" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  },
};
