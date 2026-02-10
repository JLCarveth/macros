/**
 * Food log related types
 */

import type { NutritionRecord } from "./nutrition.ts";

export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export interface FoodLogEntry {
  id: string;
  userId: string;
  nutritionRecordId: string;
  servings: number;
  loggedDate: string; // ISO date string (YYYY-MM-DD)
  mealType: MealType;
  createdAt: Date;
}

export interface FoodLogEntryWithNutrition extends FoodLogEntry {
  nutritionRecord: NutritionRecord;
}

export interface CreateFoodLogInput {
  nutritionRecordId: string;
  servings?: number;
  loggedDate?: string;
  mealType?: MealType;
}

export interface UpdateFoodLogInput {
  servings?: number;
  mealType?: MealType;
}

export interface DailySummary {
  date: string;
  totalCalories: number;
  totalFat: number;
  totalCarbohydrates: number;
  totalProtein: number;
  totalFiber: number;
  totalSugars: number;
  totalSodium: number;
  totalCholesterol: number;
  entries: FoodLogEntryWithNutrition[];
}

export interface MacroTotals {
  calories: number;
  fat: number;
  carbohydrates: number;
  protein: number;
  fiber: number;
  sugars: number;
  sodium: number;
  cholesterol: number;
}
