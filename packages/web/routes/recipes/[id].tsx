import { Head } from "$fresh/runtime.ts";
import { Handlers, PageProps } from "$fresh/server.ts";
import { requireAuth } from "../../utils/auth.ts";
import type { User, RecipeWithIngredients } from "@nutrition-llama/shared";
import { getRecipeById } from "../../utils/db.ts";
import FoodLogForm from "../../islands/FoodLogForm.tsx";
import DeleteButton from "../../islands/DeleteButton.tsx";

interface RecipeDetailData {
  user: User;
  recipe: RecipeWithIngredients;
}

export const handler: Handlers<RecipeDetailData> = {
  async GET(req, ctx) {
    const authResult = await requireAuth(req);
    if (authResult.redirect) {
      return authResult.redirect;
    }

    const { id } = ctx.params;
    const recipe = await getRecipeById(id, authResult.user!.id);

    if (!recipe) {
      return new Response("Not Found", { status: 404 });
    }

    return ctx.render({ user: authResult.user!, recipe });
  },
};

export default function RecipeDetailPage({ data }: PageProps<RecipeDetailData>) {
  const { recipe } = data;
  const nr = recipe.nutrition;

  return (
    <>
      <Head>
        <title>{recipe.name} - Nutrition Llama</title>
      </Head>

      <div class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="mb-6">
          <a href="/recipes" class="text-primary-600 hover:text-primary-500 text-sm">
            &larr; Back to Recipes
          </a>
          <div class="flex items-center gap-3 mt-2">
            <h1 class="text-2xl font-bold text-gray-900">{recipe.name}</h1>
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
              Recipe
            </span>
          </div>
          {recipe.description && (
            <p class="text-gray-600 mt-1">{recipe.description}</p>
          )}
          <p class="text-gray-500 text-sm mt-1">
            Makes {recipe.servings} serving{recipe.servings !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Actions */}
        <div class="bg-white shadow rounded-lg p-6 mb-6">
          <div class="flex gap-3">
            <a
              href={`/recipes/${recipe.id}/edit`}
              class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Edit Recipe
            </a>
            <DeleteButton itemId={recipe.id} itemName={recipe.name} apiPath="/api/recipes" redirectTo="/recipes" label="Recipe" />
          </div>
        </div>

        {/* Ingredients */}
        <div class="bg-white shadow rounded-lg p-6 mb-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">
            Ingredients ({recipe.ingredients.length})
          </h2>
          <ul class="divide-y divide-gray-100">
            {recipe.ingredients.map((ing) => (
              <li key={ing.id} class="py-3 flex items-center justify-between">
                <div>
                  <span class="text-sm font-medium text-gray-900">{ing.nutritionRecord.name}</span>
                  <span class="text-xs text-gray-500 ml-2">
                    {ing.amountServings} serving{ing.amountServings !== 1 ? "s" : ""}
                  </span>
                </div>
                <span class="text-xs text-gray-500">
                  {Math.round(ing.nutritionRecord.calories * ing.amountServings)} cal
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Per-serving nutrition */}
        <div class="bg-white shadow rounded-lg p-6 mb-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Nutrition Facts (per serving)</h2>
          <div class="border border-gray-300 rounded-lg p-4">
            <h4 class="text-base font-bold text-gray-900 border-b-8 border-gray-900 pb-1 mb-2">
              Nutrition Facts
            </h4>
            <p class="text-sm text-gray-500 border-b border-gray-300 pb-2 mb-2">1 serving</p>
            <div class="text-sm space-y-1">
              <div class="flex justify-between font-bold border-b-4 border-gray-900 pb-1">
                <span>Calories</span>
                <span>{Math.round(nr.calories)}</span>
              </div>
              <div class="flex justify-between border-b border-gray-200 py-0.5">
                <span class="font-semibold">Total Fat</span>
                <span>{Math.round(nr.totalFat ?? 0)}g</span>
              </div>
              <div class="flex justify-between border-b border-gray-200 py-0.5">
                <span class="font-semibold">Cholesterol</span>
                <span>{Math.round(nr.cholesterol ?? 0)}mg</span>
              </div>
              <div class="flex justify-between border-b border-gray-200 py-0.5">
                <span class="font-semibold">Sodium</span>
                <span>{Math.round(nr.sodium ?? 0)}mg</span>
              </div>
              <div class="flex justify-between border-b border-gray-200 py-0.5">
                <span class="font-semibold">Total Carbohydrates</span>
                <span>{Math.round(nr.carbohydrates ?? 0)}g</span>
              </div>
              <div class="flex justify-between pl-4 border-b border-gray-200 py-0.5">
                <span>Fiber</span>
                <span>{Math.round(nr.fiber ?? 0)}g</span>
              </div>
              <div class="flex justify-between pl-4 border-b border-gray-200 py-0.5">
                <span>Sugars</span>
                <span>{Math.round(nr.sugars ?? 0)}g</span>
              </div>
              <div class="flex justify-between border-b-4 border-gray-900 py-0.5">
                <span class="font-semibold">Protein</span>
                <span>{Math.round(nr.protein ?? 0)}g</span>
              </div>
            </div>
          </div>
        </div>

        {/* Log this recipe */}
        <div class="bg-white shadow rounded-lg p-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Log This Recipe</h2>
          <FoodLogForm
            mode="log"
            foodId={recipe.nutritionRecordId}
            foodName={recipe.name}
            foodNutrition={{
              calories: nr.calories,
              protein: nr.protein,
              carbohydrates: nr.carbohydrates,
              totalFat: nr.totalFat,
              fiber: nr.fiber,
              sugars: nr.sugars,
              sodium: nr.sodium,
              cholesterol: nr.cholesterol,
              servingSizeValue: 1,
              servingSizeUnit: "serving",
            }}
          />
        </div>
      </div>
    </>
  );
}
