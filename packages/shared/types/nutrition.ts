/**
 * Nutrition-related types extracted from the API
 */

export type ServingSizeUnit = "g" | "ml";
export type CaloriesUnit = "kcal";
export type MassUnit = "g" | "mg";

export interface NutrientValue<T extends string = string> {
  value: number;
  unit: T;
}

export interface ServingSize extends NutrientValue<ServingSizeUnit> {}
export interface Calories extends NutrientValue<CaloriesUnit> {}
export interface MacroNutrient extends NutrientValue<"g"> {}
export interface MicroNutrient extends NutrientValue<"mg"> {}

/**
 * Nutrition data returned from the analyze-nutrition endpoint
 */
export interface NutritionData {
  servingSize: ServingSize;
  calories: Calories;
  totalFat: MacroNutrient;
  carbohydrates: MacroNutrient;
  fiber?: MacroNutrient;
  sugars?: MacroNutrient;
  protein: MacroNutrient;
  cholesterol?: MicroNutrient;
  sodium?: MicroNutrient;
}

/**
 * Nutrition record stored in the database
 */
export interface NutritionRecord {
  id: string;
  userId: string;
  name: string;
  servingSizeValue: number;
  servingSizeUnit: ServingSizeUnit;
  calories: number;
  totalFat: number | null;
  carbohydrates: number | null;
  fiber: number | null;
  sugars: number | null;
  protein: number | null;
  cholesterol: number | null;
  sodium: number | null;
  upcCode: string | null;
  source: "manual" | "scan" | "api";
  createdAt: Date;
}

/**
 * Nutrition record with source indicator (user-owned vs system/USDA)
 */
export interface NutritionRecordWithSource extends NutritionRecord {
  isSystem: boolean;
}

/**
 * Input for creating a nutrition record
 */
export interface CreateNutritionRecordInput {
  name: string;
  servingSizeValue: number;
  servingSizeUnit: ServingSizeUnit;
  calories: number;
  totalFat?: number;
  carbohydrates?: number;
  fiber?: number;
  sugars?: number;
  protein?: number;
  cholesterol?: number;
  sodium?: number;
  upcCode?: string;
  source?: "manual" | "scan" | "api";
}

/**
 * JSON Schema for LLM grammar (matches app.js nutritionSchema)
 */
export const nutritionJsonSchema = {
  type: "object",
  properties: {
    servingSize: {
      type: "object",
      properties: {
        value: { type: "number" },
        unit: { type: "string", enum: ["g", "ml"] },
      },
      required: ["value", "unit"],
    },
    calories: {
      type: "object",
      properties: {
        value: { type: "number" },
        unit: { type: "string", enum: ["kcal"] },
      },
      required: ["value", "unit"],
    },
    totalFat: {
      type: "object",
      properties: {
        value: { type: "number" },
        unit: { type: "string", enum: ["g"] },
      },
      required: ["value", "unit"],
    },
    carbohydrates: {
      type: "object",
      properties: {
        value: { type: "number" },
        unit: { type: "string", enum: ["g"] },
      },
      required: ["value", "unit"],
    },
    fiber: {
      type: "object",
      properties: {
        value: { type: "number" },
        unit: { type: "string", enum: ["g"] },
      },
      required: ["value", "unit"],
    },
    sugars: {
      type: "object",
      properties: {
        value: { type: "number" },
        unit: { type: "string", enum: ["g"] },
      },
      required: ["value", "unit"],
    },
    protein: {
      type: "object",
      properties: {
        value: { type: "number" },
        unit: { type: "string", enum: ["g"] },
      },
      required: ["value", "unit"],
    },
    cholesterol: {
      type: "object",
      properties: {
        value: { type: "number" },
        unit: { type: "string", enum: ["mg"] },
      },
      required: ["value", "unit"],
    },
    sodium: {
      type: "object",
      properties: {
        value: { type: "number" },
        unit: { type: "string", enum: ["mg"] },
      },
      required: ["value", "unit"],
    },
  },
  required: ["servingSize", "calories", "totalFat", "protein", "carbohydrates"],
} as const;
