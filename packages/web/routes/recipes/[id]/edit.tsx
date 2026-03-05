import { Head } from "$fresh/runtime.ts";
import { Handlers, PageProps } from "$fresh/server.ts";
import { requireAuth } from "../../../utils/auth.ts";
import type { User, RecipeWithIngredients } from "@nutrition-llama/shared";
import { getRecipeById } from "../../../utils/db.ts";
import RecipeForm from "../../../islands/RecipeForm.tsx";

interface EditRecipeData {
  user: User;
  recipe: RecipeWithIngredients;
}

export const handler: Handlers<EditRecipeData> = {
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

export default function EditRecipePage({ data }: PageProps<EditRecipeData>) {
  const { recipe } = data;

  return (
    <>
      <Head>
        <title>Edit {recipe.name} - Nutrition Llama</title>
      </Head>

      <div class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="mb-6">
          <a href={`/recipes/${recipe.id}`} class="text-primary-600 hover:text-primary-500 text-sm">
            &larr; Back to Recipe
          </a>
          <h1 class="text-2xl font-bold text-gray-900 mt-2">Edit {recipe.name}</h1>
        </div>

        <RecipeForm
          mode="edit"
          recipeId={recipe.id}
          initialData={{
            name: recipe.name,
            description: recipe.description ?? "",
            servings: recipe.servings,
            ingredients: recipe.ingredients.map((ing) => ({
              nutritionRecordId: ing.nutritionRecordId,
              amountServings: ing.amountServings,
              name: ing.nutritionRecord.name,
              calories: ing.nutritionRecord.calories,
              protein: ing.nutritionRecord.protein,
              carbohydrates: ing.nutritionRecord.carbohydrates,
              totalFat: ing.nutritionRecord.totalFat,
            })),
          }}
        />
      </div>
    </>
  );
}
