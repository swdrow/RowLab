import { useState, useCallback, useEffect, useRef } from 'react';
import Cropper, { Area, Point } from 'react-easy-crop';
import { useFaceDetection } from '@v2/hooks/useFaceDetection';
import { useAthletes } from '@v2/hooks/useAthletes';

export interface PhotoCropperProps {
  image: string;
  athleteId: string;
  onCropComplete: (croppedImageUrl: string) => void;
  onCancel: () => void;
}

/**
 * Crop a region from an image and return as data URL
 */
async function getCroppedImage(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number }
): Promise<string> {
  const image = new Image();
  image.crossOrigin = 'anonymous';
  image.src = imageSrc;

  await new Promise((resolve, reject) => {
    image.onload = resolve;
    image.onerror = reject;
  });

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  // Set canvas to desired output size (square headshot)
  const outputSize = Math.min(pixelCrop.width, pixelCrop.height, 400); // Max 400px
  canvas.width = outputSize;
  canvas.height = outputSize;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    outputSize,
    outputSize
  );

  return canvas.toDataURL('image/jpeg', 0.9);
}

/**
 * Photo cropper with face detection and manual positioning
 */
export function PhotoCropper({
  image,
  athleteId,
  onCropComplete,
  onCancel,
}: PhotoCropperProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isDetecting, setIsDetecting] = useState(true);
  const [faceDetected, setFaceDetected] = useState<boolean | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const { modelsLoaded, modelsLoading, detect, error: modelError } = useFaceDetection();
  const { updateAthlete, isUpdating } = useAthletes();
  const imageRef = useRef<HTMLImageElement | null>(null);

  // Run face detection when models are loaded
  useEffect(() => {
    if (!modelsLoaded || !image) return;

    const runDetection = async () => {
      setIsDetecting(true);

      try {
        // Create an image element for face detection
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = image;

        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });

        imageRef.current = img;

        const result = await detect(img);
        setFaceDetected(result.detected);

        if (result.detected && result.cropArea) {
          // Convert crop area to percentage-based position for react-easy-crop
          // The crop area is in pixels, we need to calculate the initial zoom and position
          const imageWidth = img.naturalWidth;
          const imageHeight = img.naturalHeight;
          const cropSize = Math.min(result.cropArea.width, result.cropArea.height);

          // Calculate zoom based on crop area relative to image
          const minDimension = Math.min(imageWidth, imageHeight);
          const newZoom = minDimension / cropSize;

          // Calculate center of crop area
          const cropCenterX = result.cropArea.x + result.cropArea.width / 2;
          const cropCenterY = result.cropArea.y + result.cropArea.height / 2;

          // Convert to offset from center (react-easy-crop uses center-based positioning)
          const imageCenterX = imageWidth / 2;
          const imageCenterY = imageHeight / 2;

          // Calculate crop position offset (in pixels, will be normalized by the cropper)
          const offsetX = ((imageCenterX - cropCenterX) / imageWidth) * 100 * newZoom;
          const offsetY = ((imageCenterY - cropCenterY) / imageHeight) * 100 * newZoom;

          setZoom(Math.min(Math.max(newZoom, 1), 3));
          setCrop({ x: offsetX, y: offsetY });
        }
      } catch (err) {
        console.error('Face detection failed:', err);
        setFaceDetected(false);
      } finally {
        setIsDetecting(false);
      }
    };

    runDetection();
  }, [modelsLoaded, image, detect]);

  const onCropChange = useCallback((newCrop: Point) => {
    setCrop(newCrop);
  }, []);

  const onZoomChange = useCallback((newZoom: number) => {
    setZoom(newZoom);
  }, []);

  const onCropAreaChange = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = async () => {
    if (!croppedAreaPixels) return;

    setIsSaving(true);

    try {
      const croppedImageUrl = await getCroppedImage(image, croppedAreaPixels);

      // Save to API via useAthletes hook
      updateAthlete(
        { id: athleteId, avatar: croppedImageUrl },
        {
          onSuccess: () => {
            onCropComplete(croppedImageUrl);
          },
          onError: (error) => {
            console.error('Failed to save photo:', error);
            setIsSaving(false);
          },
        }
      );
    } catch (err) {
      console.error('Failed to crop image:', err);
      setIsSaving(false);
    }
  };

  const isLoading = modelsLoading || isDetecting;
  const isBusy = isSaving || isUpdating;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="relative bg-bg-surface rounded-xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-bdr-default">
          <h2 className="text-lg font-semibold text-txt-primary">
            Crop Photo
          </h2>
          {isLoading && (
            <p className="text-sm text-txt-secondary mt-1">
              Detecting face...
            </p>
          )}
          {!isLoading && faceDetected === false && (
            <p className="text-sm text-yellow-600 mt-1">
              No face detected - position manually
            </p>
          )}
          {!isLoading && faceDetected === true && (
            <p className="text-sm text-green-600 mt-1">
              Face detected - adjust if needed
            </p>
          )}
          {modelError && (
            <p className="text-sm text-red-500 mt-1">
              {modelError} - manual cropping available
            </p>
          )}
        </div>

        {/* Crop Area */}
        <div className="relative aspect-square bg-black">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span className="text-sm text-white/70">
                  {modelsLoading ? 'Loading models...' : 'Analyzing image...'}
                </span>
              </div>
            </div>
          ) : (
            <Cropper
              image={image}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="rect"
              showGrid={false}
              onCropChange={onCropChange}
              onZoomChange={onZoomChange}
              onCropComplete={onCropAreaChange}
              classes={{
                containerClassName: 'bg-black',
                cropAreaClassName: 'rounded-lg',
              }}
            />
          )}
        </div>

        {/* Controls */}
        <div className="px-6 py-4 border-t border-bdr-default">
          {/* Zoom Slider */}
          <div className="mb-4">
            <label
              htmlFor="zoom-slider"
              className="block text-sm font-medium text-txt-primary mb-2"
            >
              Zoom: {zoom.toFixed(1)}x
            </label>
            <input
              id="zoom-slider"
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              disabled={isLoading}
              className="
                w-full h-2 bg-bg-input rounded-lg appearance-none cursor-pointer
                disabled:opacity-50 disabled:cursor-not-allowed
                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:w-4
                [&::-webkit-slider-thumb]:h-4
                [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:bg-interactive-primary
                [&::-webkit-slider-thumb]:cursor-pointer
              "
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={isBusy}
              className="
                flex-1 px-4 py-2.5 text-sm font-medium
                text-txt-primary bg-bg-surface border border-bdr-default rounded-lg
                hover:bg-bg-hover disabled:opacity-50 disabled:cursor-not-allowed
                transition-colors
              "
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isLoading || isBusy || !croppedAreaPixels}
              className="
                flex-1 px-4 py-2.5 text-sm font-medium
                text-white bg-interactive-primary rounded-lg
                hover:bg-interactive-primary-hover
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-colors
              "
            >
              {isBusy ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PhotoCropper;
