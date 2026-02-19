import { Handlers } from "$fresh/server.ts";
import { getCookie, verifyAccessToken } from "../../utils/auth.ts";
import { getCalorieTrend, getLoggingStreak } from "../../utils/db.ts";

export const handler: Handlers = {
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
      const period = url.searchParams.get("period") || "week";

      const now = new Date();
      const endDate = now.toISOString().split("T")[0];
      let daysBack: number;

      switch (period) {
        case "month":
          daysBack = 30;
          break;
        case "3month":
          daysBack = 90;
          break;
        default:
          daysBack = 7;
      }

      const startDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];

      const [calorieTrend, streak] = await Promise.all([
        getCalorieTrend(payload.userId, startDate, endDate),
        getLoggingStreak(payload.userId),
      ]);

      return new Response(
        JSON.stringify({
          calorieTrend,
          currentStreak: streak.currentStreak,
          longestStreak: streak.longestStreak,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } catch (error) {
      console.error("Get trends error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to get trends data" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  },
};
