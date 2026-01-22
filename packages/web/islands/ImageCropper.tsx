import { useState, useRef, useEffect, useCallback } from "preact/hooks";

interface ImageCropperProps {
  imageSrc: string;
  onCropComplete: (croppedImageUrl: string) => void;
  onCancel: () => void;
}

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

type HandlePosition = "nw" | "ne" | "sw" | "se" | null;

const HANDLE_SIZE = 24;
const MIN_CROP_SIZE = 50;
const TARGET_CROP_RATIO = 0.6; // Crop should appear at least 60% of viewport
const MAX_ZOOM = 4;
const MIN_ZOOM = 1;

export default function ImageCropper({
  imageSrc,
  onCropComplete,
  onCancel,
}: ImageCropperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const animationRef = useRef<number | null>(null);

  const [imageLoaded, setImageLoaded] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [crop, setCrop] = useState<CropArea>({ x: 0, y: 0, width: 0, height: 0 });
  const [displaySize, setDisplaySize] = useState({ width: 0, height: 0 });

  // Auto-zoom state
  const [zoom, setZoom] = useState(1);
  const [viewOffset, setViewOffset] = useState({ x: 0, y: 0 });
  const [targetZoom, setTargetZoom] = useState(1);
  const [targetOffset, setTargetOffset] = useState({ x: 0, y: 0 });

  // Interaction state
  const [isDragging, setIsDragging] = useState(false);
  const [activeHandle, setActiveHandle] = useState<HandlePosition>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [cropStart, setCropStart] = useState<CropArea>({ x: 0, y: 0, width: 0, height: 0 });

  // Load image
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imageRef.current = img;
      setImageLoaded(true);
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // Get the effective dimensions after rotation
  const getRotatedDimensions = useCallback(() => {
    if (!imageRef.current) return { width: 0, height: 0 };
    const isRotated90 = rotation === 90 || rotation === 270;
    return {
      width: isRotated90 ? imageRef.current.height : imageRef.current.width,
      height: isRotated90 ? imageRef.current.width : imageRef.current.height,
    };
  }, [rotation]);

  // Calculate display size and initial crop when image loads or rotation changes
  useEffect(() => {
    if (!imageLoaded || !containerRef.current || !imageRef.current) return;

    const container = containerRef.current;
    const containerWidth = container.clientWidth;
    const maxHeight = 500;

    const { width: imgWidth, height: imgHeight } = getRotatedDimensions();

    // Scale to fit container
    const scaleX = containerWidth / imgWidth;
    const scaleY = maxHeight / imgHeight;
    const scale = Math.min(scaleX, scaleY, 1);

    const displayWidth = imgWidth * scale;
    const displayHeight = imgHeight * scale;

    setDisplaySize({ width: displayWidth, height: displayHeight });

    // Initialize crop to center 80% of image
    const cropWidth = displayWidth * 0.8;
    const cropHeight = displayHeight * 0.8;
    setCrop({
      x: (displayWidth - cropWidth) / 2,
      y: (displayHeight - cropHeight) / 2,
      width: cropWidth,
      height: cropHeight,
    });
  }, [imageLoaded, rotation, getRotatedDimensions]);

  // Calculate target zoom based on crop size (with delay after user releases)
  useEffect(() => {
    if (displaySize.width === 0 || displaySize.height === 0) return;
    if (crop.width === 0 || crop.height === 0) return;

    // Don't recalculate zoom while user is actively dragging
    if (isDragging) return;

    // Wait a moment after release before zooming
    const timeoutId = setTimeout(() => {
      // Calculate how small the crop is relative to the display
      const cropRatioW = crop.width / displaySize.width;
      const cropRatioH = crop.height / displaySize.height;
      const currentRatio = Math.min(cropRatioW, cropRatioH);

      let newZoom: number;
      if (currentRatio >= TARGET_CROP_RATIO) {
        newZoom = MIN_ZOOM;
      } else {
        newZoom = Math.min(MAX_ZOOM, TARGET_CROP_RATIO / currentRatio);
      }

      // Ensure the entire crop area (with handle padding) can fit in the viewport
      // Viewport size at newZoom = displaySize / newZoom
      // We need: crop.width + 2*handlePadding <= displaySize.width / newZoom
      const handlePadding = HANDLE_SIZE + 8; // Extra margin for usability
      const maxZoomForWidth = displaySize.width / (crop.width + 2 * handlePadding);
      const maxZoomForHeight = displaySize.height / (crop.height + 2 * handlePadding);
      const maxZoomToFitCrop = Math.min(maxZoomForWidth, maxZoomForHeight);

      newZoom = Math.min(newZoom, maxZoomToFitCrop);
      newZoom = Math.max(MIN_ZOOM, newZoom); // Don't go below 1

      setTargetZoom(newZoom);
    }, 400);

    return () => clearTimeout(timeoutId);
  }, [crop.width, crop.height, displaySize.width, displaySize.height, isDragging]);

  // Calculate target viewOffset to keep the entire crop area visible (including handles)
  useEffect(() => {
    if (displaySize.width === 0 || displaySize.height === 0) return;

    // Don't recenter while dragging
    if (isDragging) return;

    if (targetZoom === 1) {
      setTargetOffset({ x: 0, y: 0 });
      return;
    }

    // Viewport size in image coordinates when zoomed
    const viewportWidth = displaySize.width / targetZoom;
    const viewportHeight = displaySize.height / targetZoom;

    // Add padding for handles (in image coordinates)
    const handlePadding = (HANDLE_SIZE / targetZoom) + 4;

    // Calculate the bounding box we need to show (crop + handle padding)
    const requiredLeft = crop.x - handlePadding;
    const requiredRight = crop.x + crop.width + handlePadding;
    const requiredTop = crop.y - handlePadding;
    const requiredBottom = crop.y + crop.height + handlePadding;

    // If the crop area (with handles) fits in viewport, center it
    const requiredWidth = requiredRight - requiredLeft;
    const requiredHeight = requiredBottom - requiredTop;

    let offsetX: number;
    let offsetY: number;

    if (requiredWidth <= viewportWidth) {
      // Crop fits horizontally - center it
      const cropCenterX = crop.x + crop.width / 2;
      offsetX = cropCenterX - viewportWidth / 2;
    } else {
      // Crop is wider than viewport - align to show as much as possible from the left
      offsetX = requiredLeft;
    }

    if (requiredHeight <= viewportHeight) {
      // Crop fits vertically - center it
      const cropCenterY = crop.y + crop.height / 2;
      offsetY = cropCenterY - viewportHeight / 2;
    } else {
      // Crop is taller than viewport - align to show as much as possible from the top
      offsetY = requiredTop;
    }

    // Clamp to image bounds
    offsetX = Math.max(0, Math.min(offsetX, displaySize.width - viewportWidth));
    offsetY = Math.max(0, Math.min(offsetY, displaySize.height - viewportHeight));

    setTargetOffset({ x: offsetX, y: offsetY });
  }, [crop.x, crop.y, crop.width, crop.height, targetZoom, displaySize.width, displaySize.height, isDragging]);

  // Animate zoom and offset smoothly
  useEffect(() => {
    const animate = () => {
      const LERP_FACTOR = 0.15;

      setZoom((currentZoom) => {
        const diff = targetZoom - currentZoom;
        if (Math.abs(diff) < 0.01) return targetZoom;
        return currentZoom + diff * LERP_FACTOR;
      });

      setViewOffset((currentOffset) => {
        const diffX = targetOffset.x - currentOffset.x;
        const diffY = targetOffset.y - currentOffset.y;
        if (Math.abs(diffX) < 0.5 && Math.abs(diffY) < 0.5) {
          return targetOffset;
        }
        return {
          x: currentOffset.x + diffX * LERP_FACTOR,
          y: currentOffset.y + diffY * LERP_FACTOR,
        };
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [targetZoom, targetOffset]);

  // Draw canvas
  useEffect(() => {
    if (!canvasRef.current || !imageRef.current || !imageLoaded) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = displaySize.width;
    canvas.height = displaySize.height;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply zoom and offset transformation
    ctx.save();
    ctx.scale(zoom, zoom);
    ctx.translate(-viewOffset.x, -viewOffset.y);

    // Draw rotated image
    ctx.save();
    ctx.translate(displaySize.width / 2, displaySize.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);

    const img = imageRef.current;
    const isRotated90 = rotation === 90 || rotation === 270;
    const drawWidth = isRotated90 ? displaySize.height : displaySize.width;
    const drawHeight = isRotated90 ? displaySize.width : displaySize.height;

    ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
    ctx.restore();

    // Draw dark overlay outside crop area
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    // Top
    ctx.fillRect(0, 0, displaySize.width, crop.y);
    // Bottom
    ctx.fillRect(0, crop.y + crop.height, displaySize.width, displaySize.height - crop.y - crop.height);
    // Left
    ctx.fillRect(0, crop.y, crop.x, crop.height);
    // Right
    ctx.fillRect(crop.x + crop.width, crop.y, displaySize.width - crop.x - crop.width, crop.height);

    // Draw crop border (scale line width inversely so it appears consistent)
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2 / zoom;
    ctx.strokeRect(crop.x, crop.y, crop.width, crop.height);

    // Draw grid lines (rule of thirds)
    ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
    ctx.lineWidth = 1 / zoom;
    const thirdW = crop.width / 3;
    const thirdH = crop.height / 3;
    ctx.beginPath();
    ctx.moveTo(crop.x + thirdW, crop.y);
    ctx.lineTo(crop.x + thirdW, crop.y + crop.height);
    ctx.moveTo(crop.x + thirdW * 2, crop.y);
    ctx.lineTo(crop.x + thirdW * 2, crop.y + crop.height);
    ctx.moveTo(crop.x, crop.y + thirdH);
    ctx.lineTo(crop.x + crop.width, crop.y + thirdH);
    ctx.moveTo(crop.x, crop.y + thirdH * 2);
    ctx.lineTo(crop.x + crop.width, crop.y + thirdH * 2);
    ctx.stroke();

    // Draw corner handles (scale handle size inversely so they stay usable when zoomed)
    ctx.fillStyle = "#ffffff";
    const handleRadius = HANDLE_SIZE / 2 / zoom;
    const handles = [
      { x: crop.x, y: crop.y }, // NW
      { x: crop.x + crop.width, y: crop.y }, // NE
      { x: crop.x, y: crop.y + crop.height }, // SW
      { x: crop.x + crop.width, y: crop.y + crop.height }, // SE
    ];

    handles.forEach(({ x, y }) => {
      ctx.beginPath();
      ctx.arc(x, y, handleRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#4f46e5";
      ctx.lineWidth = 3 / zoom;
      ctx.stroke();
    });

    ctx.restore();
  }, [displaySize, crop, rotation, imageLoaded, zoom, viewOffset]);

  // Get pointer position relative to canvas, accounting for zoom and offset
  const getPointerPosition = (e: MouseEvent | TouchEvent) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

    // Get viewport position (relative to canvas element)
    const viewportX = clientX - rect.left;
    const viewportY = clientY - rect.top;

    // Translate to image coordinates accounting for zoom and offset
    return {
      x: viewportX / zoom + viewOffset.x,
      y: viewportY / zoom + viewOffset.y,
    };
  };

  // Check if pointer is on a handle (accounting for zoom-scaled handles)
  const getHandleAtPosition = (x: number, y: number): HandlePosition => {
    const handles: { pos: HandlePosition; x: number; y: number }[] = [
      { pos: "nw", x: crop.x, y: crop.y },
      { pos: "ne", x: crop.x + crop.width, y: crop.y },
      { pos: "sw", x: crop.x, y: crop.y + crop.height },
      { pos: "se", x: crop.x + crop.width, y: crop.y + crop.height },
    ];

    // Handle hit area in image coordinates (handles are drawn at HANDLE_SIZE / zoom)
    const hitRadius = HANDLE_SIZE / zoom;

    for (const handle of handles) {
      const dist = Math.sqrt((x - handle.x) ** 2 + (y - handle.y) ** 2);
      if (dist <= hitRadius) {
        return handle.pos;
      }
    }
    return null;
  };

  // Check if pointer is inside crop area
  const isInsideCrop = (x: number, y: number) => {
    return x >= crop.x && x <= crop.x + crop.width &&
           y >= crop.y && y <= crop.y + crop.height;
  };

  const handlePointerDown = (e: MouseEvent | TouchEvent) => {
    e.preventDefault();
    const pos = getPointerPosition(e);
    const handle = getHandleAtPosition(pos.x, pos.y);

    if (handle) {
      setActiveHandle(handle);
      setIsDragging(true);
    } else if (isInsideCrop(pos.x, pos.y)) {
      setActiveHandle(null);
      setIsDragging(true);
    }

    setDragStart(pos);
    setCropStart({ ...crop });
  };

  const handlePointerMove = (e: MouseEvent | TouchEvent) => {
    if (!isDragging) return;
    e.preventDefault();

    const pos = getPointerPosition(e);
    const deltaX = pos.x - dragStart.x;
    const deltaY = pos.y - dragStart.y;

    if (activeHandle) {
      // Resizing
      let newCrop = { ...cropStart };

      switch (activeHandle) {
        case "nw":
          newCrop.x = Math.min(cropStart.x + deltaX, cropStart.x + cropStart.width - MIN_CROP_SIZE);
          newCrop.y = Math.min(cropStart.y + deltaY, cropStart.y + cropStart.height - MIN_CROP_SIZE);
          newCrop.width = cropStart.width - (newCrop.x - cropStart.x);
          newCrop.height = cropStart.height - (newCrop.y - cropStart.y);
          break;
        case "ne":
          newCrop.y = Math.min(cropStart.y + deltaY, cropStart.y + cropStart.height - MIN_CROP_SIZE);
          newCrop.width = Math.max(MIN_CROP_SIZE, cropStart.width + deltaX);
          newCrop.height = cropStart.height - (newCrop.y - cropStart.y);
          break;
        case "sw":
          newCrop.x = Math.min(cropStart.x + deltaX, cropStart.x + cropStart.width - MIN_CROP_SIZE);
          newCrop.width = cropStart.width - (newCrop.x - cropStart.x);
          newCrop.height = Math.max(MIN_CROP_SIZE, cropStart.height + deltaY);
          break;
        case "se":
          newCrop.width = Math.max(MIN_CROP_SIZE, cropStart.width + deltaX);
          newCrop.height = Math.max(MIN_CROP_SIZE, cropStart.height + deltaY);
          break;
      }

      // Constrain to canvas bounds
      newCrop.x = Math.max(0, newCrop.x);
      newCrop.y = Math.max(0, newCrop.y);
      newCrop.width = Math.min(newCrop.width, displaySize.width - newCrop.x);
      newCrop.height = Math.min(newCrop.height, displaySize.height - newCrop.y);

      setCrop(newCrop);
    } else {
      // Moving crop area
      let newX = cropStart.x + deltaX;
      let newY = cropStart.y + deltaY;

      // Constrain to canvas bounds
      newX = Math.max(0, Math.min(newX, displaySize.width - crop.width));
      newY = Math.max(0, Math.min(newY, displaySize.height - crop.height));

      setCrop({ ...crop, x: newX, y: newY });
    }
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    setActiveHandle(null);
  };

  // Add/remove global event listeners for drag
  useEffect(() => {
    if (isDragging) {
      const moveHandler = (e: MouseEvent | TouchEvent) => handlePointerMove(e);
      const upHandler = () => handlePointerUp();

      document.addEventListener("mousemove", moveHandler as EventListener);
      document.addEventListener("mouseup", upHandler);
      document.addEventListener("touchmove", moveHandler as EventListener, { passive: false });
      document.addEventListener("touchend", upHandler);

      return () => {
        document.removeEventListener("mousemove", moveHandler as EventListener);
        document.removeEventListener("mouseup", upHandler);
        document.removeEventListener("touchmove", moveHandler as EventListener);
        document.removeEventListener("touchend", upHandler);
      };
    }
  }, [isDragging, dragStart, cropStart, crop, activeHandle, displaySize]);

  const handleRotate = () => {
    // Reset zoom when rotating
    setZoom(1);
    setViewOffset({ x: 0, y: 0 });
    setTargetZoom(1);
    setTargetOffset({ x: 0, y: 0 });
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleApplyCrop = async () => {
    if (!imageRef.current) return;

    const img = imageRef.current;
    const { width: rotatedWidth, height: rotatedHeight } = getRotatedDimensions();

    // Calculate the scale between display and actual image
    const scaleX = rotatedWidth / displaySize.width;
    const scaleY = rotatedHeight / displaySize.height;

    // Get crop coordinates in original image space
    const actualCrop = {
      x: crop.x * scaleX,
      y: crop.y * scaleY,
      width: crop.width * scaleX,
      height: crop.height * scaleY,
    };

    // Create canvas for final output
    const outputCanvas = document.createElement("canvas");
    outputCanvas.width = actualCrop.width;
    outputCanvas.height = actualCrop.height;
    const ctx = outputCanvas.getContext("2d");
    if (!ctx) return;

    // First, create a canvas with the rotated full image
    const rotatedCanvas = document.createElement("canvas");
    rotatedCanvas.width = rotatedWidth;
    rotatedCanvas.height = rotatedHeight;
    const rotatedCtx = rotatedCanvas.getContext("2d");
    if (!rotatedCtx) return;

    rotatedCtx.translate(rotatedWidth / 2, rotatedHeight / 2);
    rotatedCtx.rotate((rotation * Math.PI) / 180);
    rotatedCtx.drawImage(img, -img.width / 2, -img.height / 2);

    // Now extract the cropped region
    ctx.drawImage(
      rotatedCanvas,
      actualCrop.x,
      actualCrop.y,
      actualCrop.width,
      actualCrop.height,
      0,
      0,
      actualCrop.width,
      actualCrop.height
    );

    const croppedImageUrl = outputCanvas.toDataURL("image/jpeg", 0.9);
    onCropComplete(croppedImageUrl);
  };

  return (
    <div class="space-y-4">
      <div
        ref={containerRef}
        class="relative bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center"
        style={{ minHeight: "350px", maxHeight: "500px" }}
      >
        {!imageLoaded ? (
          <div class="text-white">Loading...</div>
        ) : (
          <canvas
            ref={canvasRef}
            class="cursor-move"
            style={{
              width: displaySize.width,
              height: displaySize.height,
              touchAction: "none",
            }}
            onMouseDown={handlePointerDown as unknown as (e: MouseEvent) => void}
            onTouchStart={handlePointerDown as unknown as (e: TouchEvent) => void}
          />
        )}
      </div>

      <div class="flex justify-center items-center gap-4">
        <button
          onClick={handleRotate}
          class="flex items-center gap-2 px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          title="Rotate 90°"
        >
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Rotate
        </button>
        {zoom > 1.05 && (
          <span class="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
            {zoom.toFixed(1)}x zoom
          </span>
        )}
      </div>

      <p class="text-sm text-gray-500 text-center">
        Drag corners to resize. Drag inside to move.{zoom > 1.05 ? " Auto-zoomed for easier selection." : ""}
      </p>

      <div class="flex justify-center gap-4">
        <button
          onClick={onCancel}
          class="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={handleApplyCrop}
          class="px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
        >
          Apply Crop
        </button>
      </div>
    </div>
  );
}
