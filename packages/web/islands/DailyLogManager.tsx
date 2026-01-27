import { useState, useEffect } from "preact/hooks";
import type { DailySummary, MealType, NutritionRecordWithSource, FoodLogEntryWithNutrition } from "@nutrition-llama/shared";
import FoodSearch from "./FoodSearch.tsx";

interface DailyLogManagerProps {
  date: string;
  initialSummary: DailySummary | null;
}

// Calculate calories from macros: protein=4cal/g, carbs=4cal/g, fat=9cal/g
function calculateCaloriesFromMacros(protein: number, carbs: number, fat: number): number {
  return Math.round(protein * 4 + carbs * 4 + fat * 9);
}

export default function DailyLogManager({ date, initialSummary }: DailyLogManagerProps) {
  const [summary, setSummary] = useState<DailySummary | null>(initialSummary);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedFood, setSelectedFood] = useState<NutritionRecordWithSource | null>(null);
  const [servings, setServings] = useState("1");
  const [mealType, setMealType] = useState<MealType>("snack");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editingEntry, setEditingEntry] = useState<string | null>(null);
  const [editServings, setEditServings] = useState("");
  const [editMealType, setEditMealType] = useState<MealType>("snack");

  // Quick entry mode state
  const [entryMode, setEntryMode] = useState<"food" | "quick">("food");
  const [quickProtein, setQuickProtein] = useState("");
  const [quickCarbs, setQuickCarbs] = useState("");
  const [quickFat, setQuickFat] = useState("");
  const [quickName, setQuickName] = useState("");

  // Calculate calories for quick entry display
  const quickCalories = calculateCaloriesFromMacros(
    parseFloat(quickProtein) || 0,
    parseFloat(quickCarbs) || 0,
    parseFloat(quickFat) || 0
  );

  const refreshSummary = async () => {
    try {
      const response = await fetch(`/api/log/daily?date=${date}`);
      if (response.ok) {
        const data = await response.json();
        setSummary(data);
      }
    } catch (err) {
      console.error("Failed to refresh summary:", err);
    }
  };

  const handleAddEntry = async (e: Event) => {
    e.preventDefault();

    // Validate based on entry mode
    if (entryMode === "food" && !selectedFood) return;
    if (entryMode === "quick") {
      const protein = parseFloat(quickProtein) || 0;
      const carbs = parseFloat(quickCarbs) || 0;
      const fat = parseFloat(quickFat) || 0;
      if (protein === 0 && carbs === 0 && fat === 0) {
        setError("Please enter at least one macro value");
        return;
      }
    }

    setLoading(true);
    setError("");

    try {
      let body: Record<string, unknown>;

      if (entryMode === "food") {
        body = {
          nutritionRecordId: selectedFood!.id,
          servings: parseFloat(servings),
          mealType,
          loggedDate: date,
        };
      } else {
        // Quick entry mode - send macros
        body = {
          quickMacros: {
            protein: parseFloat(quickProtein) || 0,
            carbs: parseFloat(quickCarbs) || 0,
            fat: parseFloat(quickFat) || 0,
            name: quickName.trim() || undefined,
          },
          servings: 1,
          mealType,
          loggedDate: date,
        };
      }

      const response = await fetch("/api/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to add entry");
      }

      // Reset form and refresh
      setShowAddForm(false);
      setSelectedFood(null);
      setServings("1");
      setMealType("snack");
      setQuickProtein("");
      setQuickCarbs("");
      setQuickFat("");
      setQuickName("");
      setEntryMode("food");
      await refreshSummary();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add entry");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (!confirm("Remove this entry from your log?")) return;

    try {
      const response = await fetch(`/api/log/${entryId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete entry");
      }

      await refreshSummary();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete entry");
    }
  };

  const startEditEntry = (entry: FoodLogEntryWithNutrition) => {
    setEditingEntry(entry.id);
    setEditServings(entry.servings.toString());
    setEditMealType(entry.mealType);
  };

  const handleUpdateEntry = async (entryId: string) => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/log/${entryId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          servings: parseFloat(editServings),
          mealType: editMealType,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update entry");
      }

      setEditingEntry(null);
      await refreshSummary();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update entry");
    } finally {
      setLoading(false);
    }
  };

  const mealTypeLabel = (type: MealType) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  return (
    <div class="space-y-6">
      {error && (
        <div class="rounded-md bg-red-50 p-4">
          <p class="text-sm text-red-700">{error}</p>
          <button onClick={() => setError("")} class="text-sm text-red-600 underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Summary Cards */}
      {summary && (
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="bg-white shadow rounded-lg p-4 text-center">
            <p class="text-2xl font-bold text-gray-900">{Math.round(summary.totalCalories)}</p>
            <p class="text-sm text-gray-500">Calories</p>
          </div>
          <div class="bg-red-50 shadow rounded-lg p-4 text-center">
            <p class="text-2xl font-bold text-red-600">{Math.round(summary.totalProtein)}g</p>
            <p class="text-sm text-gray-500">Protein</p>
          </div>
          <div class="bg-yellow-50 shadow rounded-lg p-4 text-center">
            <p class="text-2xl font-bold text-yellow-600">{Math.round(summary.totalCarbohydrates)}g</p>
            <p class="text-sm text-gray-500">Carbs</p>
          </div>
          <div class="bg-blue-50 shadow rounded-lg p-4 text-center">
            <p class="text-2xl font-bold text-blue-600">{Math.round(summary.totalFat)}g</p>
            <p class="text-sm text-gray-500">Fat</p>
          </div>
        </div>
      )}

      {/* Add Entry Button / Form */}
      <div class="bg-white shadow rounded-lg p-6">
        {!showAddForm ? (
          <button
            onClick={() => setShowAddForm(true)}
            class="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-primary-400 hover:text-primary-600 transition-colors"
          >
            + Add Food to Log
          </button>
        ) : (
          <form onSubmit={handleAddEntry} class="space-y-4">
            <h3 class="text-lg font-medium text-gray-900">Add Food to Log</h3>

            {/* Entry Mode Toggle */}
            <div class="flex rounded-md shadow-sm">
              <button
                type="button"
                onClick={() => setEntryMode("food")}
                class={`flex-1 px-4 py-2 text-sm font-medium rounded-l-md border ${
                  entryMode === "food"
                    ? "bg-primary-600 text-white border-primary-600"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                }`}
              >
                Select Food
              </button>
              <button
                type="button"
                onClick={() => setEntryMode("quick")}
                class={`flex-1 px-4 py-2 text-sm font-medium rounded-r-md border-t border-r border-b ${
                  entryMode === "quick"
                    ? "bg-primary-600 text-white border-primary-600"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                }`}
              >
                Quick Macros
              </button>
            </div>

            {entryMode === "food" ? (
              /* Food Selection Mode */
              <>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Search Food</label>
                  {selectedFood ? (
                    <div class="flex items-center gap-2 p-2 bg-gray-50 border border-gray-200 rounded-md">
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-1.5">
                          <span class="text-sm font-medium text-gray-900 truncate">{selectedFood.name}</span>
                          {selectedFood.isSystem && (
                            <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-700">
                              USDA
                            </span>
                          )}
                        </div>
                        <span class="text-xs text-gray-500">
                          {selectedFood.calories} cal per {selectedFood.servingSizeValue}{selectedFood.servingSizeUnit}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedFood(null)}
                        class="p-1 text-gray-400 hover:text-gray-600"
                        title="Clear selection"
                      >
                        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <FoodSearch
                      onSelect={(food) => setSelectedFood(food)}
                      placeholder="Search your foods or USDA database..."
                    />
                  )}
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700">
                      Servings
                      {selectedFood && (
                        <span class="font-normal text-gray-400">
                          {" "}({selectedFood.servingSizeValue}{selectedFood.servingSizeUnit} each)
                        </span>
                      )}
                    </label>
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
              </>
            ) : (
              /* Quick Macros Entry Mode */
              <>
                <div>
                  <label class="block text-sm font-medium text-gray-700">Name (optional)</label>
                  <input
                    type="text"
                    value={quickName}
                    onInput={(e) => setQuickName((e.target as HTMLInputElement).value)}
                    placeholder="Quick Entry"
                    class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div class="grid grid-cols-3 gap-3">
                  <div>
                    <label class="block text-sm font-medium text-red-600">Protein (g)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={quickProtein}
                      onInput={(e) => setQuickProtein((e.target as HTMLInputElement).value)}
                      placeholder="0"
                      class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-yellow-600">Carbs (g)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={quickCarbs}
                      onInput={(e) => setQuickCarbs((e.target as HTMLInputElement).value)}
                      placeholder="0"
                      class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-blue-600">Fat (g)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={quickFat}
                      onInput={(e) => setQuickFat((e.target as HTMLInputElement).value)}
                      placeholder="0"
                      class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Calculated Calories Display */}
                <div class="bg-gray-50 rounded-lg p-3 text-center">
                  <p class="text-sm text-gray-500">Calculated Calories</p>
                  <p class="text-2xl font-bold text-gray-900">{quickCalories}</p>
                  <p class="text-xs text-gray-400 mt-1">
                    P×4 + C×4 + F×9
                  </p>
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
              </>
            )}

            <div class="flex gap-3">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                class="flex-1 px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || (entryMode === "food" && !selectedFood)}
                class="flex-1 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
              >
                {loading ? "Adding..." : "Add to Log"}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Log Entries */}
      <div class="bg-white shadow rounded-lg overflow-hidden">
        <h3 class="text-lg font-medium text-gray-900 p-6 pb-0">Food Log</h3>

        {summary && summary.entries.length > 0 ? (
          <ul class="divide-y divide-gray-200 mt-4">
            {summary.entries.map((entry) => (
              <li key={entry.id} class="px-6 py-4">
                {editingEntry === entry.id ? (
                  <div class="space-y-3">
                    <div class="grid grid-cols-2 gap-3">
                      <div>
                        <label class="block text-xs text-gray-500">Servings</label>
                        <input
                          type="number"
                          step="0.25"
                          min="0.25"
                          value={editServings}
                          onInput={(e) => setEditServings((e.target as HTMLInputElement).value)}
                          class="block w-full px-2 py-1 text-sm border border-gray-300 rounded"
                        />
                      </div>
                      <div>
                        <label class="block text-xs text-gray-500">Meal</label>
                        <select
                          value={editMealType}
                          onChange={(e) => setEditMealType((e.target as HTMLSelectElement).value as MealType)}
                          class="block w-full px-2 py-1 text-sm border border-gray-300 rounded"
                        >
                          <option value="breakfast">Breakfast</option>
                          <option value="lunch">Lunch</option>
                          <option value="dinner">Dinner</option>
                          <option value="snack">Snack</option>
                        </select>
                      </div>
                    </div>
                    <div class="flex gap-2">
                      <button
                        onClick={() => setEditingEntry(null)}
                        class="px-3 py-1 text-xs border border-gray-300 rounded text-gray-700"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleUpdateEntry(entry.id)}
                        disabled={loading}
                        class="px-3 py-1 text-xs bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <div class="flex items-center justify-between">
                    <div>
                      <p class="font-medium text-gray-900">{entry.nutritionRecord.name}</p>
                      <p class="text-sm text-gray-500">
                        {entry.servings} serving{entry.servings !== 1 ? "s" : ""} -{" "}
                        <span class="capitalize">{mealTypeLabel(entry.mealType)}</span>
                      </p>
                    </div>
                    <div class="flex items-center gap-4">
                      <p class="text-gray-600 font-medium">
                        {Math.round(entry.nutritionRecord.calories * entry.servings)} cal
                      </p>
                      <div class="flex gap-1">
                        <button
                          onClick={() => startEditEntry(entry)}
                          class="p-1 text-gray-400 hover:text-primary-600"
                          title="Edit"
                        >
                          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteEntry(entry.id)}
                          class="p-1 text-gray-400 hover:text-red-600"
                          title="Delete"
                        >
                          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <div class="p-6 text-center text-gray-500">
            <p>No foods logged for this day</p>
          </div>
        )}
      </div>
    </div>
  );
}
