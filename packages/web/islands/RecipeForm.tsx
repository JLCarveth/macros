import { useState } from "preact/hooks";
import type { NutritionRecordWithSource } from "@nutrition-llama/shared";
import FoodSearch from "./FoodSearch.tsx";

interface IngredientLine {
  nutritionRecordId: string;
  name: string;
  amountServings: number;
  calories: number;
  protein: number | null;
  carbohydrates: number | null;
  totalFat: number | null;
}

interface InitialData {
  name: string;
  description: string;
  servings: number;
  ingredients: IngredientLine[];
}

interface Props {
  mode: "create" | "edit";
  recipeId?: string;
  initialData?: InitialData;
}

function computePreview(
  ingredients: IngredientLine[],
  servings: number
): { calories: number; protein: number; carbs: number; fat: number } {
  let cal = 0, protein = 0, carbs = 0, fat = 0;
  for (const ing of ingredients) {
    cal += ing.calories * ing.amountServings;
    protein += (ing.protein ?? 0) * ing.amountServings;
    carbs += (ing.carbohydrates ?? 0) * ing.amountServings;
    fat += (ing.totalFat ?? 0) * ing.amountServings;
  }
  const s = servings > 0 ? servings : 1;
  return {
    calories: Math.round(cal / s),
    protein: Math.round(protein / s),
    carbs: Math.round(carbs / s),
    fat: Math.round(fat / s),
  };
}

export default function RecipeForm({ mode, recipeId, initialData }: Props) {
  const [name, setName] = useState(initialData?.name ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [servings, setServings] = useState(String(initialData?.servings ?? "1"));
  const [ingredients, setIngredients] = useState<IngredientLine[]>(
    initialData?.ingredients ?? []
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAddIngredient = (food: NutritionRecordWithSource) => {
    // Avoid duplicates
    if (ingredients.find((i) => i.nutritionRecordId === food.id)) return;
    setIngredients([
      ...ingredients,
      {
        nutritionRecordId: food.id,
        name: food.name,
        amountServings: 1,
        calories: food.calories,
        protein: food.protein,
        carbohydrates: food.carbohydrates,
        totalFat: food.totalFat,
      },
    ]);
  };

  const handleRemoveIngredient = (idx: number) => {
    setIngredients(ingredients.filter((_, i) => i !== idx));
  };

  const handleAmountChange = (idx: number, val: string) => {
    const amount = parseFloat(val);
    if (isNaN(amount) || amount <= 0) return;
    setIngredients(
      ingredients.map((ing, i) => (i === idx ? { ...ing, amountServings: amount } : ing))
    );
  };

  const parsedServings = parseFloat(servings) || 1;
  const preview = computePreview(ingredients, parsedServings);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Recipe name is required");
      return;
    }
    if (parsedServings <= 0) {
      setError("Servings must be greater than 0");
      return;
    }
    if (ingredients.length === 0) {
      setError("Add at least one ingredient");
      return;
    }

    setLoading(true);
    try {
      const body = {
        name: name.trim(),
        description: description.trim() || undefined,
        servings: parsedServings,
        ingredients: ingredients.map((ing) => ({
          nutritionRecordId: ing.nutritionRecordId,
          amountServings: ing.amountServings,
        })),
      };

      const url = mode === "create" ? "/api/recipes" : `/api/recipes/${recipeId}`;
      const method = mode === "create" ? "POST" : "PUT";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save recipe");
      }

      const saved = await response.json();
      globalThis.location.href = `/recipes/${saved.id}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save recipe");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} class="space-y-6">
      {error && (
        <div class="rounded-md bg-red-50 p-4">
          <p class="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Basic info */}
      <div class="bg-white shadow rounded-lg p-6 space-y-4">
        <h3 class="text-lg font-medium text-gray-900">Recipe Details</h3>

        <div>
          <label class="block text-sm font-medium text-gray-700">Recipe Name *</label>
          <input
            type="text"
            required
            value={name}
            onInput={(e) => setName((e.target as HTMLInputElement).value)}
            placeholder="e.g., Morning Smoothie, Meal Prep Bowl"
            class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700">Description (optional)</label>
          <textarea
            value={description}
            onInput={(e) => setDescription((e.target as HTMLTextAreaElement).value)}
            rows={2}
            placeholder="Brief description of this recipe"
            class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700">
            Number of Servings *
            <span class="font-normal text-gray-500 ml-1">(nutrition shown per serving)</span>
          </label>
          <input
            type="number"
            required
            step="0.25"
            min="0.25"
            value={servings}
            onInput={(e) => setServings((e.target as HTMLInputElement).value)}
            class="mt-1 block w-full sm:w-32 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
      </div>

      {/* Ingredients */}
      <div class="bg-white shadow rounded-lg p-6 space-y-4">
        <h3 class="text-lg font-medium text-gray-900">Ingredients</h3>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Add Ingredient</label>
          <FoodSearch
            onSelect={handleAddIngredient}
            placeholder="Search foods to add..."
          />
        </div>

        {ingredients.length > 0 ? (
          <ul class="divide-y divide-gray-100">
            {ingredients.map((ing, idx) => (
              <li key={ing.nutritionRecordId} class="py-3 flex items-center gap-3">
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-900 truncate">{ing.name}</p>
                  <p class="text-xs text-gray-500">
                    {Math.round(ing.calories * ing.amountServings)} cal total
                  </p>
                </div>
                <div class="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.25"
                    min="0.01"
                    value={ing.amountServings}
                    onInput={(e) =>
                      handleAmountChange(idx, (e.target as HTMLInputElement).value)
                    }
                    class="w-20 px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    title="Amount in servings"
                  />
                  <span class="text-xs text-gray-500 whitespace-nowrap">servings</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveIngredient(idx)}
                    class="p-1 text-gray-400 hover:text-red-600 rounded"
                    title="Remove"
                  >
                    <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p class="text-sm text-gray-500 text-center py-4">
            No ingredients added yet. Search for foods above.
          </p>
        )}
      </div>

      {/* Live nutrition preview */}
      {ingredients.length > 0 && (
        <div class="bg-white shadow rounded-lg p-6">
          <h3 class="text-lg font-medium text-gray-900 mb-4">
            Nutrition Preview
            <span class="font-normal text-gray-500 text-sm ml-2">per serving</span>
          </h3>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div class="text-center p-3 bg-gray-50 rounded-lg">
              <p class="text-2xl font-bold text-gray-900">{preview.calories}</p>
              <p class="text-xs text-gray-500 mt-1">Calories</p>
            </div>
            <div class="text-center p-3 bg-red-50 rounded-lg">
              <p class="text-2xl font-bold text-red-600">{preview.protein}g</p>
              <p class="text-xs text-red-500 mt-1">Protein</p>
            </div>
            <div class="text-center p-3 bg-yellow-50 rounded-lg">
              <p class="text-2xl font-bold text-yellow-600">{preview.carbs}g</p>
              <p class="text-xs text-yellow-500 mt-1">Carbs</p>
            </div>
            <div class="text-center p-3 bg-blue-50 rounded-lg">
              <p class="text-2xl font-bold text-blue-600">{preview.fat}g</p>
              <p class="text-xs text-blue-500 mt-1">Fat</p>
            </div>
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        class="w-full px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Saving..." : mode === "create" ? "Create Recipe" : "Save Changes"}
      </button>
    </form>
  );
}
