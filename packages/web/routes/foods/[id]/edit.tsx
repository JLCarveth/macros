import { Head } from "$fresh/runtime.ts";
import { Handlers, PageProps } from "$fresh/server.ts";
import { requireAuth } from "../../../utils/auth.ts";
import { getFoodById } from "../../../utils/db.ts";
import type { User, NutritionRecord } from "@nutrition-llama/shared";
import FoodLogForm from "../../../islands/FoodLogForm.tsx";

interface EditFoodData {
  user: User;
  food: NutritionRecord;
}

export const handler: Handlers<EditFoodData> = {
  async GET(req, ctx) {
    const authResult = await requireAuth(req);
    if (authResult.redirect) {
      return authResult.redirect;
    }

    const { id } = ctx.params;
    const food = await getFoodById(id, authResult.user!.id);

    if (!food) {
      return new Response(null, {
        status: 302,
        headers: { Location: "/foods" },
      });
    }

    return ctx.render({ user: authResult.user!, food });
  },
};

export default function EditFoodPage({ data }: PageProps<EditFoodData>) {
  const { food } = data;

  return (
    <>
      <Head>
        <title>Edit {food.name} - Nutrition Llama</title>
      </Head>

      <div class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="mb-8">
          <a href={`/foods/${food.id}`} class="text-primary-600 hover:text-primary-500 text-sm">
            &larr; Back to {food.name}
          </a>
          <h1 class="text-2xl font-bold text-gray-900 mt-2">Edit Food</h1>
          <p class="text-gray-600">Update nutrition information for {food.name}.</p>
        </div>

        <FoodLogForm
          mode="edit"
          foodId={food.id}
          initialFood={{
            name: food.name,
            servingSizeValue: food.servingSizeValue,
            servingSizeUnit: food.servingSizeUnit,
            calories: food.calories,
            protein: food.protein,
            carbohydrates: food.carbohydrates,
            totalFat: food.totalFat,
            fiber: food.fiber,
            sugars: food.sugars,
            sodium: food.sodium,
            cholesterol: food.cholesterol,
            upcCode: food.upcCode,
          }}
        />
      </div>
    </>
  );
}
