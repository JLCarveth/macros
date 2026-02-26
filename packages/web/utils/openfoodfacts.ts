/**
 * Open Food Facts API client for barcode lookups
 * Server-side only (called from Deno Fresh routes)
 */

import type { CreateNutritionRecordInput } from "@nutrition-llama/shared";

const OFF_API_BASE = "https://world.openfoodfacts.org/api/v2/product";
const OFF_SEARCH_BASE = "https://world.openfoodfacts.org/api/v2/search";
const USER_AGENT = "NutritionLlama/1.0 (https://github.com/nutrition-llama)";

// Simple in-memory rate limiter: 10 requests per minute (barcode lookups)
const rateLimitWindow = 60_000;
const rateLimitMax = 10;
const requestTimestamps: number[] = [];

function checkRateLimit(): boolean {
  const now = Date.now();
  // Remove timestamps older than the window
  while (requestTimestamps.length > 0 && requestTimestamps[0] < now - rateLimitWindow) {
    requestTimestamps.shift();
  }
  if (requestTimestamps.length >= rateLimitMax) {
    return false;
  }
  requestTimestamps.push(now);
  return true;
}

// Separate rate limiter for text search: 30 requests per minute
const searchRateLimitWindow = 60_000;
const searchRateLimitMax = 30;
const searchRequestTimestamps: number[] = [];

function checkSearchRateLimit(): boolean {
  const now = Date.now();
  while (searchRequestTimestamps.length > 0 && searchRequestTimestamps[0] < now - searchRateLimitWindow) {
    searchRequestTimestamps.shift();
  }
  if (searchRequestTimestamps.length >= searchRateLimitMax) {
    return false;
  }
  searchRequestTimestamps.push(now);
  return true;
}

export interface OffSearchResult extends OffLookupResult {
  barcode: string;
}

export interface OffLookupResult {
  food: CreateNutritionRecordInput;
  productName: string;
  productUrl: string;
  imageUrl?: string;
}

/**
 * Look up a product by barcode on Open Food Facts.
 * Returns null if not found or on error.
 */
export async function lookupOffProduct(barcode: string): Promise<OffLookupResult | null> {
  if (!checkRateLimit()) {
    console.warn("Open Food Facts rate limit exceeded");
    return null;
  }

  try {
    const url = `${OFF_API_BASE}/${encodeURIComponent(barcode)}.json`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (data.status !== 1 || !data.product) {
      return null;
    }

    const product = data.product;
    const nutriments = product.nutriments;
    if (!nutriments) {
      return null;
    }

    // Determine serving size unit: OFF provides serving_quantity_unit ("g", "ml", etc.)
    // Fall back to inferring from the raw serving_quantity string (e.g. "240ml", "30 g")
    // then default to "g".
    const rawUnit = (product.serving_quantity_unit as string | undefined)?.toLowerCase().trim();
    const servingSizeUnit: "g" | "ml" = rawUnit === "ml" ? "ml" : "g";

    // Parse serving_quantity — OFF may return a bare number or a string like "30g" / "240 ml"
    const parseServingQuantity = (val: unknown): number | null => {
      if (val == null) return null;
      const num = parseFloat(String(val));
      return isNaN(num) ? null : num;
    };

    // Determine serving size: prefer per-serving values when available
    const parsedServingQty = parseServingQuantity(product.serving_quantity);
    const hasServingData = nutriments["energy-kcal_serving"] != null && parsedServingQty != null;
    const servingSizeValue = hasServingData ? parsedServingQty! : 100;
    const suffix = hasServingData ? "_serving" : "_100g";

    // Helper to extract a nutrient value
    const n = (key: string): number | undefined => {
      const val = nutriments[`${key}${suffix}`];
      return val != null ? Number(val) : undefined;
    };

    const calories = n("energy-kcal");
    if (calories == null) {
      // Can't do much without calories
      return null;
    }

    // OFF stores sodium in grams; our app uses mg
    const sodiumG = n("sodium");
    const sodiumMg = sodiumG != null ? Math.round(sodiumG * 1000) : undefined;

    const cholesterolG = n("cholesterol");

    const food: CreateNutritionRecordInput = {
      name: product.product_name || product.product_name_en || "Unknown Product",
      servingSizeValue,
      servingSizeUnit,
      calories,
      totalFat: n("fat"),
      carbohydrates: n("carbohydrates"),
      fiber: n("fiber"),
      sugars: n("sugars"),
      protein: n("proteins"),
      cholesterol: cholesterolG != null
        ? Math.round(cholesterolG * 1000) // OFF stores in grams, app uses mg
        : undefined,
      sodium: sodiumMg,
      upcCode: barcode,
      source: "openfoodfacts",
    };

    const productUrl = `https://world.openfoodfacts.org/product/${barcode}`;

    return {
      food,
      productName: food.name,
      productUrl,
      imageUrl: product.image_url || undefined,
    };
  } catch (error) {
    console.error("Open Food Facts lookup error:", error);
    return null;
  }
}

