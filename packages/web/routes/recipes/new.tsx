import { Head } from "$fresh/runtime.ts";
import { Handlers, PageProps } from "$fresh/server.ts";
import { requireAuth } from "../../utils/auth.ts";
import type { User } from "@nutrition-llama/shared";
import RecipeForm from "../../islands/RecipeForm.tsx";

interface NewRecipeData {
  user: User;
}

export const handler: Handlers<NewRecipeData> = {
  async GET(req, ctx) {
    const authResult = await requireAuth(req);
    if (authResult.redirect) {
      return authResult.redirect;
    }

    return ctx.render({ user: authResult.user! });
  },
};

export default function NewRecipePage({ data: _data }: PageProps<NewRecipeData>) {
  return (
    <>
      <Head>
        <title>New Recipe - Nutrition Llama</title>
      </Head>

      <div class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="mb-6">
          <a href="/recipes" class="text-primary-600 hover:text-primary-500 text-sm">
            &larr; Back to Recipes
          </a>
          <h1 class="text-2xl font-bold text-gray-900 mt-2">New Recipe</h1>
        </div>

        <RecipeForm mode="create" />
      </div>
    </>
  );
}
