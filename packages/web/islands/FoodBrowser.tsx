import { useState, useEffect, useCallback, useRef } from "preact/hooks";
import type { NutritionRecord, NutritionRecordWithSource } from "@nutrition-llama/shared";
import type { OffSearchResult } from "../utils/openfoodfacts.ts";

type Tab = "user" | "system" | "community" | "off";

interface FoodBrowserProps {
  initialFoods: NutritionRecord[];
}

export default function FoodBrowser({ initialFoods }: FoodBrowserProps) {
  const [tab, setTab] = useState<Tab>("user");
  const [searchQuery, setSearchQuery] = useState("");

  const [systemResults, setSystemResults] = useState<NutritionRecordWithSource[]>([]);
  const [systemLoading, setSystemLoading] = useState(false);
  const [systemCount, setSystemCount] = useState(0);

  const [communityResults, setCommunityResults] = useState<NutritionRecordWithSource[]>([]);
  const [communityLoading, setCommunityLoading] = useState(false);
  const [communityCount, setCommunityCount] = useState(0);

  const [offResults, setOffResults] = useState<OffSearchResult[]>([]);
  const [offLoading, setOffLoading] = useState(false);
  const [savingBarcode, setSavingBarcode] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

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

  const searchCommunityFoods = useCallback(async (q: string) => {
    if (q.length < 2) {
      setCommunityResults([]);
      return;
    }
    setCommunityLoading(true);
    try {
      const params = new URLSearchParams({ q, source: "community", limit: "30" });
      const response = await fetch(`/api/foods/search?${params}`);
      if (response.ok) {
        const data = await response.json();
        setCommunityResults(data.results);
        setCommunityCount(data.counts.community);
      }
    } catch (err) {
      console.error("Community food search error:", err);
    } finally {
      setCommunityLoading(false);
    }
  }, []);

  const searchOffFoods = useCallback(async (q: string) => {
    if (q.length < 2) {
      setOffResults([]);
      return;
    }
    setOffLoading(true);
    try {
      const params = new URLSearchParams({ q, limit: "20" });
      const response = await fetch(`/api/foods/off-search?${params}`);
      if (response.ok) {
        const data = await response.json();
        setOffResults(data.results);
      }
    } catch (err) {
      console.error("OFF search error:", err);
    } finally {
      setOffLoading(false);
    }
  }, []);

  // Debounced search for system tab
  useEffect(() => {
    if (tab !== "system") return;
    if (debounceRef.current !== null) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      searchSystemFoods(searchQuery);
    }, 300) as unknown as number;
    return () => {
      if (debounceRef.current !== null) clearTimeout(debounceRef.current);
    };
  }, [searchQuery, tab, searchSystemFoods]);

  // Debounced search for community tab
  useEffect(() => {
    if (tab !== "community") return;
    if (debounceRef.current !== null) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      searchCommunityFoods(searchQuery);
    }, 300) as unknown as number;
    return () => {
      if (debounceRef.current !== null) clearTimeout(debounceRef.current);
    };
  }, [searchQuery, tab, searchCommunityFoods]);

  // Debounced search for OFF tab
  useEffect(() => {
    if (tab !== "off") return;
    if (debounceRef.current !== null) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      searchOffFoods(searchQuery);
    }, 300) as unknown as number;
    return () => {
      if (debounceRef.current !== null) clearTimeout(debounceRef.current);
    };
  }, [searchQuery, tab, searchOffFoods]);

  // Fetch system and community counts on mount
  useEffect(() => {
    (async () => {
      try {
        const params = new URLSearchParams({ q: "", source: "system", limit: "1" });
        const response = await fetch(`/api/foods/search?${params}`);
        if (response.ok) {
          const data = await response.json();
          setSystemCount(data.counts.system);
          setCommunityCount(data.counts.community);
        }
      } catch {
        // ignore
      }
    })();
  }, []);

  const saveOffFood = useCallback(async (result: OffSearchResult) => {
    setSavingBarcode(result.barcode);
    setSaveError(null);
    try {
      const response = await fetch("/api/foods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.food),
      });
      if (!response.ok) {
        const data = await response.json();
        setSaveError(data.error || "Failed to save food");
        return;
      }
      const saved = await response.json();
      globalThis.location.href = `/foods/${saved.id}`;
    } catch (err) {
      console.error("Save OFF food error:", err);
      setSaveError("Failed to save food");
    } finally {
      setSavingBarcode(null);
    }
  }, []);

  const saveCommunityFood = useCallback(async (food: NutritionRecordWithSource) => {
    setSaveError(null);
    try {
      const response = await fetch("/api/foods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // POST handler reads only the fields it needs; extra fields like id/userId are ignored
        body: JSON.stringify({ ...food, source: "manual" }),
      });
      if (!response.ok) {
        const data = await response.json();
        setSaveError(data.error || "Failed to save food");
        return;
      }
      const saved = await response.json();
      globalThis.location.href = `/foods/${saved.id}`;
    } catch (err) {
      console.error("Save community food error:", err);
      setSaveError("Failed to save food");
    }
  }, []);

  const tabClass = (t: Tab) =>
    `px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${
      tab === t
        ? "border-primary-600 text-primary-600 bg-white"
        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
    }`;

  const placeholder: Record<Tab, string> = {
    user: "Filter your foods...",
    system: "Type to search USDA foods...",
    community: "Type to search community foods...",
    off: "Search Open Food Facts (e.g. 'Oreos', 'Big Mac')...",
  };

  return (
    <div>
      {/* Tabs */}
      <div class="flex gap-1 border-b border-gray-200 mb-4 flex-wrap">
        <button type="button" onClick={() => setTab("user")} class={tabClass("user")}>
          My Foods ({initialFoods.length})
        </button>
        <button type="button" onClick={() => setTab("system")} class={tabClass("system")}>
          USDA Foods{systemCount > 0 ? ` (${systemCount})` : ""}
        </button>
        <button type="button" onClick={() => setTab("community")} class={tabClass("community")}>
          Community{communityCount > 0 ? ` (${communityCount})` : ""}
        </button>
        <button type="button" onClick={() => setTab("off")} class={tabClass("off")}>
          Open Food Facts
        </button>
      </div>

      {/* Search */}
      <div class="mb-4">
        <input
          type="text"
          value={searchQuery}
          onInput={(e) => setSearchQuery((e.target as HTMLInputElement).value)}
          placeholder={placeholder[tab]}
          class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm"
        />
      </div>

      {/* Save error toast */}
      {saveError && (
        <div class="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm flex justify-between">
          <span>{saveError}</span>
          <button type="button" onClick={() => setSaveError(null)} class="ml-2 font-medium">✕</button>
        </div>
      )}

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
      ) : tab === "system" ? (
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
      ) : tab === "community" ? (
        /* Community tab */
        <>
          {searchQuery.length < 2 ? (
            <div class="bg-white shadow rounded-lg p-8 text-center text-gray-500">
              Type at least 2 characters to search community foods
            </div>
          ) : communityLoading ? (
            <div class="bg-white shadow rounded-lg p-8 text-center text-gray-500">
              Searching...
            </div>
          ) : communityResults.length > 0 ? (
            <div class="bg-white shadow rounded-lg overflow-hidden">
              <ul class="divide-y divide-gray-200">
                {communityResults.map((food) => (
                  <li key={food.id}>
                    <button
                      type="button"
                      onClick={() => saveCommunityFood(food)}
                      class="block w-full text-left hover:bg-gray-50 px-6 py-4"
                    >
                      <div class="flex items-center justify-between">
                        <div>
                          <div class="flex items-center gap-2">
                            <h3 class="text-lg font-medium text-gray-900">{food.name}</h3>
                            <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-100 text-purple-700">
                              Community
                            </span>
                          </div>
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
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div class="bg-white shadow rounded-lg p-8 text-center text-gray-500">
              No community foods found for "{searchQuery}"
            </div>
          )}
        </>
      ) : (
        /* Open Food Facts tab */
        <>
          {searchQuery.length < 2 ? (
            <div class="bg-white shadow rounded-lg p-8 text-center text-gray-500">
              Type at least 2 characters to search Open Food Facts
            </div>
          ) : offLoading ? (
            <div class="bg-white shadow rounded-lg p-8 text-center text-gray-500">
              Searching...
            </div>
          ) : offResults.length > 0 ? (
            <div class="bg-white shadow rounded-lg overflow-hidden">
              <ul class="divide-y divide-gray-200">
                {offResults.map((result) => (
                  <li key={result.barcode}>
                    <div class="flex items-center justify-between hover:bg-gray-50 px-6 py-4">
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2 flex-wrap">
                          <h3 class="text-lg font-medium text-gray-900 truncate">{result.productName}</h3>
                          <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-orange-100 text-orange-700 shrink-0">
                            Open Food Facts
                          </span>
                        </div>
                        <p class="text-sm text-gray-500">
                          {result.food.servingSizeValue}{result.food.servingSizeUnit} per serving
                          {result.barcode && ` | UPC: ${result.barcode}`}
                        </p>
                      </div>
                      <div class="flex items-center gap-4 ml-4 shrink-0">
                        <div class="text-right">
                          <p class="text-lg font-semibold text-gray-900">{result.food.calories} cal</p>
                          <p class="text-sm text-gray-500">
                            P: {result.food.protein || 0}g | C: {result.food.carbohydrates || 0}g | F: {result.food.totalFat || 0}g
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => saveOffFood(result)}
                          disabled={savingBarcode === result.barcode}
                          class="px-3 py-1.5 text-sm font-medium rounded-md bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {savingBarcode === result.barcode ? "Saving..." : "Save"}
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div class="bg-white shadow rounded-lg p-8 text-center text-gray-500">
              No results found for "{searchQuery}"
            </div>
          )}
        </>
      )}
    </div>
  );
}
