import { useState, useEffect, useCallback, useRef } from "preact/hooks";
import type { NutritionRecord, NutritionRecordWithSource } from "@nutrition-llama/shared";

type Tab = "user" | "system";

interface FoodBrowserProps {
  initialFoods: NutritionRecord[];
}

export default function FoodBrowser({ initialFoods }: FoodBrowserProps) {
  const [tab, setTab] = useState<Tab>("user");
  const [searchQuery, setSearchQuery] = useState("");
  const [systemResults, setSystemResults] = useState<NutritionRecordWithSource[]>([]);
  const [systemLoading, setSystemLoading] = useState(false);
  const [systemCount, setSystemCount] = useState(0);
  const debounceRef = useRef<number | null>(null);

  // Filter user foods client-side
  const filteredUserFoods = searchQuery
    ? initialFoods.filter((f) =>
        f.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : initialFoods;

  const searchSystemFoods = useCallback(async (q: string) => {
    if (q.length < 2) {
      setSystemResults([]);
      return;
    }
    setSystemLoading(true);
    try {
      const params = new URLSearchParams({ q, source: "system", limit: "30" });
      const response = await fetch(`/api/foods/search?${params}`);
      if (response.ok) {
        const data = await response.json();
        setSystemResults(data.results);
        setSystemCount(data.counts.system);
      }
    } catch (err) {
      console.error("System food search error:", err);
    } finally {
      setSystemLoading(false);
    }
  }, []);

  // Debounced search for system tab
  useEffect(() => {
    if (tab !== "system") return;

    if (debounceRef.current !== null) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      searchSystemFoods(searchQuery);
    }, 300) as unknown as number;

    return () => {
      if (debounceRef.current !== null) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchQuery, tab, searchSystemFoods]);

  // Fetch system count on mount
  useEffect(() => {
    (async () => {
      try {
        const params = new URLSearchParams({ q: "", source: "system", limit: "1" });
        const response = await fetch(`/api/foods/search?${params}`);
        if (response.ok) {
          const data = await response.json();
          setSystemCount(data.counts.system);
        }
      } catch {
        // ignore
      }
    })();
  }, []);

  const tabClass = (t: Tab) =>
    `px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${
      tab === t
        ? "border-primary-600 text-primary-600 bg-white"
        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
    }`;

  return (
    <div>
      {/* Tabs */}
      <div class="flex gap-1 border-b border-gray-200 mb-4">
        <button type="button" onClick={() => setTab("user")} class={tabClass("user")}>
          My Foods ({initialFoods.length})
        </button>
        <button type="button" onClick={() => setTab("system")} class={tabClass("system")}>
          USDA Foods{systemCount > 0 ? ` (${systemCount})` : ""}
        </button>
      </div>

      {/* Search */}
      <div class="mb-4">
        <input
          type="text"
          value={searchQuery}
          onInput={(e) => setSearchQuery((e.target as HTMLInputElement).value)}
          placeholder={tab === "system" ? "Type to search USDA foods..." : "Filter your foods..."}
          class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm"
        />
      </div>

      {/* Results */}
      {tab === "user" ? (
        filteredUserFoods.length > 0 ? (
          <div class="bg-white shadow rounded-lg overflow-hidden">
            <ul class="divide-y divide-gray-200">
              {filteredUserFoods.map((food) => (
                <li key={food.id}>
                  <a
                    href={`/foods/${food.id}`}
                    class="block hover:bg-gray-50 px-6 py-4"
                  >
                    <div class="flex items-center justify-between">
                      <div>
                        <h3 class="text-lg font-medium text-gray-900">{food.name}</h3>
                        <p class="text-sm text-gray-500">
                          {food.servingSizeValue}{food.servingSizeUnit} per serving
                          {food.upcCode && ` | UPC: ${food.upcCode}`}
                        </p>
                      </div>
                      <div class="text-right">
                        <p class="text-lg font-semibold text-gray-900">{food.calories} cal</p>
                        <p class="text-sm text-gray-500">
                          P: {food.protein || 0}g | C: {food.carbohydrates || 0}g | F: {food.totalFat || 0}g
                        </p>
                      </div>
                    </div>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div class="bg-white shadow rounded-lg p-8 text-center text-gray-500">
            {searchQuery ? "No matching foods found" : "No foods saved yet"}
          </div>
        )
      ) : (
        /* System / USDA tab */
        <>
          {searchQuery.length < 2 ? (
            <div class="bg-white shadow rounded-lg p-8 text-center text-gray-500">
              Type at least 2 characters to search USDA Foundation Foods
            </div>
          ) : systemLoading ? (
            <div class="bg-white shadow rounded-lg p-8 text-center text-gray-500">
              Searching...
            </div>
          ) : systemResults.length > 0 ? (
            <div class="bg-white shadow rounded-lg overflow-hidden">
              <ul class="divide-y divide-gray-200">
                {systemResults.map((food) => (
                  <li key={food.id}>
                    <a
                      href={`/foods/${food.id}`}
                      class="block hover:bg-gray-50 px-6 py-4"
                    >
                      <div class="flex items-center justify-between">
                        <div>
                          <div class="flex items-center gap-2">
                            <h3 class="text-lg font-medium text-gray-900">{food.name}</h3>
                            <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-700">
                              USDA
                            </span>
                          </div>
                          <p class="text-sm text-gray-500">
                            {food.servingSizeValue}{food.servingSizeUnit} per serving
                          </p>
                        </div>
                        <div class="text-right">
                          <p class="text-lg font-semibold text-gray-900">{food.calories} cal</p>
                          <p class="text-sm text-gray-500">
                            P: {food.protein || 0}g | C: {food.carbohydrates || 0}g | F: {food.totalFat || 0}g
                          </p>
                        </div>
                      </div>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div class="bg-white shadow rounded-lg p-8 text-center text-gray-500">
              No USDA foods found for "{searchQuery}"
            </div>
          )}
        </>
      )}
    </div>
  );
}
