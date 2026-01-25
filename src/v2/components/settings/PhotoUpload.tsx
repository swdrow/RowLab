import { useCallback, useState, useRef } from 'react';
import { Upload, X, Camera } from 'lucide-react';

export interface PhotoUploadProps {
  onImageSelected: (imageUrl: string) => void;
  currentPhoto?: string | null;
  onRemove?: () => void;
  disabled?: boolean;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * Photo upload component with drag-and-drop and file picker
 */
export function PhotoUpload({
  onImageSelected,
  currentPhoto,
  onRemove,
  disabled = false,
}: PhotoUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Please upload a JPEG, PNG, or WebP image';
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'File size must be less than 5MB';
    }
    return null;
  };

  const processFile = useCallback(
    async (file: File) => {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      setIsProcessing(true);
      setError(null);

      try {
        // Create object URL for the file
        const imageUrl = URL.createObjectURL(file);
        onImageSelected(imageUrl);
      } catch (err) {
        setError('Failed to process image');
        console.error('Image processing error:', err);
      } finally {
        setIsProcessing(false);
      }
    },
    [onImageSelected]
  );

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (disabled) return;

      const files = e.dataTransfer.files;
      const firstFile = files[0];
      if (firstFile) {
        processFile(firstFile);
      }
    },
    [disabled, processFile]
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      const firstFile = files?.[0];
      if (firstFile) {
        processFile(firstFile);
      }
      // Reset input so same file can be selected again
      e.target.value = '';
    },
    [processFile]
  );

  const handleClick = useCallback(() => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [disabled]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleClick();
      }
    },
    [handleClick]
  );

  // If there's a current photo, show preview mode
  if (currentPhoto) {
    return (
      <div className="relative w-full max-w-xs">
        <div className="relative aspect-square rounded-lg overflow-hidden border border-bdr-default">
          <img
            src={currentPhoto}
            alt="Current photo"
            className="w-full h-full object-cover"
          />
          {onRemove && !disabled && (
            <button
              type="button"
              onClick={onRemove}
              className="
                absolute top-2 right-2 p-1.5 rounded-full
                bg-black/60 text-white hover:bg-black/80
                transition-colors focus:outline-none focus:ring-2
                focus:ring-interactive-primary focus:ring-offset-2 focus:ring-offset-bg-surface
              "
              aria-label="Remove photo"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={handleClick}
          disabled={disabled}
          className="
            mt-3 w-full px-4 py-2 text-sm font-medium
            text-txt-primary bg-bg-surface border border-bdr-default rounded-lg
            hover:bg-bg-hover disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors
          "
        >
          Change Photo
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_TYPES.join(',')}
          onChange={handleFileInputChange}
          className="hidden"
          aria-hidden="true"
        />
      </div>
    );
  }

  // Upload zone mode
  return (
    <div className="w-full max-w-xs">
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`
          aspect-square rounded-lg border-2 border-dashed
          flex flex-col items-center justify-center gap-3
          cursor-pointer transition-colors
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${isDragging
            ? 'border-interactive-primary bg-interactive-primary/5'
            : 'border-bdr-default hover:border-txt-secondary hover:bg-bg-hover'
          }
          focus:outline-none focus:ring-2 focus:ring-interactive-primary focus:ring-offset-2 focus:ring-offset-bg-surface
        `}
        aria-label="Upload photo"
      >
        {isProcessing ? (
          <>
            <div className="w-10 h-10 border-2 border-txt-tertiary border-t-interactive-primary rounded-full animate-spin" />
            <span className="text-sm text-txt-secondary">Processing...</span>
          </>
        ) : (
          <>
            <div className="w-12 h-12 rounded-full bg-bg-hover flex items-center justify-center">
              {isDragging ? (
                <Upload className="w-6 h-6 text-interactive-primary" />
              ) : (
                <Camera className="w-6 h-6 text-txt-tertiary" />
              )}
            </div>
            <div className="text-center px-4">
              <p className="text-sm font-medium text-txt-primary">
                {isDragging ? 'Drop photo here' : 'Drop photo here or click to upload'}
              </p>
              <p className="text-xs text-txt-tertiary mt-1">
                JPEG, PNG, WebP up to 5MB
              </p>
            </div>
          </>
        )}
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-500" role="alert">
          {error}
        </p>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_TYPES.join(',')}
        onChange={handleFileInputChange}
        className="hidden"
        aria-hidden="true"
      />
    </div>
  );
}

export default PhotoUpload;
