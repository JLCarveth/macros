import type { NutritionRecord } from "./nutrition.ts";

export interface RecipeIngredient {
  id: string;
  recipeId: string;
  nutritionRecordId: string;
  amountServings: number;
  createdAt: Date;
}

export interface RecipeIngredientWithFood extends RecipeIngredient {
  nutritionRecord: NutritionRecord;
}

export interface Recipe {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  servings: number;
  nutritionRecordId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RecipeWithIngredients extends Recipe {
  ingredients: RecipeIngredientWithFood[];
  nutrition: NutritionRecord;
}

export interface CreateRecipeInput {
  name: string;
  description?: string;
  servings: number;
  ingredients: { nutritionRecordId: string; amountServings: number }[];
}

export type UpdateRecipeInput = Partial<CreateRecipeInput>;
