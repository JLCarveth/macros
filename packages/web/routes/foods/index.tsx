import { Head } from "$fresh/runtime.ts";
import { Handlers, PageProps } from "$fresh/server.ts";
import { requireAuth } from "../../utils/auth.ts";
import type { User, NutritionRecord } from "@nutrition-llama/shared";
import { getUserFoods } from "../../utils/db.ts";

interface FoodsData {
  user: User;
  foods: NutritionRecord[];
}

export const handler: Handlers<FoodsData> = {
  async GET(req, ctx) {
    const authResult = await requireAuth(req);
    if (authResult.redirect) {
      return authResult.redirect;
    }

    const foods = await getUserFoods(authResult.user!.id);

    return ctx.render({
      user: authResult.user!,
      foods,
    });
  },
};

export default function FoodsPage({ data }: PageProps<FoodsData>) {
  const { foods } = data;

  return (
    <>
      <Head>
        <title>My Foods - Nutrition Llama</title>
      </Head>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="flex justify-between items-center mb-8">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">My Foods</h1>
            <p class="text-gray-600">Your saved nutrition records</p>
          </div>
          <div class="flex gap-3">
            <a
              href="/scan"
              class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Scan Label
            </a>
            <a
              href="/foods/new"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
            >
              Add Manually
            </a>
          </div>
        </div>

        {foods.length > 0 ? (
          <div class="bg-white shadow rounded-lg overflow-hidden">
            <ul class="divide-y divide-gray-200">
              {foods.map((food) => (
                <li key={food.id}>
                  <a
                    href={`/foods/${food.id}`}
                    class="block hover:bg-gray-50 px-6 py-4"
                  >
                    <div class="flex items-center justify-between">
                      <div>
                        <h3 class="text-lg font-medium text-gray-900">{food.name}</h3>
                        <p class="text-sm text-gray-500">
                          {food.servingSizeValue}{food.servingSizeUnit} per serving
                          {food.upcCode && ` | UPC: ${food.upcCode}`}
                        </p>
                      </div>
                      <div class="text-right">
                        <p class="text-lg font-semibold text-gray-900">{food.calories} cal</p>
                        <p class="text-sm text-gray-500">
                          P: {food.protein || 0}g | C: {food.carbohydrates || 0}g | F: {food.totalFat || 0}g
                        </p>
                      </div>
                    </div>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div class="bg-white shadow rounded-lg p-12 text-center">
            <div class="flex justify-center mb-4">
              <svg class="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 class="text-lg font-medium text-gray-900 mb-2">No foods saved yet</h3>
            <p class="text-gray-500 mb-6">
              Start by scanning a nutrition label or adding a food manually.
            </p>
            <div class="flex justify-center gap-3">
              <a
                href="/scan"
                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
              >
                Scan Label
              </a>
              <a
                href="/foods/new"
                class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Add Manually
              </a>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
