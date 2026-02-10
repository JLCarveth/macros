/**
 * Barcode scanning using zxing-wasm
 * Works on all platforms via WebAssembly
 */

import { readBarcodesFromImageData, type ReaderOptions } from "zxing-wasm/reader";

// Supported barcode formats for UPC scanning
const readerOptions: ReaderOptions = {
  formats: ["EAN-8", "EAN-13", "UPC-A", "UPC-E"],
  tryHarder: true,
  maxNumberOfSymbols: 1,
};

/**
 * Check if barcode scanning is supported
 * zxing-wasm works on all modern browsers with WebAssembly support
 */
export function isBarcodeDetectorSupported(): boolean {
  return typeof WebAssembly !== "undefined";
}

/**
 * Detect barcodes in a video element by capturing a frame
 * Returns array of detected barcode values
 */
export async function detectBarcodesFromVideo(
  video: HTMLVideoElement
): Promise<string[]> {
  // Create a canvas to capture the video frame
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not get canvas context");
  }

  // Draw the current video frame
  ctx.drawImage(video, 0, 0);

  // Get image data
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

  // Read barcodes using zxing-wasm
  const results = await readBarcodesFromImageData(imageData, readerOptions);

  return results.map((result) => result.text);
}

/**
 * Detect barcodes from an ImageData object
 */
export async function detectBarcodes(imageData: ImageData): Promise<string[]> {
  const results = await readBarcodesFromImageData(imageData, readerOptions);
  return results.map((result) => result.text);
}
