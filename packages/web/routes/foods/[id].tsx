import { Head } from "$fresh/runtime.ts";
import { Handlers, PageProps } from "$fresh/server.ts";
import { requireAuth } from "../../utils/auth.ts";
import type { User, NutritionRecord } from "@nutrition-llama/shared";
import { getFoodById } from "../../utils/db.ts";
import FoodLogForm from "../../islands/FoodLogForm.tsx";

interface FoodDetailData {
  user: User;
  food: NutritionRecord;
}

export const handler: Handlers<FoodDetailData> = {
  async GET(req, ctx) {
    const authResult = await requireAuth(req);
    if (authResult.redirect) {
      return authResult.redirect;
    }

    const { id } = ctx.params;
    const food = await getFoodById(id, authResult.user!.id);

    if (!food) {
      return new Response("Not Found", { status: 404 });
    }

    return ctx.render({
      user: authResult.user!,
      food,
    });
  },
};

export default function FoodDetailPage({ data }: PageProps<FoodDetailData>) {
  const { food } = data;

  return (
    <>
      <Head>
        <title>{food.name} - Nutrition Llama</title>
      </Head>

      <div class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="mb-8">
          <a href="/foods" class="text-primary-600 hover:text-primary-500 text-sm">
            &larr; Back to My Foods
          </a>
          <h1 class="text-2xl font-bold text-gray-900 mt-2">{food.name}</h1>
          <p class="text-gray-600">
            {food.servingSizeValue}{food.servingSizeUnit} per serving
            {food.source && ` | Source: ${food.source}`}
          </p>
        </div>

        <div class="bg-white shadow rounded-lg p-6 mb-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Nutrition Facts</h2>
          <dl class="grid grid-cols-2 gap-4">
            <div>
              <dt class="text-sm text-gray-500">Calories</dt>
              <dd class="text-lg font-medium">{food.calories}</dd>
            </div>
            <div>
              <dt class="text-sm text-gray-500">Protein</dt>
              <dd class="text-lg font-medium">{food.protein || 0}g</dd>
            </div>
            <div>
              <dt class="text-sm text-gray-500">Carbohydrates</dt>
              <dd class="text-lg font-medium">{food.carbohydrates || 0}g</dd>
            </div>
            <div>
              <dt class="text-sm text-gray-500">Total Fat</dt>
              <dd class="text-lg font-medium">{food.totalFat || 0}g</dd>
            </div>
            <div>
              <dt class="text-sm text-gray-500">Fiber</dt>
              <dd class="text-lg font-medium">{food.fiber || 0}g</dd>
            </div>
            <div>
              <dt class="text-sm text-gray-500">Sugars</dt>
              <dd class="text-lg font-medium">{food.sugars || 0}g</dd>
            </div>
            <div>
              <dt class="text-sm text-gray-500">Sodium</dt>
              <dd class="text-lg font-medium">{food.sodium || 0}mg</dd>
            </div>
            <div>
              <dt class="text-sm text-gray-500">Cholesterol</dt>
              <dd class="text-lg font-medium">{food.cholesterol || 0}mg</dd>
            </div>
          </dl>
        </div>

        <div class="bg-white shadow rounded-lg p-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Log This Food</h2>
          <FoodLogForm mode="log" foodId={food.id} foodName={food.name} />
        </div>
      </div>
    </>
  );
}
