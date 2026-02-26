import { useState, useRef, lazy, Suspense } from "preact/compat";
import type { NutritionData } from "@nutrition-llama/shared";
import ImageCropper from "./ImageCropper.tsx";
import { trackEvent } from "../utils/analytics.ts";

// Lazy load BarcodeScanner to prevent zxing-wasm from blocking hydration
const BarcodeScanner = lazy(() => import("./BarcodeScanner.tsx"));

type CaptureState = "idle" | "preview" | "cropping" | "analyzing" | "results" | "saving";

interface AnalysisResult extends NutritionData {
  name?: string;
}

interface CameraCaptureProps {
  initialUpc?: string | null;
}

export default function CameraCapture({ initialUpc }: CameraCaptureProps) {
  const [state, setState] = useState<CaptureState>("idle");
  const [error, setError] = useState("");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [foodName, setFoodName] = useState("");
  const [upcCode, setUpcCode] = useState(initialUpc || "");
  const [saving, setSaving] = useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: Event) => {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    setError("");
    const reader = new FileReader();
    reader.onload = () => {
      setCapturedImage(reader.result as string);
      setState("preview");
    };
    reader.onerror = () => {
      setError("Failed to read the selected image.");
    };
    reader.readAsDataURL(file);

    // Reset input so the same file can be re-selected
    input.value = "";
  };

  const chooseImage = () => {
    fileInputRef.current?.click();
  };

  const takePhoto = () => {
    cameraInputRef.current?.click();
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setAnalysisResult(null);
    chooseImage();
  };

  const analyzeImage = async (imageToAnalyze?: string) => {
    const image = imageToAnalyze || capturedImage;
    if (!image) return;

    setState("analyzing");
    setError("");

    try {
      // Convert base64 to blob
      const response = await fetch(image);
      const blob = await response.blob();

      // Create form data
      const formData = new FormData();
      formData.append("image", blob, "nutrition-label.jpg");

      // Send to analyze endpoint
      const analyzeResponse = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      if (!analyzeResponse.ok) {
        const errorData = await analyzeResponse.json();
        throw new Error(errorData.error || "Analysis failed");
      }

      const result = await analyzeResponse.json();
      setAnalysisResult(result);
      trackEvent("Scan_Label", { method: "camera" });
      setState("results");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed. Please try again.");
      setState("preview");
    }
  };

  const startCropping = () => {
    setState("cropping");
  };

  const handleCropComplete = (croppedImageUrl: string) => {
    setCapturedImage(croppedImageUrl);
    analyzeImage(croppedImageUrl);
  };

  const cancelCropping = () => {
    setState("preview");
  };

  const saveFood = async () => {
    if (!analysisResult || !foodName.trim()) {
      setError("Please enter a name for this food");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response = await fetch("/api/foods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: foodName.trim(),
          servingSizeValue: analysisResult.servingSize.value,
          servingSizeUnit: analysisResult.servingSize.unit,
          calories: analysisResult.calories.value,
          totalFat: analysisResult.totalFat?.value,
          carbohydrates: analysisResult.carbohydrates?.value,
          fiber: analysisResult.fiber?.value,
          sugars: analysisResult.sugars?.value,
          protein: analysisResult.protein?.value,
          cholesterol: analysisResult.cholesterol?.value,
          sodium: analysisResult.sodium?.value,
          upcCode: upcCode.trim() || undefined,
          source: "scan",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save food");
      }

      // Redirect to foods list
      trackEvent("Save_Food");
      window.location.href = "/foods";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save food");
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setCapturedImage(null);
    setAnalysisResult(null);
    setFoodName("");
    setUpcCode("");
    setError("");
    setState("idle");
  };

  return (
    <div class="space-y-6">
      {error && (
        <div class="rounded-md bg-red-50 p-4">
          <p class="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        class="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        class="hidden"
      />

      {/* Idle State */}
      {state === "idle" && (
        <div class="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p class="mt-4 text-gray-600">Take a photo or upload an image of a nutrition facts label</p>
          <div class="mt-4 flex justify-center gap-3">
            <button
              onClick={takePhoto}
              class="inline-flex items-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Take Photo
            </button>
            <button
              onClick={chooseImage}
              class="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Upload Image
            </button>
          </div>
        </div>
      )}

      {/* Preview State */}
      {state === "preview" && capturedImage && (
        <div class="space-y-4">
          <div class="bg-gray-100 rounded-lg overflow-hidden">
            <img src={capturedImage} alt="Captured" class="w-full" />
          </div>
          <div class="flex justify-center gap-4">
            <button
              onClick={retakePhoto}
              class="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Retake
            </button>
            <button
              onClick={startCropping}
              class="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Crop
            </button>
            <button
              onClick={() => analyzeImage()}
              class="px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
            >
              Analyze
            </button>
          </div>
        </div>
      )}

      {/* Cropping State */}
      {state === "cropping" && capturedImage && (
        <ImageCropper
          imageSrc={capturedImage}
          onCropComplete={handleCropComplete}
          onCancel={cancelCropping}
        />
      )}

      {/* Analyzing State */}
      {state === "analyzing" && (
        <div class="text-center py-12">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p class="mt-4 text-gray-600">Analyzing nutrition label...</p>
          <p class="text-sm text-gray-500">This may take a moment</p>
        </div>
      )}

      {/* Results State */}
      {state === "results" && analysisResult && (
        <div class="space-y-6">
          <div class="bg-white shadow rounded-lg p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-semibold text-gray-900">Extracted Nutrition Data</h3>
              <span class="text-xs text-gray-500">Click any value to edit</span>
            </div>
            <div class="grid grid-cols-2 gap-4">
              {/* Serving Size */}
              <div>
                <label class="block text-sm text-gray-500 mb-1">Serving Size</label>
                <div class="flex gap-1">
                  <input
                    type="number"
                    value={analysisResult.servingSize.value}
                    onInput={(e) => {
                      const val = parseFloat((e.target as HTMLInputElement).value) || 0;
                      setAnalysisResult({
                        ...analysisResult,
                        servingSize: { ...analysisResult.servingSize, value: val }
                      });
                    }}
                    class="w-20 px-2 py-1 text-lg font-medium border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                    min="0"
                    step="any"
                  />
                  <select
                    value={analysisResult.servingSize.unit}
                    onChange={(e) => {
                      const unit = (e.target as HTMLSelectElement).value as "g" | "ml";
                      setAnalysisResult({
                        ...analysisResult,
                        servingSize: { ...analysisResult.servingSize, unit }
                      });
                    }}
                    class="px-2 py-1 text-lg font-medium border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="g">g</option>
                    <option value="ml">ml</option>
                  </select>
                </div>
              </div>

              {/* Calories */}
              <div>
                <label class="block text-sm text-gray-500 mb-1">Calories</label>
                <div class="flex items-center gap-1">
                  <input
                    type="number"
                    value={analysisResult.calories.value}
                    onInput={(e) => {
                      const val = parseFloat((e.target as HTMLInputElement).value) || 0;
                      setAnalysisResult({
                        ...analysisResult,
                        calories: { ...analysisResult.calories, value: val }
                      });
                    }}
                    class="w-24 px-2 py-1 text-lg font-medium border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                    min="0"
                    step="any"
                  />
                  <span class="text-gray-500">kcal</span>
                </div>
              </div>

              {/* Protein */}
              <div>
                <label class="block text-sm text-gray-500 mb-1">Protein</label>
                <div class="flex items-center gap-1">
                  <input
                    type="number"
                    value={analysisResult.protein?.value ?? 0}
                    onInput={(e) => {
                      const val = parseFloat((e.target as HTMLInputElement).value) || 0;
                      setAnalysisResult({
                        ...analysisResult,
                        protein: { value: val, unit: "g" }
                      });
                    }}
                    class="w-24 px-2 py-1 text-lg font-medium border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                    min="0"
                    step="any"
                  />
                  <span class="text-gray-500">g</span>
                </div>
              </div>

              {/* Carbohydrates */}
              <div>
                <label class="block text-sm text-gray-500 mb-1">Carbohydrates</label>
                <div class="flex items-center gap-1">
                  <input
                    type="number"
                    value={analysisResult.carbohydrates?.value ?? 0}
                    onInput={(e) => {
                      const val = parseFloat((e.target as HTMLInputElement).value) || 0;
                      setAnalysisResult({
                        ...analysisResult,
                        carbohydrates: { value: val, unit: "g" }
                      });
                    }}
                    class="w-24 px-2 py-1 text-lg font-medium border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                    min="0"
                    step="any"
                  />
                  <span class="text-gray-500">g</span>
                </div>
              </div>

              {/* Total Fat */}
              <div>
                <label class="block text-sm text-gray-500 mb-1">Total Fat</label>
                <div class="flex items-center gap-1">
                  <input
                    type="number"
                    value={analysisResult.totalFat?.value ?? 0}
                    onInput={(e) => {
                      const val = parseFloat((e.target as HTMLInputElement).value) || 0;
                      setAnalysisResult({
                        ...analysisResult,
                        totalFat: { value: val, unit: "g" }
                      });
                    }}
                    class="w-24 px-2 py-1 text-lg font-medium border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                    min="0"
                    step="any"
                  />
                  <span class="text-gray-500">g</span>
                </div>
              </div>

              {/* Fiber */}
              <div>
                <label class="block text-sm text-gray-500 mb-1">Fiber</label>
                <div class="flex items-center gap-1">
                  <input
                    type="number"
                    value={analysisResult.fiber?.value ?? 0}
                    onInput={(e) => {
                      const val = parseFloat((e.target as HTMLInputElement).value) || 0;
                      setAnalysisResult({
                        ...analysisResult,
                        fiber: { value: val, unit: "g" }
                      });
                    }}
                    class="w-24 px-2 py-1 text-lg font-medium border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                    min="0"
                    step="any"
                  />
                  <span class="text-gray-500">g</span>
                </div>
              </div>

              {/* Sugars */}
              <div>
                <label class="block text-sm text-gray-500 mb-1">Sugars</label>
                <div class="flex items-center gap-1">
                  <input
                    type="number"
                    value={analysisResult.sugars?.value ?? 0}
                    onInput={(e) => {
                      const val = parseFloat((e.target as HTMLInputElement).value) || 0;
                      setAnalysisResult({
                        ...analysisResult,
                        sugars: { value: val, unit: "g" }
                      });
                    }}
                    class="w-24 px-2 py-1 text-lg font-medium border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                    min="0"
                    step="any"
                  />
                  <span class="text-gray-500">g</span>
                </div>
              </div>

              {/* Sodium */}
              <div>
                <label class="block text-sm text-gray-500 mb-1">Sodium</label>
                <div class="flex items-center gap-1">
                  <input
                    type="number"
                    value={analysisResult.sodium?.value ?? 0}
                    onInput={(e) => {
                      const val = parseFloat((e.target as HTMLInputElement).value) || 0;
                      setAnalysisResult({
                        ...analysisResult,
                        sodium: { value: val, unit: "mg" }
                      });
                    }}
                    class="w-24 px-2 py-1 text-lg font-medium border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                    min="0"
                    step="any"
                  />
                  <span class="text-gray-500">mg</span>
                </div>
              </div>

              {/* Cholesterol */}
              <div>
                <label class="block text-sm text-gray-500 mb-1">Cholesterol</label>
                <div class="flex items-center gap-1">
                  <input
                    type="number"
                    value={analysisResult.cholesterol?.value ?? 0}
                    onInput={(e) => {
                      const val = parseFloat((e.target as HTMLInputElement).value) || 0;
                      setAnalysisResult({
                        ...analysisResult,
                        cholesterol: { value: val, unit: "mg" }
                      });
                    }}
                    class="w-24 px-2 py-1 text-lg font-medium border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                    min="0"
                    step="any"
                  />
                  <span class="text-gray-500">mg</span>
                </div>
              </div>
            </div>
          </div>

          <div class="bg-white shadow rounded-lg p-6 space-y-4">
            <h3 class="text-lg font-semibold text-gray-900">Save This Food</h3>

            <div>
              <label htmlFor="foodName" class="block text-sm font-medium text-gray-700">
                Food Name *
              </label>
              <input
                id="foodName"
                type="text"
                value={foodName}
                onInput={(e) => setFoodName((e.target as HTMLInputElement).value)}
                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="e.g., Oatmeal, Protein Bar"
              />
            </div>

            <div>
              <label htmlFor="upcCode" class="block text-sm font-medium text-gray-700">
                UPC Code (optional)
              </label>
              <div class="mt-1 flex rounded-md shadow-sm">
                <input
                  id="upcCode"
                  type="text"
                  value={upcCode}
                  onInput={(e) => setUpcCode((e.target as HTMLInputElement).value)}
                  class="flex-1 block w-full px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Barcode number"
                />
                <button
                  type="button"
                  onClick={() => setShowBarcodeScanner(true)}
                  class="inline-flex items-center px-3 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                  title="Scan barcode"
                >
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                </button>
              </div>
            </div>

            <div class="flex gap-4">
              <button
                onClick={reset}
                class="flex-1 px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Start Over
              </button>
              <button
                onClick={saveFood}
                disabled={saving || !foodName.trim()}
                class="flex-1 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Saving..." : "Save Food"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Barcode Scanner Modal */}
      {showBarcodeScanner && (
        <Suspense fallback={<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/80"><div class="text-white">Loading scanner...</div></div>}>
          <BarcodeScanner
            onScan={(code) => {
              setUpcCode(code);
              setShowBarcodeScanner(false);
            }}
            onClose={() => setShowBarcodeScanner(false)}
          />
        </Suspense>
      )}
    </div>
  );
}
