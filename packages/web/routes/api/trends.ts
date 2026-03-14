import { Handlers } from "$fresh/server.ts";
import { getAuthPayload } from "../../utils/auth.ts";
import { getCalorieTrend, getLoggingStreak } from "../../utils/db.ts";

export const handler: Handlers = {
  async GET(req) {
    const auth = await getAuthPayload(req);
    if (auth instanceof Response) return auth;

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
        getCalorieTrend(auth.userId, startDate, endDate),
        getLoggingStreak(auth.userId),
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
