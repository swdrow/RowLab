import { useRef, useCallback, useState } from 'react';
import { toPng, toBlob } from 'html-to-image';
import { saveAs } from 'file-saver';

interface UseShareCardOptions {
  filename?: string;
  backgroundColor?: string;
}

interface UseShareCardReturn {
  cardRef: React.RefObject<HTMLDivElement>;
  isGenerating: boolean;
  error: string | null;
  downloadPng: () => Promise<void>;
  getDataUrl: () => Promise<string | null>;
  getBlob: () => Promise<Blob | null>;
}

/**
 * Hook for generating shareable card images via html-to-image
 * Per RESEARCH.md: html-to-image is 3x faster than html2canvas
 */
export function useShareCard(options: UseShareCardOptions = {}): UseShareCardReturn {
  const { filename = 'rowlab-workout', backgroundColor = '#ffffff' } = options;

  const cardRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getDataUrl = useCallback(async (): Promise<string | null> => {
    if (!cardRef.current) {
      setError('Card element not found');
      return null;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        backgroundColor,
        pixelRatio: 2, // Higher quality for sharing
      });
      return dataUrl;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate image';
      setError(message);
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [backgroundColor]);

  const getBlob = useCallback(async (): Promise<Blob | null> => {
    if (!cardRef.current) {
      setError('Card element not found');
      return null;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const blob = await toBlob(cardRef.current, {
        cacheBust: true,
        backgroundColor,
        pixelRatio: 2,
      });
      return blob;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate image';
      setError(message);
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [backgroundColor]);

  const downloadPng = useCallback(async (): Promise<void> => {
    const blob = await getBlob();
    if (blob) {
      const timestampedFilename = `${filename}-${Date.now()}.png`;
      saveAs(blob, timestampedFilename);
    }
  }, [getBlob, filename]);

  return {
    cardRef,
    isGenerating,
    error,
    downloadPng,
    getDataUrl,
    getBlob,
  };
}

export default useShareCard;
