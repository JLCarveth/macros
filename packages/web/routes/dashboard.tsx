import { Head } from "$fresh/runtime.ts";
import { Handlers, PageProps } from "$fresh/server.ts";
import { requireAuth } from "../utils/auth.ts";
import type { User, DailySummary, UserGoals } from "@nutrition-llama/shared";
import { getDailySummary, getUserGoals } from "../utils/db.ts";
import MacroProgressBar from "../islands/MacroProgressBar.tsx";

interface DashboardData {
  user: User;
  summary: DailySummary | null;
  goals: UserGoals | null;
}

export const handler: Handlers<DashboardData> = {
  async GET(req, ctx) {
    const authResult = await requireAuth(req);
    if (authResult.redirect) {
      return authResult.redirect;
    }

    const today = new Date().toISOString().split("T")[0];
    const [summary, goals] = await Promise.all([
      getDailySummary(authResult.user!.id, today),
      getUserGoals(authResult.user!.id),
    ]);

    return ctx.render({
      user: authResult.user!,
      summary,
      goals,
    });
  },
};

export default function Dashboard({ data }: PageProps<DashboardData>) {
  const { user, summary, goals } = data;
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <>
      <Head>
        <title>Dashboard - Nutrition Llama</title>
      </Head>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="mb-8">
          <h1 class="text-3xl font-bold text-gray-900">
            Welcome back, {user.displayName || user.email.split("@")[0]}
          </h1>
          <p class="text-gray-600">{today}</p>
        </div>

        {/* Quick Actions */}
        <div class="grid gap-4 md:grid-cols-4 mb-8">
          <a
            href="/scan"
            class="flex items-center p-4 bg-primary-50 border border-primary-200 rounded-lg hover:bg-primary-100 transition-colors"
          >
            <div class="flex items-center justify-center h-10 w-10 rounded-full bg-primary-100 text-primary-600 mr-4">
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h3 class="text-lg font-medium text-gray-900">Scan Label</h3>
              <p class="text-sm text-gray-500">Capture nutrition info</p>
            </div>
          </a>

          <a
            href="/foods"
            class="flex items-center p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <div class="flex items-center justify-center h-10 w-10 rounded-full bg-blue-100 text-blue-600 mr-4">
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div>
              <h3 class="text-lg font-medium text-gray-900">My Foods</h3>
              <p class="text-sm text-gray-500">View saved foods</p>
            </div>
          </a>

          <a
            href="/log"
            class="flex items-center p-4 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors"
          >
            <div class="flex items-center justify-center h-10 w-10 rounded-full bg-purple-100 text-purple-600 mr-4">
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <h3 class="text-lg font-medium text-gray-900">Food Log</h3>
              <p class="text-sm text-gray-500">Track daily meals</p>
            </div>
          </a>

          <a
            href="/upc"
            class="flex items-center p-4 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors"
          >
            <div class="flex items-center justify-center h-10 w-10 rounded-full bg-amber-100 text-amber-600 mr-4">
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
            </div>
            <div>
              <h3 class="text-lg font-medium text-gray-900">Quick Add</h3>
              <p class="text-sm text-gray-500">Scan barcode</p>
            </div>
          </a>
        </div>

        {/* Goals Progress */}
        {goals ? (
          <div class="bg-white shadow rounded-lg p-6 mb-8">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-xl font-semibold text-gray-900">Daily Progress</h2>
              <a href="/goals" class="text-sm text-primary-600 hover:text-primary-700 font-medium">
                Edit Goals
              </a>
            </div>
            <div class="space-y-4">
              <MacroProgressBar
                label="Calories"
                current={summary?.totalCalories || 0}
                target={goals.calories}
                color="gray"
                unit="cal"
              />
              <MacroProgressBar
                label="Protein"
                current={summary?.totalProtein || 0}
                target={goals.proteinG}
                color="red"
              />
              <MacroProgressBar
                label="Carbs"
                current={summary?.totalCarbohydrates || 0}
                target={goals.carbsG}
                color="yellow"
              />
              <MacroProgressBar
                label="Fat"
                current={summary?.totalFat || 0}
                target={goals.fatG}
                color="blue"
              />
            </div>
          </div>
        ) : (
          <div class="bg-primary-50 border border-primary-200 rounded-lg p-6 mb-8">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-lg font-medium text-primary-900">Set Your Nutrition Goals</h3>
                <p class="text-sm text-primary-700 mt-1">
                  Track your daily progress by setting calorie and macro targets.
                </p>
              </div>
              <a
                href="/goals"
                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
              >
                Set Goals
              </a>
            </div>
          </div>
        )}

        {/* Daily Summary */}
        <div class="bg-white shadow rounded-lg p-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">Today's Summary</h2>

          {summary && summary.entries.length > 0 ? (
            <>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div class="bg-gray-50 rounded-lg p-4 text-center">
                  <p class="text-2xl font-bold text-gray-900">{Math.round(summary.totalCalories)}</p>
                  <p class="text-sm text-gray-500">Calories</p>
                </div>
                <div class="bg-red-50 rounded-lg p-4 text-center">
                  <p class="text-2xl font-bold text-red-600">{Math.round(summary.totalProtein)}g</p>
                  <p class="text-sm text-gray-500">Protein</p>
                </div>
                <div class="bg-yellow-50 rounded-lg p-4 text-center">
                  <p class="text-2xl font-bold text-yellow-600">{Math.round(summary.totalCarbohydrates)}g</p>
                  <p class="text-sm text-gray-500">Carbs</p>
                </div>
                <div class="bg-teal-50 rounded-lg p-4 text-center">
                  <p class="text-2xl font-bold text-teal-600">{Math.round(summary.totalFat)}g</p>
                  <p class="text-sm text-gray-500">Fat</p>
                </div>
              </div>

              <h3 class="text-sm font-medium text-gray-700 mb-2">Logged Items</h3>
              <ul class="divide-y divide-gray-200">
                {summary.entries.map((entry) => (
                  <li key={entry.id} class="py-3 flex justify-between items-center">
                    <div>
                      <p class="font-medium text-gray-900">{entry.nutritionRecord.name}</p>
                      <p class="text-sm text-gray-500">
                        {entry.servings} serving{entry.servings !== 1 ? "s" : ""} - {entry.mealType}
                      </p>
                    </div>
                    <p class="text-gray-600">
                      {Math.round(entry.nutritionRecord.calories * entry.servings)} cal
                    </p>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <div class="text-center py-8">
              <p class="text-gray-500 mb-4">No foods logged today</p>
              <a
                href="/foods"
                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
              >
                Log Your First Meal
              </a>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
