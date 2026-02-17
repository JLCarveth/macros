import { Head } from "$fresh/runtime.ts";
import { Handlers, PageProps } from "$fresh/server.ts";
import { requireAuth } from "../utils/auth.ts";
import type { User, UserGoals } from "@nutrition-llama/shared";
import { getUserGoals } from "../utils/db.ts";
import GoalSetup from "../islands/GoalSetup.tsx";

interface GoalsData {
  user: User;
  goals: UserGoals | null;
}

export const handler: Handlers<GoalsData> = {
  async GET(req, ctx) {
    const authResult = await requireAuth(req);
    if (authResult.redirect) {
      return authResult.redirect;
    }

    const goals = await getUserGoals(authResult.user!.id);

    return ctx.render({
      user: authResult.user!,
      goals,
    });
  },
};

export default function GoalsPage({ data }: PageProps<GoalsData>) {
  const { goals } = data;

  return (
    <>
      <Head>
        <title>Goals - Nutrition Llama</title>
      </Head>

      <div class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="mb-8">
          <h1 class="text-3xl font-bold text-gray-900">Nutrition Goals</h1>
          <p class="text-gray-600 mt-1">
            Set your daily calorie and macro targets to track your progress.
          </p>
        </div>

        <div class="bg-white shadow rounded-lg p-6">
          <GoalSetup existingGoals={goals} />
        </div>
      </div>
    </>
  );
}
