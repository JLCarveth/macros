import { useState } from "preact/hooks";
import type { UserGoals } from "@nutrition-llama/shared";

interface GoalSetupProps {
  existingGoals: UserGoals | null;
}

type Sex = "male" | "female";
type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "very_active";
type Mode = "calculator" | "manual";
type WeightUnit = "kg" | "lbs";
type HeightUnit = "cm" | "in";

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: "Sedentary (little or no exercise)",
  light: "Lightly Active (1-3 days/week)",
  moderate: "Moderately Active (3-5 days/week)",
  active: "Active (6-7 days/week)",
  very_active: "Very Active (intense daily exercise)",
};

function calculateBMR(sex: Sex, weightKg: number, heightCm: number, age: number): number {
  if (sex === "male") {
    return 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  }
  return 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
}

function calculateMacros(tdee: number) {
  return {
    calories: Math.round(tdee),
    proteinG: Math.round((tdee * 0.3) / 4),
    carbsG: Math.round((tdee * 0.35) / 4),
    fatG: Math.round((tdee * 0.35) / 9),
  };
}

export default function GoalSetup({ existingGoals }: GoalSetupProps) {
  const [mode, setMode] = useState<Mode>("calculator");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Calculator fields
  const [sex, setSex] = useState<Sex>("male");
  const [age, setAge] = useState("");
  const [weight, setWeight] = useState("");
  const [weightUnit, setWeightUnit] = useState<WeightUnit>("lbs");
  const [height, setHeight] = useState("");
  const [heightUnit, setHeightUnit] = useState<HeightUnit>("in");
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>("moderate");

  // Manual / result fields
  const [calories, setCalories] = useState(existingGoals?.calories?.toString() || "");
  const [proteinG, setProteinG] = useState(existingGoals?.proteinG?.toString() || "");
  const [carbsG, setCarbsG] = useState(existingGoals?.carbsG?.toString() || "");
  const [fatG, setFatG] = useState(existingGoals?.fatG?.toString() || "");

  const [calculated, setCalculated] = useState(false);

  const handleCalculate = () => {
    const ageNum = parseInt(age);
    const weightNum = parseFloat(weight);
    const heightNum = parseFloat(height);

    if (!ageNum || !weightNum || !heightNum) {
      setError("Please fill in all fields");
      return;
    }

    const weightKg = weightUnit === "lbs" ? weightNum * 0.453592 : weightNum;
    const heightCm = heightUnit === "in" ? heightNum * 2.54 : heightNum;

    const bmr = calculateBMR(sex, weightKg, heightCm, ageNum);
    const tdee = bmr * ACTIVITY_MULTIPLIERS[activityLevel];
    const macros = calculateMacros(tdee);

    setCalories(macros.calories.toString());
    setProteinG(macros.proteinG.toString());
    setCarbsG(macros.carbsG.toString());
    setFatG(macros.fatG.toString());
    setCalculated(true);
    setError("");
  };

  const handleSave = async () => {
    const cal = parseInt(calories);
    const pro = parseInt(proteinG);
    const carb = parseInt(carbsG);
    const fat = parseInt(fatG);

    if (!cal || !pro || !carb || !fat || cal < 0 || pro < 0 || carb < 0 || fat < 0) {
      setError("Please enter valid positive numbers for all fields");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response = await fetch("/api/goals", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ calories: cal, proteinG: pro, carbsG: carb, fatG: fat }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save goals");
      }

      window.location.href = "/dashboard";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save goals");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div class="space-y-6">
      {error && (
        <div class="rounded-lg bg-red-50 border border-red-200 p-4">
          <p class="text-sm font-medium text-red-800">{error}</p>
        </div>
      )}

      {/* Mode Toggle */}
      <div class="flex gap-2 p-1 bg-gray-100 rounded-lg">
        <button
          type="button"
          onClick={() => { setMode("calculator"); setCalculated(false); }}
          class={`flex-1 px-4 py-2.5 text-sm font-medium rounded-md transition-all ${
            mode === "calculator"
              ? "bg-white text-primary-700 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          TDEE Calculator
        </button>
        <button
          type="button"
          onClick={() => setMode("manual")}
          class={`flex-1 px-4 py-2.5 text-sm font-medium rounded-md transition-all ${
            mode === "manual"
              ? "bg-white text-primary-700 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Manual Entry
        </button>
      </div>

      {mode === "calculator" && !calculated && (
        <div class="space-y-5">
          {/* Sex */}
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Sex</label>
            <div class="flex gap-3">
              {(["male", "female"] as Sex[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSex(s)}
                  class={`flex-1 px-4 py-2.5 text-sm font-medium rounded-md border transition-all ${
                    sex === s
                      ? "bg-primary-50 border-primary-300 text-primary-700"
                      : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Age */}
          <div>
            <label class="block text-sm font-medium text-gray-700">Age</label>
            <input
              type="number"
              min="1"
              max="120"
              value={age}
              onInput={(e) => setAge((e.target as HTMLInputElement).value)}
              placeholder="25"
              class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* Weight */}
          <div>
            <label class="block text-sm font-medium text-gray-700">Weight</label>
            <div class="mt-1 flex gap-2">
              <input
                type="number"
                step="0.1"
                min="1"
                value={weight}
                onInput={(e) => setWeight((e.target as HTMLInputElement).value)}
                placeholder={weightUnit === "lbs" ? "150" : "68"}
                class="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
              <select
                value={weightUnit}
                onChange={(e) => setWeightUnit((e.target as HTMLSelectElement).value as WeightUnit)}
                class="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="lbs">lbs</option>
                <option value="kg">kg</option>
              </select>
            </div>
          </div>

          {/* Height */}
          <div>
            <label class="block text-sm font-medium text-gray-700">Height</label>
            <div class="mt-1 flex gap-2">
              <input
                type="number"
                step="0.1"
                min="1"
                value={height}
                onInput={(e) => setHeight((e.target as HTMLInputElement).value)}
                placeholder={heightUnit === "in" ? "68" : "173"}
                class="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
              <select
                value={heightUnit}
                onChange={(e) => setHeightUnit((e.target as HTMLSelectElement).value as HeightUnit)}
                class="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="in">in</option>
                <option value="cm">cm</option>
              </select>
            </div>
          </div>

          {/* Activity Level */}
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Activity Level</label>
            <div class="space-y-2">
              {(Object.keys(ACTIVITY_LABELS) as ActivityLevel[]).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setActivityLevel(level)}
                  class={`w-full text-left px-4 py-3 text-sm rounded-md border transition-all ${
                    activityLevel === level
                      ? "bg-primary-50 border-primary-300 text-primary-700"
                      : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {ACTIVITY_LABELS[level]}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={handleCalculate}
            class="w-full px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 transition-colors shadow-sm"
          >
            Calculate Goals
          </button>
        </div>
      )}

      {/* Results / Manual Entry */}
      {(mode === "manual" || calculated) && (
        <div class="space-y-5">
          {calculated && (
            <div class="bg-primary-50 border border-primary-200 rounded-lg p-4">
              <p class="text-sm text-primary-800">
                Based on your TDEE calculation. Adjust the values below if needed.
              </p>
              <button
                type="button"
                onClick={() => setCalculated(false)}
                class="mt-2 text-sm font-medium text-primary-600 hover:text-primary-700"
              >
                Recalculate
              </button>
            </div>
          )}

          <div>
            <label class="block text-sm font-medium text-gray-700">Daily Calories</label>
            <input
              type="number"
              min="0"
              value={calories}
              onInput={(e) => setCalories((e.target as HTMLInputElement).value)}
              placeholder="2000"
              class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div class="grid grid-cols-3 gap-3">
            <div>
              <label class="block text-sm font-medium text-red-600">Protein (g)</label>
              <input
                type="number"
                min="0"
                value={proteinG}
                onInput={(e) => setProteinG((e.target as HTMLInputElement).value)}
                placeholder="150"
                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-yellow-600">Carbs (g)</label>
              <input
                type="number"
                min="0"
                value={carbsG}
                onInput={(e) => setCarbsG((e.target as HTMLInputElement).value)}
                placeholder="175"
                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-blue-600">Fat (g)</label>
              <input
                type="number"
                min="0"
                value={fatG}
                onInput={(e) => setFatG((e.target as HTMLInputElement).value)}
                placeholder="78"
                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Preview */}
          {calories && proteinG && carbsG && fatG && (
            <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 class="text-sm font-medium text-gray-700 mb-3">Goal Preview</h4>
              <div class="grid grid-cols-4 gap-3 text-center">
                <div>
                  <p class="text-xl font-bold text-gray-900">{calories}</p>
                  <p class="text-xs text-gray-500">Calories</p>
                </div>
                <div>
                  <p class="text-xl font-bold text-red-600">{proteinG}g</p>
                  <p class="text-xs text-gray-500">Protein</p>
                </div>
                <div>
                  <p class="text-xl font-bold text-yellow-600">{carbsG}g</p>
                  <p class="text-xs text-gray-500">Carbs</p>
                </div>
                <div>
                  <p class="text-xl font-bold text-blue-600">{fatG}g</p>
                  <p class="text-xs text-gray-500">Fat</p>
                </div>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            class="w-full px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            {saving ? "Saving..." : existingGoals ? "Update Goals" : "Save Goals"}
          </button>
        </div>
      )}
    </div>
  );
}
