import { useState, useRef, useEffect } from "preact/hooks";
import type { NutritionData } from "@nutrition-llama/shared";

type CaptureState = "idle" | "camera" | "preview" | "analyzing" | "results" | "saving";

interface AnalysisResult extends NutritionData {
  name?: string;
}

export default function CameraCapture() {
  const [state, setState] = useState<CaptureState>("idle");
  const [error, setError] = useState("");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [foodName, setFoodName] = useState("");
  const [upcCode, setUpcCode] = useState("");
  const [saving, setSaving] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Attach stream to video element when in camera state
  useEffect(() => {
    if (state === "camera" && streamRef.current && videoRef.current) {
      const video = videoRef.current;
      video.srcObject = streamRef.current;

      video.onloadedmetadata = () => {
        console.log("Video metadata loaded. Dimensions:", video.videoWidth, "x", video.videoHeight);
        video.play().then(() => {
          console.log("Video playing. Current dimensions:", video.videoWidth, "x", video.videoHeight);
        }).catch((err) => {
          console.error("Play error:", err);
        });
      };

      video.onerror = (e) => {
        console.error("Video error event:", e);
      };
    }
  }, [state]);

  const startCamera = async () => {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      });

      // Debug: log stream info
      const videoTrack = stream.getVideoTracks()[0];
      console.log("Stream obtained:", stream.id);
      console.log("Video track:", videoTrack?.label, "enabled:", videoTrack?.enabled, "readyState:", videoTrack?.readyState);
      console.log("Track settings:", JSON.stringify(videoTrack?.getSettings()));

      streamRef.current = stream;
      // Set state first so the video element renders
      setState("camera");
    } catch (err) {
      setError("Could not access camera. Please ensure camera permissions are granted.");
      console.error("Camera error:", err);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);
    const imageData = canvas.toDataURL("image/jpeg", 0.9);
    setCapturedImage(imageData);
    stopCamera();
    setState("preview");
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setAnalysisResult(null);
    startCamera();
  };

  const analyzeImage = async () => {
    if (!capturedImage) return;

    setState("analyzing");
    setError("");

    try {
      // Convert base64 to blob
      const response = await fetch(capturedImage);
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
      setState("results");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed. Please try again.");
      setState("preview");
    }
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
    stopCamera();
  };

  return (
    <div class="space-y-6">
      {error && (
        <div class="rounded-md bg-red-50 p-4">
          <p class="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Hidden canvas for capturing */}
      <canvas ref={canvasRef} class="hidden" />

      {/* Idle State */}
      {state === "idle" && (
        <div class="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p class="mt-4 text-gray-600">Take a photo of a nutrition facts label</p>
          <button
            onClick={startCamera}
            class="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
          >
            Open Camera
          </button>
        </div>
      )}

      {/* Camera View */}
      {state === "camera" && (
        <div class="space-y-4">
          <div class="relative bg-black rounded-lg overflow-hidden aspect-video">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              class="w-full h-full object-cover"
            />
            <div class="absolute inset-0 border-4 border-white/30 m-8 rounded pointer-events-none" />
          </div>
          <div class="flex justify-center gap-4">
            <button
              onClick={() => { stopCamera(); setState("idle"); }}
              class="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={captureImage}
              class="px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
            >
              Capture
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
              onClick={analyzeImage}
              class="px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
            >
              Analyze
            </button>
          </div>
        </div>
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
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Extracted Nutrition Data</h3>
            <dl class="grid grid-cols-2 gap-4">
              <div>
                <dt class="text-sm text-gray-500">Serving Size</dt>
                <dd class="text-lg font-medium">
                  {analysisResult.servingSize.value}{analysisResult.servingSize.unit}
                </dd>
              </div>
              <div>
                <dt class="text-sm text-gray-500">Calories</dt>
                <dd class="text-lg font-medium">{analysisResult.calories.value}</dd>
              </div>
              <div>
                <dt class="text-sm text-gray-500">Protein</dt>
                <dd class="text-lg font-medium">{analysisResult.protein?.value || 0}g</dd>
              </div>
              <div>
                <dt class="text-sm text-gray-500">Carbohydrates</dt>
                <dd class="text-lg font-medium">{analysisResult.carbohydrates?.value || 0}g</dd>
              </div>
              <div>
                <dt class="text-sm text-gray-500">Total Fat</dt>
                <dd class="text-lg font-medium">{analysisResult.totalFat?.value || 0}g</dd>
              </div>
              <div>
                <dt class="text-sm text-gray-500">Fiber</dt>
                <dd class="text-lg font-medium">{analysisResult.fiber?.value || 0}g</dd>
              </div>
              <div>
                <dt class="text-sm text-gray-500">Sugars</dt>
                <dd class="text-lg font-medium">{analysisResult.sugars?.value || 0}g</dd>
              </div>
              <div>
                <dt class="text-sm text-gray-500">Sodium</dt>
                <dd class="text-lg font-medium">{analysisResult.sodium?.value || 0}mg</dd>
              </div>
            </dl>
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
              <input
                id="upcCode"
                type="text"
                value={upcCode}
                onInput={(e) => setUpcCode((e.target as HTMLInputElement).value)}
                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="Barcode number"
              />
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
    </div>
  );
}
