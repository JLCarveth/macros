import { Head } from "$fresh/runtime.ts";
import { Handlers, PageProps } from "$fresh/server.ts";
import { requireAuth } from "../../utils/auth.ts";
import type { User } from "@nutrition-llama/shared";
import FoodLogForm from "../../islands/FoodLogForm.tsx";

interface NewFoodData {
  user: User;
  initialUpc: string | null;
}

export const handler: Handlers<NewFoodData> = {
  async GET(req, ctx) {
    const authResult = await requireAuth(req);
    if (authResult.redirect) {
      return authResult.redirect;
    }

    // Extract optional ?upc= query param to pre-fill UPC field
    const url = new URL(req.url);
    const initialUpc = url.searchParams.get("upc");

    return ctx.render({
      user: authResult.user!,
      initialUpc,
    });
  },
};

export default function NewFoodPage({ data }: PageProps<NewFoodData>) {
  return (
    <>
      <Head>
        <title>Add Food - Nutrition Llama</title>
      </Head>

      <div class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="mb-8">
          <a href="/foods" class="text-primary-600 hover:text-primary-500 text-sm">
            &larr; Back to My Foods
          </a>
          <h1 class="text-2xl font-bold text-gray-900 mt-2">Add New Food</h1>
          <p class="text-gray-600">Enter nutrition information manually.</p>
        </div>

        <FoodLogForm mode="create" initialUpc={data.initialUpc} />
      </div>
    </>
  );
}
