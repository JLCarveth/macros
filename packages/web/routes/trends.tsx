import { Head } from "$fresh/runtime.ts";
import { Handlers, PageProps } from "$fresh/server.ts";
import { requireAuth } from "../utils/auth.ts";
import type { User, WeightLogEntry, TrendsData } from "@nutrition-llama/shared";
import { getWeightLog, getCalorieTrend, getLoggingStreak } from "../utils/db.ts";
import TrendsView from "../islands/TrendsView.tsx";

interface TrendsPageData {
  user: User;
  weightLog: WeightLogEntry[];
  trends: TrendsData;
}

export const handler: Handlers<TrendsPageData> = {
  async GET(req, ctx) {
    const authResult = await requireAuth(req);
    if (authResult.redirect) {
      return authResult.redirect;
    }

    const now = new Date();
    const endDate = now.toISOString().split("T")[0];
    const startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    const userId = authResult.user!.id;

    const [weightLog, calorieTrend, streak] = await Promise.all([
      getWeightLog(userId, startDate, endDate),
      getCalorieTrend(userId, startDate, endDate),
      getLoggingStreak(userId),
    ]);

    return ctx.render({
      user: authResult.user!,
      weightLog,
      trends: {
        calorieTrend,
        currentStreak: streak.currentStreak,
        longestStreak: streak.longestStreak,
      },
    });
  },
};

export default function TrendsPage({ data }: PageProps<TrendsPageData>) {
  return (
    <>
      <Head>
        <title>Trends - Nutrition Llama</title>
      </Head>

      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="mb-8">
          <h1 class="text-3xl font-bold text-gray-900">Trends</h1>
          <p class="text-gray-600 mt-1">
            Track your weight, calorie intake, and logging streaks over time.
          </p>
        </div>

        <TrendsView
          initialWeightLog={data.weightLog}
          initialTrends={data.trends}
        />
      </div>
    </>
  );
}
