import { useState, useEffect } from "preact/hooks";
import type { DailySummary, MealType, NutritionRecord, FoodLogEntryWithNutrition } from "@nutrition-llama/shared";

interface DailyLogManagerProps {
  date: string;
  initialSummary: DailySummary | null;
}

export default function DailyLogManager({ date, initialSummary }: DailyLogManagerProps) {
  const [summary, setSummary] = useState<DailySummary | null>(initialSummary);
  const [foods, setFoods] = useState<NutritionRecord[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedFoodId, setSelectedFoodId] = useState("");
  const [servings, setServings] = useState("1");
  const [mealType, setMealType] = useState<MealType>("snack");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editingEntry, setEditingEntry] = useState<string | null>(null);
  const [editServings, setEditServings] = useState("");
  const [editMealType, setEditMealType] = useState<MealType>("snack");

  // Load user's foods when add form is opened
  useEffect(() => {
    if (showAddForm && foods.length === 0) {
      loadFoods();
    }
  }, [showAddForm]);

  const loadFoods = async () => {
    try {
      const response = await fetch("/api/foods");
      if (response.ok) {
        const data = await response.json();
        setFoods(data);
      }
    } catch (err) {
      console.error("Failed to load foods:", err);
    }
  };

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
    if (!selectedFoodId) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nutritionRecordId: selectedFoodId,
          servings: parseFloat(servings),
          mealType,
          loggedDate: date,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to add entry");
      }

      // Reset form and refresh
      setShowAddForm(false);
      setSelectedFoodId("");
      setServings("1");
      setMealType("snack");
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

            <div>
              <label class="block text-sm font-medium text-gray-700">Select Food</label>
              <select
                value={selectedFoodId}
                onChange={(e) => setSelectedFoodId((e.target as HTMLSelectElement).value)}
                required
                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Choose a food...</option>
                {foods.map((food) => (
                  <option key={food.id} value={food.id}>
                    {food.name} ({food.calories} cal per serving)
                  </option>
                ))}
              </select>
              {foods.length === 0 && (
                <p class="mt-2 text-sm text-gray-500">
                  No saved foods.{" "}
                  <a href="/foods/new" class="text-primary-600 hover:underline">
                    Add a food first
                  </a>
                </p>
              )}
            </div>

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
                disabled={loading || !selectedFoodId}
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
