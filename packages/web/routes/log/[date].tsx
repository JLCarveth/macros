import { Head } from "$fresh/runtime.ts";
import { Handlers, PageProps } from "$fresh/server.ts";
import { requireAuth } from "../../utils/auth.ts";
import type { User, DailySummary, UserGoals } from "@nutrition-llama/shared";
import { getDailySummary, getUserGoals } from "../../utils/db.ts";
import DailyLogManager from "../../islands/DailyLogManager.tsx";

interface LogData {
  user: User;
  date: string;
  summary: DailySummary | null;
  goals: UserGoals | null;
}

export const handler: Handlers<LogData> = {
  async GET(req, ctx) {
    const authResult = await requireAuth(req);
    if (authResult.redirect) {
      return authResult.redirect;
    }

    const { date } = ctx.params;

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return new Response("Invalid date format", { status: 400 });
    }

    const [summary, goals] = await Promise.all([
      getDailySummary(authResult.user!.id, date),
      getUserGoals(authResult.user!.id),
    ]);

    return ctx.render({
      user: authResult.user!,
      date,
      summary,
      goals,
    });
  },
};

export default function LogDatePage({ data }: PageProps<LogData>) {
  const { date, summary } = data;

  const displayDate = new Date(date + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const prevDate = new Date(date + "T00:00:00");
  prevDate.setDate(prevDate.getDate() - 1);
  const prevDateStr = prevDate.toISOString().split("T")[0];

  const nextDate = new Date(date + "T00:00:00");
  nextDate.setDate(nextDate.getDate() + 1);
  const nextDateStr = nextDate.toISOString().split("T")[0];

  const today = new Date().toISOString().split("T")[0];
  const isToday = date === today;
  const isFuture = date > today;

  return (
    <>
      <Head>
        <title>Food Log - {displayDate} - Nutrition Llama</title>
      </Head>

      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Date Navigation */}
        <div class="flex items-center justify-between mb-8">
          <a
            href={`/log/${prevDateStr}`}
            class="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            &larr; Previous
          </a>
          <div class="text-center">
            <h1 class="text-2xl font-bold text-gray-900">{displayDate}</h1>
            {isToday && <span class="text-sm text-primary-600">Today</span>}
          </div>
          <a
            href={`/log/${nextDateStr}`}
            class={`inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md ${
              isFuture
                ? "text-gray-400 bg-gray-100 cursor-not-allowed"
                : "text-gray-700 bg-white hover:bg-gray-50"
            }`}
          >
            Next &rarr;
          </a>
        </div>

        <DailyLogManager date={date} initialSummary={summary} goals={data.goals} />
      </div>
    </>
  );
}
