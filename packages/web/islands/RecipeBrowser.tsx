import { useState } from "preact/hooks";
import type { RecipeWithIngredients } from "@nutrition-llama/shared";

interface Props {
  initialRecipes: RecipeWithIngredients[];
}

export default function RecipeBrowser({ initialRecipes }: Props) {
  const [query, setQuery] = useState("");

  const filtered = query.trim()
    ? initialRecipes.filter((r) =>
        r.name.toLowerCase().includes(query.toLowerCase())
      )
    : initialRecipes;

  if (initialRecipes.length === 0) {
    return (
      <div class="text-center py-16">
        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <h3 class="mt-4 text-lg font-medium text-gray-900">No recipes yet</h3>
        <p class="mt-2 text-gray-500">Create a recipe to quickly log your favourite meal combinations.</p>
        <a
          href="/recipes/new"
          class="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
        >
          Create First Recipe
        </a>
      </div>
    );
  }

  return (
    <div class="space-y-4">
      <div>
        <input
          type="text"
          value={query}
          onInput={(e) => setQuery((e.target as HTMLInputElement).value)}
          placeholder="Filter recipes..."
          class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm"
        />
      </div>

      {filtered.length === 0 ? (
        <p class="text-center text-gray-500 py-8">No recipes match your search.</p>
      ) : (
        <div class="bg-white shadow rounded-lg divide-y divide-gray-200">
          {filtered.map((recipe) => (
            <a
              key={recipe.id}
              href={`/recipes/${recipe.id}`}
              class="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
            >
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <span class="text-sm font-medium text-gray-900">{recipe.name}</span>
                  <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-100 text-indigo-700">
                    Recipe
                  </span>
                </div>
                <p class="text-xs text-gray-500 mt-0.5">
                  {recipe.servings} serving{recipe.servings !== 1 ? "s" : ""} &bull; {recipe.ingredients.length} ingredient{recipe.ingredients.length !== 1 ? "s" : ""}
                </p>
              </div>
              <div class="flex items-center gap-4 ml-4 flex-shrink-0">
                <div class="text-right">
                  <p class="text-sm font-semibold text-gray-900">{Math.round(recipe.nutrition.calories)} cal</p>
                  <p class="text-xs text-gray-500">per serving</p>
                </div>
                <div class="hidden sm:flex gap-2">
                  <span class="inline-flex items-center px-2 py-0.5 rounded text-xs bg-red-50 text-red-700">
                    P {Math.round(recipe.nutrition.protein ?? 0)}g
                  </span>
                  <span class="inline-flex items-center px-2 py-0.5 rounded text-xs bg-yellow-50 text-yellow-700">
                    C {Math.round(recipe.nutrition.carbohydrates ?? 0)}g
                  </span>
                  <span class="inline-flex items-center px-2 py-0.5 rounded text-xs bg-blue-50 text-blue-700">
                    F {Math.round(recipe.nutrition.totalFat ?? 0)}g
                  </span>
                </div>
                <svg class="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
