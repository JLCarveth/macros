import { Head } from "$fresh/runtime.ts";
import { Handlers, PageProps } from "$fresh/server.ts";
import { requireAuth } from "../../utils/auth.ts";
import type { User, NutritionRecord } from "@nutrition-llama/shared";
import { getUserFoods } from "../../utils/db.ts";
import FoodBrowser from "../../islands/FoodBrowser.tsx";

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
            <h1 class="text-2xl font-bold text-gray-900">Foods</h1>
            <p class="text-gray-600">Your saved foods and USDA Foundation Foods</p>
          </div>
          <div class="flex gap-3">
            <a
              href="/scan"
              class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Scan Label
            </a>
            <a
              href="/upc"
              class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Scan Barcode
            </a>
            <a
              href="/foods/new"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
            >
              Add Manually
            </a>
          </div>
        </div>

        <FoodBrowser initialFoods={foods} />
      </div>
    </>
  );
}
