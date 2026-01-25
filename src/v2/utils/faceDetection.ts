import * as faceapi from 'face-api.js';

const MODEL_URL = '/models';

let modelsLoaded = false;
let modelsLoading: Promise<void> | null = null;

/**
 * Load face detection models (call once on app init or component mount)
 * Uses singleton pattern to prevent multiple simultaneous loads
 */
export const loadFaceDetectionModels = async (): Promise<void> => {
  if (modelsLoaded) return;

  // If already loading, wait for that load to complete
  if (modelsLoading) {
    return modelsLoading;
  }

  modelsLoading = (async () => {
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
    ]);
    modelsLoaded = true;
  })();

  return modelsLoading;
};

/**
 * Check if models are loaded
 */
export const areModelsLoaded = (): boolean => modelsLoaded;

/**
 * Face detection result with crop area
 */
export interface FaceDetectionResult {
  detected: boolean;
  cropArea: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null;
}

/**
 * Detect face in image and return recommended crop area
 * Expands bounding box by 30% for headshot padding
 */
export const detectFace = async (
  imageElement: HTMLImageElement
): Promise<FaceDetectionResult> => {
  if (!modelsLoaded) {
    await loadFaceDetectionModels();
  }

  const detection = await faceapi
    .detectSingleFace(imageElement, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks();

  if (!detection) {
    return { detected: false, cropArea: null };
  }

  const { box } = detection.detection;

  // Expand box by 30% for headshot padding (head + some shoulders)
  const padding = 0.3;
  const expandedWidth = box.width * (1 + padding * 2);
  const expandedHeight = box.height * (1 + padding * 2);
  const x = Math.max(0, box.x - box.width * padding);
  const y = Math.max(0, box.y - box.height * padding);

  // Make square (use larger dimension)
  const size = Math.max(expandedWidth, expandedHeight);

  // Ensure crop area stays within image bounds
  const finalX = Math.max(0, x - (size - expandedWidth) / 2);
  const finalY = Math.max(0, y - (size - expandedHeight) / 2);

  return {
    detected: true,
    cropArea: {
      x: Math.min(finalX, imageElement.naturalWidth - size),
      y: Math.min(finalY, imageElement.naturalHeight - size),
      width: Math.min(size, imageElement.naturalWidth),
      height: Math.min(size, imageElement.naturalHeight),
    },
  };
};