/**
 * Search Open Food Facts by text query.
 * Returns an empty array if rate limited or on error.
 */
export async function searchOffProducts(
  query: string,
  limit = 20,
): Promise<OffSearchResult[]> {
  if (!checkSearchRateLimit()) {
    console.warn("Open Food Facts search rate limit exceeded");
    return [];
  }

  try {
    const params = new URLSearchParams({
      search_terms: query,
      page_size: String(limit),
      fields: "code,product_name,product_name_en,nutriments,serving_quantity,serving_quantity_unit,image_url",
    });
    const url = `${OFF_SEARCH_BASE}?${params}`;
    const response = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    const products: unknown[] = data.products ?? [];

    const results: OffSearchResult[] = [];

    for (const product of products) {
      const p = product as Record<string, unknown>;
      const barcode = String(p.code ?? "");
      if (!barcode) continue;

      const nutriments = p.nutriments as Record<string, unknown> | undefined;
      if (!nutriments) continue;

      const rawUnit = (p.serving_quantity_unit as string | undefined)?.toLowerCase().trim();
      const servingSizeUnit: "g" | "ml" = rawUnit === "ml" ? "ml" : "g";

      const parseServingQuantity = (val: unknown): number | null => {
        if (val == null) return null;
        const num = parseFloat(String(val));
        return isNaN(num) ? null : num;
      };

      const parsedServingQty = parseServingQuantity(p.serving_quantity);
      const hasServingData = nutriments["energy-kcal_serving"] != null && parsedServingQty != null;
      const servingSizeValue = hasServingData ? parsedServingQty! : 100;
      const suffix = hasServingData ? "_serving" : "_100g";

      const n = (key: string): number | undefined => {
        const val = nutriments[`${key}${suffix}`];
        return val != null ? Number(val) : undefined;
      };

      const calories = n("energy-kcal");
      if (calories == null) continue;

      const sodiumG = n("sodium");
      const sodiumMg = sodiumG != null ? Math.round(sodiumG * 1000) : undefined;
      const cholesterolG = n("cholesterol");

      const food: import("@nutrition-llama/shared").CreateNutritionRecordInput = {
        name: (p.product_name as string) || (p.product_name_en as string) || "Unknown Product",
        servingSizeValue,
        servingSizeUnit,
        calories,
        totalFat: n("fat"),
        carbohydrates: n("carbohydrates"),
        fiber: n("fiber"),
        sugars: n("sugars"),
        protein: n("proteins"),
        cholesterol: cholesterolG != null ? Math.round(cholesterolG * 1000) : undefined,
        sodium: sodiumMg,
        upcCode: barcode,
        source: "openfoodfacts",
      };

      const productUrl = `https://world.openfoodfacts.org/product/${barcode}`;

      results.push({
        barcode,
        food,
        productName: food.name,
        productUrl,
        imageUrl: (p.image_url as string) || undefined,
      });
    }

    return results;
  } catch (error) {
    console.error("Open Food Facts search error:", error);
    return [];
  }
}
