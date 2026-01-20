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

export default function ImageCropper({
  imageSrc,
  onCropComplete,
  onCancel,
}: ImageCropperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  const [imageLoaded, setImageLoaded] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [crop, setCrop] = useState<CropArea>({ x: 0, y: 0, width: 0, height: 0 });
  const [displaySize, setDisplaySize] = useState({ width: 0, height: 0 });

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
    const maxHeight = 400;

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

    // Draw rotated image
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);

    const img = imageRef.current;
    const isRotated90 = rotation === 90 || rotation === 270;
    const drawWidth = isRotated90 ? canvas.height : canvas.width;
    const drawHeight = isRotated90 ? canvas.width : canvas.height;

    ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
    ctx.restore();

    // Draw dark overlay outside crop area
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    // Top
    ctx.fillRect(0, 0, canvas.width, crop.y);
    // Bottom
    ctx.fillRect(0, crop.y + crop.height, canvas.width, canvas.height - crop.y - crop.height);
    // Left
    ctx.fillRect(0, crop.y, crop.x, crop.height);
    // Right
    ctx.fillRect(crop.x + crop.width, crop.y, canvas.width - crop.x - crop.width, crop.height);

    // Draw crop border
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.strokeRect(crop.x, crop.y, crop.width, crop.height);

    // Draw grid lines (rule of thirds)
    ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
    ctx.lineWidth = 1;
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

    // Draw corner handles
    ctx.fillStyle = "#ffffff";
    const handles = [
      { x: crop.x, y: crop.y }, // NW
      { x: crop.x + crop.width, y: crop.y }, // NE
      { x: crop.x, y: crop.y + crop.height }, // SW
      { x: crop.x + crop.width, y: crop.y + crop.height }, // SE
    ];

    handles.forEach(({ x, y }) => {
      ctx.beginPath();
      ctx.arc(x, y, HANDLE_SIZE / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#4f46e5";
      ctx.lineWidth = 3;
      ctx.stroke();
    });
  }, [displaySize, crop, rotation, imageLoaded]);

  // Get pointer position relative to canvas
  const getPointerPosition = (e: MouseEvent | TouchEvent) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  // Check if pointer is on a handle
  const getHandleAtPosition = (x: number, y: number): HandlePosition => {
    const handles: { pos: HandlePosition; x: number; y: number }[] = [
      { pos: "nw", x: crop.x, y: crop.y },
      { pos: "ne", x: crop.x + crop.width, y: crop.y },
      { pos: "sw", x: crop.x, y: crop.y + crop.height },
      { pos: "se", x: crop.x + crop.width, y: crop.y + crop.height },
    ];

    for (const handle of handles) {
      const dist = Math.sqrt((x - handle.x) ** 2 + (y - handle.y) ** 2);
      if (dist <= HANDLE_SIZE) {
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
        style={{ minHeight: "300px", maxHeight: "400px" }}
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

      <div class="flex justify-center gap-2">
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
      </div>

      <p class="text-sm text-gray-500 text-center">
        Drag corners to resize. Drag inside to move.
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
