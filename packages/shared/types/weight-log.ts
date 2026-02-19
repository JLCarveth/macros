/**
 * Weight log and trend related types
 */

export interface WeightLogEntry {
  id: string;
  userId: string;
  loggedDate: string; // ISO date string (YYYY-MM-DD)
  weightKg: number;
  bodyFatPct: number | null;
  createdAt: Date;
}

export interface CreateWeightLogInput {
  weightKg: number;
  bodyFatPct?: number;
  loggedDate?: string;
}

export interface CalorieTrendPoint {
  date: string;
  totalCalories: number;
}

export interface TrendsData {
  calorieTrend: CalorieTrendPoint[];
  currentStreak: number;
  longestStreak: number;
}
