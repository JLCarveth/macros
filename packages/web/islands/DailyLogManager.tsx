import { useState, useEffect } from "preact/hooks";
import type { DailySummary, MealType, NutritionRecordWithSource, FoodLogEntryWithNutrition } from "@nutrition-llama/shared";
import FoodSearch from "./FoodSearch.tsx";
import { trackEvent } from "../utils/analytics.ts";

interface DailyLogManagerProps {
  date: string;
  initialSummary: DailySummary | null;
}

// Calculate calories from macros: protein=4cal/g, carbs=4cal/g, fat=9cal/g
function calculateCaloriesFromMacros(protein: number, carbs: number, fat: number): number {
  return Math.round(protein * 4 + carbs * 4 + fat * 9);
}

// Meal type configuration with branding colors
const MEAL_CONFIG = {
  breakfast: {
    label: "Breakfast",
    color: "amber",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    textColor: "text-amber-700",
    iconColor: "text-amber-600",
  },
  lunch: {
    label: "Lunch",
    color: "blue",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    textColor: "text-blue-700",
    iconColor: "text-blue-600",
  },
  dinner: {
    label: "Dinner",
    color: "purple",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
    textColor: "text-purple-700",
    iconColor: "text-purple-600",
  },
  snack: {
    label: "Snacks",
    color: "green",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    textColor: "text-green-700",
    iconColor: "text-green-600",
  },
} as const;

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

  // Nutrient details collapse state
  const [showNutrientDetails, setShowNutrientDetails] = useState(false);

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
      trackEvent("Log_Food", { meal_type: mealType });
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

  // Group entries by meal type
  const groupEntriesByMeal = () => {
    if (!summary?.entries) return { breakfast: [], lunch: [], dinner: [], snack: [] };

    return summary.entries.reduce((acc, entry) => {
      if (!acc[entry.mealType]) acc[entry.mealType] = [];
      acc[entry.mealType].push(entry);
      return acc;
    }, { breakfast: [], lunch: [], dinner: [], snack: [] } as Record<MealType, FoodLogEntryWithNutrition[]>);
  };

  const entriesByMeal = groupEntriesByMeal();

  return (
    <div class="space-y-6">
      {error && (
        <div class="rounded-lg bg-red-50 border border-red-200 p-4 flex items-start gap-3">
          <svg class="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div class="flex-1">
            <p class="text-sm font-medium text-red-800">{error}</p>
          </div>
          <button
            onClick={() => setError("")}
            class="text-red-400 hover:text-red-600 transition-colors"
            title="Dismiss"
          >
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Summary Cards */}
      {summary && (
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="bg-white shadow-sm rounded-lg p-5 border border-gray-200 hover:shadow-md transition-shadow">
            <div class="flex items-center justify-between mb-2">
              <p class="text-sm font-medium text-gray-600">Calories</p>
              <svg class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <p class="text-3xl font-bold text-gray-900">{Math.round(summary.totalCalories || 0)}</p>
          </div>
          <div class="bg-gradient-to-br from-red-50 to-red-100 shadow-sm rounded-lg p-5 border border-red-200 hover:shadow-md transition-shadow">
            <div class="flex items-center justify-between mb-2">
              <p class="text-sm font-medium text-red-700">Protein</p>
              <svg class="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
              </svg>
            </div>
            <p class="text-3xl font-bold text-red-600">{Math.round(summary.totalProtein || 0)}g</p>
          </div>
          <div class="bg-gradient-to-br from-yellow-50 to-yellow-100 shadow-sm rounded-lg p-5 border border-yellow-200 hover:shadow-md transition-shadow">
            <div class="flex items-center justify-between mb-2">
              <p class="text-sm font-medium text-yellow-700">Carbs</p>
              <svg class="h-5 w-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
              </svg>
            </div>
            <p class="text-3xl font-bold text-yellow-600">{Math.round(summary.totalCarbohydrates || 0)}g</p>
          </div>
          <div class="bg-gradient-to-br from-blue-50 to-blue-100 shadow-sm rounded-lg p-5 border border-blue-200 hover:shadow-md transition-shadow">
            <div class="flex items-center justify-between mb-2">
              <p class="text-sm font-medium text-blue-700">Fat</p>
              <svg class="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p class="text-3xl font-bold text-blue-600">{Math.round(summary.totalFat || 0)}g</p>
          </div>
        </div>
      )}

      {/* Detailed Nutrient Breakdown - Collapsible */}
      {summary && (
        <div class="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
          <button
            onClick={() => setShowNutrientDetails(!showNutrientDetails)}
            class="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div class="flex items-center gap-3">
              <svg class="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <h3 class="text-base font-semibold text-gray-900">Detailed Nutrients</h3>
            </div>
            <svg
              class={`h-5 w-5 text-gray-400 transition-transform ${showNutrientDetails ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showNutrientDetails && (
            <div class="px-6 pb-6 pt-2 border-t border-gray-100">
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Fiber */}
                <div class="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                  <div class="flex items-center gap-2 mb-2">
                    <svg class="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                    </svg>
                    <p class="text-sm font-medium text-green-700">Fiber</p>
                  </div>
                  <p class="text-2xl font-bold text-green-600">{Math.round(summary.totalFiber || 0)}g</p>
                </div>

                {/* Sugars */}
                <div class="bg-gradient-to-br from-pink-50 to-pink-100 rounded-lg p-4 border border-pink-200">
                  <div class="flex items-center gap-2 mb-2">
                    <svg class="h-4 w-4 text-pink-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <p class="text-sm font-medium text-pink-700">Sugars</p>
                  </div>
                  <p class="text-2xl font-bold text-pink-600">{Math.round(summary.totalSugars || 0)}g</p>
                </div>

                {/* Sodium */}
                <div class="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
                  <div class="flex items-center gap-2 mb-2">
                    <svg class="h-4 w-4 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                    </svg>
                    <p class="text-sm font-medium text-orange-700">Sodium</p>
                  </div>
                  <p class="text-2xl font-bold text-orange-600">{Math.round(summary.totalSodium || 0)}mg</p>
                </div>

                {/* Cholesterol */}
                <div class="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg p-4 border border-indigo-200">
                  <div class="flex items-center gap-2 mb-2">
                    <svg class="h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    <p class="text-sm font-medium text-indigo-700">Cholesterol</p>
                  </div>
                  <p class="text-2xl font-bold text-indigo-600">{Math.round(summary.totalCholesterol || 0)}mg</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Entry Button / Form */}
      <div class="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        {!showAddForm ? (
          <button
            onClick={() => setShowAddForm(true)}
            class="w-full py-4 px-6 border-2 border-dashed border-gray-300 rounded-lg text-gray-700 hover:border-primary-500 hover:bg-primary-50 hover:text-primary-700 transition-all duration-200 font-medium flex items-center justify-center gap-2 group"
          >
            <svg class="h-5 w-5 text-gray-400 group-hover:text-primary-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Log Food
          </button>
        ) : (
          <form onSubmit={handleAddEntry} class="p-6 space-y-5">
            <div class="flex items-center justify-between">
              <h3 class="text-xl font-semibold text-gray-900">Log Food</h3>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                class="text-gray-400 hover:text-gray-600 transition-colors"
                title="Close"
              >
                <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Entry Mode Toggle */}
            <div class="flex gap-2 p-1 bg-gray-100 rounded-lg">
              <button
                type="button"
                onClick={() => setEntryMode("food")}
                class={`flex-1 px-4 py-2.5 text-sm font-medium rounded-md transition-all ${
                  entryMode === "food"
                    ? "bg-white text-primary-700 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <div class="flex items-center justify-center gap-2">
                  <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Select Food
                </div>
              </button>
              <button
                type="button"
                onClick={() => setEntryMode("quick")}
                class={`flex-1 px-4 py-2.5 text-sm font-medium rounded-md transition-all ${
                  entryMode === "quick"
                    ? "bg-white text-primary-700 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <div class="flex items-center justify-center gap-2">
                  <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Quick Macros
                </div>
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
                          {selectedFood.calories || 0} cal per {selectedFood.servingSizeValue}{selectedFood.servingSizeUnit}
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
                <div class="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200">
                  <div class="flex items-center justify-center gap-2 mb-2">
                    <svg class="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <p class="text-sm font-medium text-gray-700">Calculated Calories</p>
                  </div>
                  <p class="text-3xl font-bold text-gray-900 text-center">{quickCalories}</p>
                  <p class="text-xs text-gray-500 text-center mt-2">
                    Protein×4 + Carbs×4 + Fat×9
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

            <button
              type="submit"
              disabled={loading || (entryMode === "food" && !selectedFood)}
              class="w-full px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm hover:shadow-md"
            >
              {loading ? (
                <div class="flex items-center justify-center gap-2">
                  <svg class="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Adding...
                </div>
              ) : (
                <div class="flex items-center justify-center gap-2">
                  <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                  </svg>
                  Add to Log
                </div>
              )}
            </button>
          </form>
        )}
      </div>

      {/* Log Entries - Grouped by Meal */}
      <div class="space-y-4">
        <h2 class="text-2xl font-bold text-gray-900">Today's Food Log</h2>

        {(["breakfast", "lunch", "dinner", "snack"] as MealType[]).map((mealType) => {
          const mealEntries = entriesByMeal[mealType];
          const config = MEAL_CONFIG[mealType];
          const mealCalories = mealEntries.reduce((sum, entry) =>
            sum + ((entry.nutritionRecord.calories || 0) * entry.servings), 0
          );

          return (
            <div key={mealType} class={`bg-white shadow-sm rounded-lg border-l-4 ${config.borderColor} overflow-hidden`}>
              {/* Meal Header */}
              <div class={`${config.bgColor} px-6 py-3 border-b ${config.borderColor}`}>
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <div class={`w-2 h-2 rounded-full ${config.textColor.replace('text-', 'bg-')}`}></div>
                    <h3 class={`text-lg font-semibold ${config.textColor}`}>{config.label}</h3>
                  </div>
                  {mealEntries.length > 0 && (
                    <div class="text-right">
                      <p class={`text-sm font-medium ${config.textColor}`}>
                        {Math.round(mealCalories)} calories
                      </p>
                      <p class="text-xs text-gray-500">
                        {mealEntries.length} item{mealEntries.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Meal Entries */}
              {mealEntries.length > 0 ? (
                <ul class="divide-y divide-gray-100">
                  {mealEntries.map((entry) => (
                    <li key={entry.id} class="px-6 py-4 hover:bg-gray-50 transition-colors">
                      {editingEntry === entry.id ? (
                        <div class="space-y-3">
                          <div class="grid grid-cols-2 gap-3">
                            <div>
                              <label class="block text-xs font-medium text-gray-700 mb-1">Servings</label>
                              <input
                                type="number"
                                step="0.25"
                                min="0.25"
                                value={editServings}
                                onInput={(e) => setEditServings((e.target as HTMLInputElement).value)}
                                class="block w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                              />
                            </div>
                            <div>
                              <label class="block text-xs font-medium text-gray-700 mb-1">Meal</label>
                              <select
                                value={editMealType}
                                onChange={(e) => setEditMealType((e.target as HTMLSelectElement).value as MealType)}
                                class="block w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                              >
                                <option value="breakfast">Breakfast</option>
                                <option value="lunch">Lunch</option>
                                <option value="dinner">Dinner</option>
                                <option value="snack">Snacks</option>
                              </select>
                            </div>
                          </div>
                          <div class="flex gap-2">
                            <button
                              onClick={() => setEditingEntry(null)}
                              class="px-4 py-2 text-sm font-medium border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleUpdateEntry(entry.id)}
                              disabled={loading}
                              class="px-4 py-2 text-sm font-medium bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 transition-colors"
                            >
                              {loading ? "Saving..." : "Save Changes"}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div class="flex items-start justify-between gap-4">
                          <div class="flex-1 min-w-0">
                            <p class="font-medium text-gray-900">{entry.nutritionRecord.name}</p>
                            <div class="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                              <p class="text-sm text-gray-600">
                                {entry.servings} serving{entry.servings !== 1 ? "s" : ""}
                              </p>
                              <div class="flex gap-3 text-xs text-gray-500">
                                <span class="text-red-600 font-medium">
                                  P: {Math.round((entry.nutritionRecord.protein || 0) * entry.servings)}g
                                </span>
                                <span class="text-yellow-600 font-medium">
                                  C: {Math.round((entry.nutritionRecord.carbohydrates || 0) * entry.servings)}g
                                </span>
                                <span class="text-blue-600 font-medium">
                                  F: {Math.round((entry.nutritionRecord.fat || 0) * entry.servings)}g
                                </span>
                              </div>
                            </div>
                          </div>
                          <div class="flex items-center gap-3">
                            <p class="text-base font-semibold text-gray-900 whitespace-nowrap">
                              {Math.round((entry.nutritionRecord.calories || 0) * entry.servings)} cal
                            </p>
                            <div class="flex gap-1">
                              <button
                                onClick={() => startEditEntry(entry)}
                                class="p-2 text-gray-400 hover:text-primary-600 rounded-md hover:bg-primary-50 transition-colors"
                                title="Edit entry"
                              >
                                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDeleteEntry(entry.id)}
                                class="p-2 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors"
                                title="Remove entry"
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
                <div class="px-6 py-8 text-center">
                  <p class="text-sm text-gray-500">No {config.label.toLowerCase()} logged yet</p>
                  <button
                    onClick={() => {
                      setShowAddForm(true);
                      setMealType(mealType);
                    }}
                    class={`mt-2 text-sm font-medium ${config.textColor} hover:underline`}
                  >
                    Add {config.label.toLowerCase()}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
