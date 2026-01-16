import { useState } from "preact/hooks";
import type { MealType } from "@nutrition-llama/shared";

interface FoodLogFormProps {
  mode: "create" | "log";
  foodId?: string;
  foodName?: string;
}

export default function FoodLogForm({ mode, foodId, foodName }: FoodLogFormProps) {
  // Form state for creating new food
  const [name, setName] = useState("");
  const [servingSizeValue, setServingSizeValue] = useState("100");
  const [servingSizeUnit, setServingSizeUnit] = useState<"g" | "ml">("g");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbohydrates, setCarbohydrates] = useState("");
  const [totalFat, setTotalFat] = useState("");
  const [fiber, setFiber] = useState("");
  const [sugars, setSugars] = useState("");
  const [sodium, setSodium] = useState("");
  const [cholesterol, setCholesterol] = useState("");
  const [upcCode, setUpcCode] = useState("");

  // Log form state
  const [servings, setServings] = useState("1");
  const [mealType, setMealType] = useState<MealType>("snack");
  const [loggedDate, setLoggedDate] = useState(new Date().toISOString().split("T")[0]);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreateFood = async (e: Event) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/foods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          servingSizeValue: parseFloat(servingSizeValue),
          servingSizeUnit,
          calories: parseFloat(calories),
          protein: protein ? parseFloat(protein) : undefined,
          carbohydrates: carbohydrates ? parseFloat(carbohydrates) : undefined,
          totalFat: totalFat ? parseFloat(totalFat) : undefined,
          fiber: fiber ? parseFloat(fiber) : undefined,
          sugars: sugars ? parseFloat(sugars) : undefined,
          sodium: sodium ? parseFloat(sodium) : undefined,
          cholesterol: cholesterol ? parseFloat(cholesterol) : undefined,
          upcCode: upcCode || undefined,
          source: "manual",
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create food");
      }

      window.location.href = "/foods";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create food");
    } finally {
      setLoading(false);
    }
  };

  const handleLogFood = async (e: Event) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nutritionRecordId: foodId,
          servings: parseFloat(servings),
          mealType,
          loggedDate,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to log food");
      }

      window.location.href = `/log/${loggedDate}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to log food");
    } finally {
      setLoading(false);
    }
  };

  if (mode === "log") {
    return (
      <form onSubmit={handleLogFood} class="space-y-4">
        {error && (
          <div class="rounded-md bg-red-50 p-4">
            <p class="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700">Servings</label>
            <input
              type="number"
              step="0.25"
              min="0.25"
              value={servings}
              onInput={(e) => setServings((e.target as HTMLInputElement).value)}
              class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700">Meal</label>
            <select
              value={mealType}
              onChange={(e) => setMealType((e.target as HTMLSelectElement).value as MealType)}
              class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="breakfast">Breakfast</option>
              <option value="lunch">Lunch</option>
              <option value="dinner">Dinner</option>
              <option value="snack">Snack</option>
            </select>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700">Date</label>
          <input
            type="date"
            value={loggedDate}
            onInput={(e) => setLoggedDate((e.target as HTMLInputElement).value)}
            class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          class="w-full px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Logging..." : `Log ${foodName || "Food"}`}
        </button>
      </form>
    );
  }

  // Create mode
  return (
    <form onSubmit={handleCreateFood} class="space-y-6">
      {error && (
        <div class="rounded-md bg-red-50 p-4">
          <p class="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div class="bg-white shadow rounded-lg p-6 space-y-4">
        <h3 class="text-lg font-medium text-gray-900">Basic Info</h3>

        <div>
          <label class="block text-sm font-medium text-gray-700">Food Name *</label>
          <input
            type="text"
            required
            value={name}
            onInput={(e) => setName((e.target as HTMLInputElement).value)}
            class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            placeholder="e.g., Chicken Breast, Oatmeal"
          />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700">Serving Size *</label>
            <input
              type="number"
              required
              step="0.01"
              min="0.01"
              value={servingSizeValue}
              onInput={(e) => setServingSizeValue((e.target as HTMLInputElement).value)}
              class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Unit *</label>
            <select
              value={servingSizeUnit}
              onChange={(e) => setServingSizeUnit((e.target as HTMLSelectElement).value as "g" | "ml")}
              class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="g">grams (g)</option>
              <option value="ml">milliliters (ml)</option>
            </select>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700">UPC Code (optional)</label>
          <input
            type="text"
            value={upcCode}
            onInput={(e) => setUpcCode((e.target as HTMLInputElement).value)}
            class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            placeholder="Barcode number"
          />
        </div>
      </div>

      <div class="bg-white shadow rounded-lg p-6 space-y-4">
        <h3 class="text-lg font-medium text-gray-900">Nutrition Facts</h3>

        <div>
          <label class="block text-sm font-medium text-gray-700">Calories *</label>
          <input
            type="number"
            required
            step="0.1"
            min="0"
            value={calories}
            onInput={(e) => setCalories((e.target as HTMLInputElement).value)}
            class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700">Protein (g)</label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={protein}
              onInput={(e) => setProtein((e.target as HTMLInputElement).value)}
              class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Carbohydrates (g)</label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={carbohydrates}
              onInput={(e) => setCarbohydrates((e.target as HTMLInputElement).value)}
              class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700">Total Fat (g)</label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={totalFat}
              onInput={(e) => setTotalFat((e.target as HTMLInputElement).value)}
              class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Fiber (g)</label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={fiber}
              onInput={(e) => setFiber((e.target as HTMLInputElement).value)}
              class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700">Sugars (g)</label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={sugars}
              onInput={(e) => setSugars((e.target as HTMLInputElement).value)}
              class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Sodium (mg)</label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={sodium}
              onInput={(e) => setSodium((e.target as HTMLInputElement).value)}
              class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700">Cholesterol (mg)</label>
          <input
            type="number"
            step="0.1"
            min="0"
            value={cholesterol}
            onInput={(e) => setCholesterol((e.target as HTMLInputElement).value)}
            class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        class="w-full px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Saving..." : "Save Food"}
      </button>
    </form>
  );
}
