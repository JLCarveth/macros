import { useState, lazy, Suspense } from "preact/compat";
import type { MealType } from "@nutrition-llama/shared";

// Lazy load BarcodeScanner to prevent zxing-wasm from blocking hydration
const BarcodeScanner = lazy(() => import("./BarcodeScanner.tsx"));

interface FoodNutrition {
  calories: number;
  protein: number | null;
  carbohydrates: number | null;
  totalFat: number | null;
  fiber: number | null;
  sugars: number | null;
  sodium: number | null;
  cholesterol: number | null;
  servingSizeValue: number;
  servingSizeUnit: string;
}

interface FoodLogFormProps {
  mode: "create" | "log";
  foodId?: string;
  foodName?: string;
  initialUpc?: string | null;
  foodNutrition?: FoodNutrition;
}

export default function FoodLogForm({ mode, foodId, foodName, initialUpc, foodNutrition }: FoodLogFormProps) {
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
  const [upcCode, setUpcCode] = useState(initialUpc || "");

  // Log form state
  const [servings, setServings] = useState("1");
  const [amountUnit, setAmountUnit] = useState<"servings" | "g" | "ml">("servings");
  const [mealType, setMealType] = useState<MealType>("snack");
  const [loggedDate, setLoggedDate] = useState(new Date().toISOString().split("T")[0]);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);

  // Helper function to calculate servings based on selected unit
  const calculateServings = (): number => {
    const amount = parseFloat(servings) || 0;
    if (amountUnit === "servings") {
      return amount;
    }
    // Convert weight to servings
    if (!foodNutrition?.servingSizeValue || foodNutrition.servingSizeValue === 0) {
      return amount; // Fallback
    }
    return amount / foodNutrition.servingSizeValue;
  };

  // Handle unit change with value conversion for better UX
  const handleUnitChange = (newUnit: "servings" | "g" | "ml") => {
    const currentAmount = parseFloat(servings) || 1;
    const currentServings = amountUnit === "servings"
      ? currentAmount
      : currentAmount / (foodNutrition?.servingSizeValue || 1);

    let newAmount: number;
    if (newUnit === "servings") {
      newAmount = currentServings;
    } else {
      newAmount = currentServings * (foodNutrition?.servingSizeValue || 1);
    }

    setServings(newAmount.toFixed(2));
    setAmountUnit(newUnit);
  };

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
          servings: calculateServings(),
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
    const s = calculateServings();

    return (
      <form onSubmit={handleLogFood} class="space-y-4">
        {error && (
          <div class="rounded-md bg-red-50 p-4">
            <p class="text-sm text-red-700">{error}</p>
          </div>
        )}

        {foodNutrition && (
          <div class="border border-gray-300 rounded-lg p-4">
            <h4 class="text-base font-bold text-gray-900 border-b-8 border-gray-900 pb-1 mb-2">
              Nutrition Facts
            </h4>
            <p class="text-sm text-gray-500 border-b border-gray-300 pb-2 mb-2">
              {s !== 1 ? `${s.toFixed(2)} servings` : "1 serving"}{" "}
              ({Math.round(s * foodNutrition.servingSizeValue)}{foodNutrition.servingSizeUnit})
            </p>
            <div class="text-sm space-y-1">
              <div class="flex justify-between font-bold border-b-4 border-gray-900 pb-1">
                <span>Calories</span>
                <span>{Math.round(foodNutrition.calories * s)}</span>
              </div>
              <div class="flex justify-between border-b border-gray-200 py-0.5">
                <span class="font-semibold">Total Fat</span>
                <span>{Math.round((foodNutrition.totalFat || 0) * s)}g</span>
              </div>
              <div class="flex justify-between border-b border-gray-200 py-0.5">
                <span class="font-semibold">Cholesterol</span>
                <span>{Math.round((foodNutrition.cholesterol || 0) * s)}mg</span>
              </div>
              <div class="flex justify-between border-b border-gray-200 py-0.5">
                <span class="font-semibold">Sodium</span>
                <span>{Math.round((foodNutrition.sodium || 0) * s)}mg</span>
              </div>
              <div class="flex justify-between border-b border-gray-200 py-0.5">
                <span class="font-semibold">Total Carbohydrates</span>
                <span>{Math.round((foodNutrition.carbohydrates || 0) * s)}g</span>
              </div>
              <div class="flex justify-between pl-4 border-b border-gray-200 py-0.5">
                <span>Fiber</span>
                <span>{Math.round((foodNutrition.fiber || 0) * s)}g</span>
              </div>
              <div class="flex justify-between pl-4 border-b border-gray-200 py-0.5">
                <span>Sugars</span>
                <span>{Math.round((foodNutrition.sugars || 0) * s)}g</span>
              </div>
              <div class="flex justify-between border-b-4 border-gray-900 py-0.5">
                <span class="font-semibold">Protein</span>
                <span>{Math.round((foodNutrition.protein || 0) * s)}g</span>
              </div>
            </div>
          </div>
        )}

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700">Amount</label>
            <input
              type="number"
              step={amountUnit === "servings" ? "0.25" : "any"}
              min={amountUnit === "servings" ? "0.25" : "0.01"}
              value={servings}
              onInput={(e) => setServings((e.target as HTMLInputElement).value)}
              class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
            {amountUnit !== "servings" && (
              <p class="text-xs text-gray-500 mt-1">
                = {calculateServings().toFixed(2)} servings
              </p>
            )}
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700">Unit</label>
            <select
              value={amountUnit}
              onChange={(e) => handleUnitChange((e.target as HTMLSelectElement).value as "servings" | "g" | "ml")}
              class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="servings">servings</option>
              {foodNutrition && foodNutrition.servingSizeValue > 0 && (
                <option value={foodNutrition.servingSizeUnit}>
                  {foodNutrition.servingSizeUnit === "g" ? "grams (g)" : "milliliters (ml)"}
                </option>
              )}
            </select>
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
          <div class="mt-1 flex rounded-md shadow-sm">
            <input
              type="text"
              value={upcCode}
              onInput={(e) => setUpcCode((e.target as HTMLInputElement).value)}
              class="flex-1 block w-full px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              placeholder="Barcode number"
            />
            <button
              type="button"
              onClick={() => setShowBarcodeScanner(true)}
              class="inline-flex items-center px-3 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              title="Scan barcode"
            >
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
            </button>
          </div>
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

      {/* Barcode Scanner Modal */}
      {showBarcodeScanner && (
        <Suspense fallback={<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/80"><div class="text-white">Loading scanner...</div></div>}>
          <BarcodeScanner
            onScan={(code) => {
              setUpcCode(code);
              setShowBarcodeScanner(false);
            }}
            onClose={() => setShowBarcodeScanner(false)}
          />
        </Suspense>
      )}
    </form>
  );
}
