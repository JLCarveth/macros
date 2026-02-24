/**
 * Open Food Facts API client for barcode lookups
 * Server-side only (called from Deno Fresh routes)
 */

import type { CreateNutritionRecordInput } from "@nutrition-llama/shared";

const OFF_API_BASE = "https://world.openfoodfacts.org/api/v2/product";
const USER_AGENT = "NutritionLlama/1.0 (https://github.com/nutrition-llama)";

// Simple in-memory rate limiter: 10 requests per minute
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

    // Determine serving size: prefer per-serving values when available
    const hasServingData = nutriments["energy-kcal_serving"] != null && product.serving_quantity;
    const servingSizeValue = hasServingData
      ? Number(product.serving_quantity)
      : 100;
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

    const food: CreateNutritionRecordInput = {
      name: product.product_name || product.product_name_en || "Unknown Product",
      servingSizeValue,
      servingSizeUnit: "g",
      calories,
      totalFat: n("fat"),
      carbohydrates: n("carbohydrates"),
      fiber: n("fiber"),
      sugars: n("sugars"),
      protein: n("proteins"),
      cholesterol: n("cholesterol") != null
        ? Math.round(n("cholesterol")! * 1000) // OFF stores in grams, app uses mg
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
