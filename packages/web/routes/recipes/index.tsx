import { Head } from "$fresh/runtime.ts";
import { Handlers, PageProps } from "$fresh/server.ts";
import { requireAuth } from "../../utils/auth.ts";
import type { User, RecipeWithIngredients } from "@nutrition-llama/shared";
import { getUserRecipes } from "../../utils/db.ts";
import RecipeBrowser from "../../islands/RecipeBrowser.tsx";

interface RecipesData {
  user: User;
  initialRecipes: RecipeWithIngredients[];
}

export const handler: Handlers<RecipesData> = {
  async GET(req, ctx) {
    const authResult = await requireAuth(req);
    if (authResult.redirect) {
      return authResult.redirect;
    }

    const initialRecipes = await getUserRecipes(authResult.user!.id);

    return ctx.render({
      user: authResult.user!,
      initialRecipes,
    });
  },
};

export default function RecipesPage({ data }: PageProps<RecipesData>) {
  const { initialRecipes } = data;

  return (
    <>
      <Head>
        <title>Recipes - Nutrition Llama</title>
      </Head>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="flex justify-between items-center mb-8">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">Recipes</h1>
            <p class="text-gray-600">Save combinations of foods to log quickly</p>
          </div>
          <a
            href="/recipes/new"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
          >
            New Recipe
          </a>
        </div>

        <RecipeBrowser initialRecipes={initialRecipes} />
      </div>
    </>
  );
}
