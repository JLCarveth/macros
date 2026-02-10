import { useState, useEffect, lazy, Suspense } from "preact/compat";
import type { NutritionRecord } from "@nutrition-llama/shared";
import FoodLogForm from "./FoodLogForm.tsx";

// Lazy load BarcodeScanner to prevent zxing-wasm from blocking hydration
const BarcodeScanner = lazy(() => import("./BarcodeScanner.tsx"));

type LookupState = "idle" | "scanning" | "loading" | "found" | "not_found";

interface UpcLookupProps {
  initialCode: string | null;
}

export default function UpcLookup({ initialCode }: UpcLookupProps) {
  const [state, setState] = useState<LookupState>("idle");
  const [upcCode, setUpcCode] = useState(initialCode || "");
  const [food, setFood] = useState<NutritionRecord | null>(null);
  const [error, setError] = useState("");
  const [lastSearchedCode, setLastSearchedCode] = useState("");

  // Auto-lookup if initialCode is provided
  useEffect(() => {
    if (initialCode) {
      lookupUpc(initialCode);
    }
  }, []);

  const lookupUpc = async (code: string) => {
    if (!code.trim()) {
      setError("Please enter a UPC code");
      return;
    }

    setState("loading");
    setError("");
    setLastSearchedCode(code.trim());

    try {
      const response = await fetch(`/api/foods/upc/${encodeURIComponent(code.trim())}`);

      if (response.status === 404) {
        setState("not_found");
        return;
      }

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to lookup food");
      }

      const foodData = await response.json();
      setFood(foodData);
      setState("found");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to lookup food");
      setState("idle");
    }
  };

  const handleScan = (code: string) => {
    setUpcCode(code);
    setState("idle");
    lookupUpc(code);
  };

  const reset = () => {
    setState("idle");
    setFood(null);
    setUpcCode("");
    setError("");
    setLastSearchedCode("");
  };

  return (
    <div class="space-y-6">
      {error && (
        <div class="rounded-md bg-red-50 p-4">
          <p class="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Idle State */}
      {state === "idle" && (
        <div class="space-y-6">
          <div class="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
            <p class="mt-4 text-gray-600">Scan or enter a barcode to find a saved food</p>
            <button
              onClick={() => setState("scanning")}
              class="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
            >
              <svg class="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
              Scan Barcode
            </button>
          </div>

          {/* Manual Entry */}
          <div class="bg-white shadow rounded-lg p-6">
            <h3 class="text-sm font-medium text-gray-700 mb-3">Or enter UPC manually</h3>
            <div class="flex gap-3">
              <input
                type="text"
                value={upcCode}
                onInput={(e) => setUpcCode((e.target as HTMLInputElement).value)}
                onKeyDown={(e) => e.key === "Enter" && lookupUpc(upcCode)}
                class="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter barcode number"
              />
              <button
                onClick={() => lookupUpc(upcCode)}
                disabled={!upcCode.trim()}
                class="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Look Up
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scanning State - BarcodeScanner modal */}
      {state === "scanning" && (
        <Suspense fallback={<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/80"><div class="text-white">Loading scanner...</div></div>}>
          <BarcodeScanner
            onScan={handleScan}
            onClose={() => setState("idle")}
          />
        </Suspense>
      )}

      {/* Loading State */}
      {state === "loading" && (
        <div class="text-center py-12">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p class="mt-4 text-gray-600">Looking up barcode...</p>
        </div>
      )}

      {/* Found State - Show food card and log form */}
      {state === "found" && food && (
        <div class="space-y-6">
          {/* Food Card */}
          <div class="bg-white shadow rounded-lg p-6">
            <div class="flex items-start justify-between mb-4">
              <div>
                <h3 class="text-lg font-semibold text-gray-900">{food.name}</h3>
                <p class="text-sm text-gray-500">
                  {food.servingSizeValue} {food.servingSizeUnit} per serving
                </p>
              </div>
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Found
              </span>
            </div>

            {/* Nutrition Summary */}
            <div class="grid grid-cols-4 gap-4 mb-4">
              <div class="text-center p-2 bg-gray-50 rounded">
                <p class="text-lg font-bold text-gray-900">{food.calories}</p>
                <p class="text-xs text-gray-500">Calories</p>
              </div>
              <div class="text-center p-2 bg-red-50 rounded">
                <p class="text-lg font-bold text-red-600">{food.protein ?? 0}g</p>
                <p class="text-xs text-gray-500">Protein</p>
              </div>
              <div class="text-center p-2 bg-yellow-50 rounded">
                <p class="text-lg font-bold text-yellow-600">{food.carbohydrates ?? 0}g</p>
                <p class="text-xs text-gray-500">Carbs</p>
              </div>
              <div class="text-center p-2 bg-blue-50 rounded">
                <p class="text-lg font-bold text-blue-600">{food.totalFat ?? 0}g</p>
                <p class="text-xs text-gray-500">Fat</p>
              </div>
            </div>

            {food.upcCode && (
              <p class="text-xs text-gray-400">UPC: {food.upcCode}</p>
            )}
          </div>

          {/* Log Form */}
          <div class="bg-white shadow rounded-lg p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Log This Food</h3>
            <FoodLogForm
              mode="log"
              foodId={food.id}
              foodName={food.name}
            />
          </div>

          {/* Try Another */}
          <button
            onClick={reset}
            class="w-full px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Scan Another Barcode
          </button>
        </div>
      )}

      {/* Not Found State - Show options */}
      {state === "not_found" && (
        <div class="space-y-6">
          <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <svg class="mx-auto h-12 w-12 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 class="mt-4 text-lg font-medium text-yellow-800">Food Not Found</h3>
            <p class="mt-2 text-sm text-yellow-700">
              No saved food matches barcode <span class="font-mono font-medium">{lastSearchedCode}</span>
            </p>
          </div>

          <div class="bg-white shadow rounded-lg p-6 space-y-4">
            <h3 class="text-lg font-medium text-gray-900">What would you like to do?</h3>

            <a
              href={`/scan?upc=${encodeURIComponent(lastSearchedCode)}`}
              class="flex items-center p-4 border border-primary-200 rounded-lg bg-primary-50 hover:bg-primary-100 transition-colors"
            >
              <div class="flex items-center justify-center h-10 w-10 rounded-full bg-primary-100 text-primary-600 mr-4">
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h4 class="font-medium text-gray-900">Scan Nutrition Label</h4>
                <p class="text-sm text-gray-500">Take a photo of the nutrition facts</p>
              </div>
            </a>

            <a
              href={`/foods/new?upc=${encodeURIComponent(lastSearchedCode)}`}
              class="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div class="flex items-center justify-center h-10 w-10 rounded-full bg-gray-100 text-gray-600 mr-4">
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <div>
                <h4 class="font-medium text-gray-900">Enter Manually</h4>
                <p class="text-sm text-gray-500">Type in the nutrition information</p>
              </div>
            </a>

            <button
              onClick={reset}
              class="flex items-center w-full p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div class="flex items-center justify-center h-10 w-10 rounded-full bg-gray-100 text-gray-600 mr-4">
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <div class="text-left">
                <h4 class="font-medium text-gray-900">Try Another Barcode</h4>
                <p class="text-sm text-gray-500">Scan or enter a different code</p>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
