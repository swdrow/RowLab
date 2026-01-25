import { useState, useEffect, useCallback } from 'react';
import {
  loadFaceDetectionModels,
  detectFace,
  areModelsLoaded,
} from '../utils/faceDetection';
import type { FaceDetectionResult } from '../utils/faceDetection';

interface UseFaceDetectionReturn {
  modelsLoaded: boolean;
  modelsLoading: boolean;
  detect: (imageElement: HTMLImageElement) => Promise<FaceDetectionResult>;
  error: string | null;
}

/**
 * Hook for face detection functionality
 * Lazily loads face detection models when first used
 */
export const useFaceDetection = (): UseFaceDetectionReturn => {
  const [modelsLoaded, setModelsLoaded] = useState(areModelsLoaded());
  const [modelsLoading, setModelsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (modelsLoaded) return;

    const loadModels = async () => {
      setModelsLoading(true);
      setError(null);
      try {
        await loadFaceDetectionModels();
        setModelsLoaded(true);
      } catch (err) {
        setError('Failed to load face detection models');
        console.error('Face detection model load error:', err);
      } finally {
        setModelsLoading(false);
      }
    };

    loadModels();
  }, [modelsLoaded]);

  const detect = useCallback(
    async (imageElement: HTMLImageElement): Promise<FaceDetectionResult> => {
      return detectFace(imageElement);
    },
    []
  );

  return { modelsLoaded, modelsLoading, detect, error };
};
