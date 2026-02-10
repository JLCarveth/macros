import { useEffect, useRef, useState } from "preact/hooks";
import { detectBarcodesFromVideo } from "../utils/barcode.ts";
import { trackEvent } from "../utils/analytics.ts";

interface BarcodeScannerProps {
  onScan: (code: string) => void;
  onClose: () => void;
}

export default function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const [error, setError] = useState("");
  const [scanning, setScanning] = useState(false);
  const [detected, setDetected] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);

  const stopCamera = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const triggerHaptic = () => {
    if (navigator.vibrate) {
      navigator.vibrate(100);
    }
  };

  const startScanning = async () => {
    setError("");
    setScanning(true);

    try {
      // Start camera with settings optimized for barcode scanning
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 30 },
        },
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // Start detection loop using zxing-wasm
      const detectLoop = async () => {
        if (!videoRef.current || !streamRef.current) return;

        try {
          const results = await detectBarcodesFromVideo(videoRef.current);

          if (results.length > 0) {
            const code = results[0];
            trackEvent("UPC_Lookup");
            triggerHaptic();
            setDetected(true);

            // Brief delay to show success animation
            setTimeout(() => {
              stopCamera();
              onScan(code);
            }, 300);
            return;
          }
        } catch {
          // Detection errors are normal, continue scanning
        }

        // Continue scanning
        animationRef.current = requestAnimationFrame(detectLoop);
      };

      animationRef.current = requestAnimationFrame(detectLoop);
    } catch (err) {
      const message = err instanceof Error ? err.message : "An unknown error occurred";
      if (message.includes("Permission denied") || message.includes("NotAllowedError")) {
        setError("Camera access denied. Please allow camera permissions and try again.");
      } else {
        setError("Could not access camera. Please ensure camera permissions are granted.");
      }
      setScanning(false);
      stopCamera();
      console.error("Scanner error:", err);
    }
  };

  useEffect(() => {
    startScanning();
    return () => stopCamera();
  }, []);

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  return (
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div class="relative w-full max-w-md mx-4">
        {/* Header */}
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-medium text-white">Scan Barcode</h3>
          <button
            onClick={handleClose}
            class="p-2 text-white hover:text-gray-300"
            aria-label="Close scanner"
          >
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Camera View */}
        <div class="relative bg-black rounded-lg overflow-hidden aspect-[4/3]">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            class="w-full h-full object-cover"
          />

          {/* Viewfinder Overlay */}
          <div class="absolute inset-0 pointer-events-none">
            {/* Darkened corners */}
            <div class="absolute inset-0 flex items-center justify-center">
              <div class={`w-3/4 h-1/3 border-2 rounded transition-colors duration-200 ${
                detected ? "border-green-500 bg-green-500/20" : "border-white/70"
              }`}>
                {/* Corner markers */}
                <div class="absolute -top-0.5 -left-0.5 w-6 h-6 border-t-4 border-l-4 border-white rounded-tl" />
                <div class="absolute -top-0.5 -right-0.5 w-6 h-6 border-t-4 border-r-4 border-white rounded-tr" />
                <div class="absolute -bottom-0.5 -left-0.5 w-6 h-6 border-b-4 border-l-4 border-white rounded-bl" />
                <div class="absolute -bottom-0.5 -right-0.5 w-6 h-6 border-b-4 border-r-4 border-white rounded-br" />

                {/* Scan line animation */}
                {scanning && !detected && (
                  <div class="absolute inset-x-2 h-0.5 bg-red-500/80 animate-pulse" style="top: 50%;" />
                )}
              </div>
            </div>
          </div>

          {/* Success Checkmark */}
          {detected && (
            <div class="absolute inset-0 flex items-center justify-center bg-black/40">
              <div class="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
                <svg class="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div class="mt-4 p-3 bg-red-500/20 rounded-lg">
            <p class="text-sm text-red-300">{error}</p>
          </div>
        )}

        {/* Instructions */}
        <p class="mt-4 text-sm text-gray-400 text-center">
          Point your camera at a barcode
        </p>

        {/* Cancel button */}
        <button
          onClick={handleClose}
          class="mt-4 w-full px-4 py-2 border border-gray-600 text-sm font-medium rounded-md text-gray-300 bg-gray-800 hover:bg-gray-700"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
