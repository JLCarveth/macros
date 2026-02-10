import { Head } from "$fresh/runtime.ts";
import { Handlers, PageProps } from "$fresh/server.ts";
import { requireAuth } from "../../utils/auth.ts";
import type { User, NutritionRecordWithSource } from "@nutrition-llama/shared";
import { getFoodByIdAllowSystem } from "../../utils/db.ts";
import FoodLogForm from "../../islands/FoodLogForm.tsx";

interface FoodDetailData {
  user: User;
  food: NutritionRecordWithSource;
}

export const handler: Handlers<FoodDetailData> = {
  async GET(req, ctx) {
    const authResult = await requireAuth(req);
    if (authResult.redirect) {
      return authResult.redirect;
    }

    const { id } = ctx.params;
    const food = await getFoodByIdAllowSystem(id, authResult.user!.id);

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
            &larr; {food.isSystem ? "Back to Foods" : "Back to My Foods"}
          </a>
          <div class="flex items-center gap-3 mt-2">
            <h1 class="text-2xl font-bold text-gray-900">{food.name}</h1>
            {food.isSystem && (
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                USDA Foundation Food
              </span>
            )}
          </div>
          <p class="text-gray-600">
            {food.servingSizeValue}{food.servingSizeUnit} per serving
            {food.source && ` | Source: ${food.source}`}
          </p>
        </div>

        {!food.isSystem && (
          <div class="bg-white shadow rounded-lg p-6 mb-6">
            <div class="flex gap-3">
              <a
                href={`/foods/${food.id}/edit`}
                class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Edit Food
              </a>
            </div>
          </div>
        )}

        <div class="bg-white shadow rounded-lg p-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Log This Food</h2>
          <FoodLogForm
            mode="log"
            foodId={food.id}
            foodName={food.name}
            foodNutrition={{
              calories: food.calories,
              protein: food.protein,
              carbohydrates: food.carbohydrates,
              totalFat: food.totalFat,
              fiber: food.fiber,
              sugars: food.sugars,
              sodium: food.sodium,
              cholesterol: food.cholesterol,
              servingSizeValue: food.servingSizeValue,
              servingSizeUnit: food.servingSizeUnit,
            }}
          />
        </div>
      </div>
    </>
  );
}
