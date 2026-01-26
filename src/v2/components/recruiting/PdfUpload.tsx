import { useDropzone } from 'react-dropzone';
import { Upload, FileText, X, Loader2 } from 'lucide-react';
import { useState } from 'react';

interface PdfUploadProps {
  value?: string; // Current PDF URL
  onChange: (url: string | null) => void;
  disabled?: boolean;
}

export function PdfUpload({ value, onChange, disabled }: PdfUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/v1/uploads/visit-schedule', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Upload failed');
      }

      const result = await response.json();
      onChange(result.data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload PDF');
    } finally {
      setUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxSize: 10 * 1024 * 1024,
    maxFiles: 1,
    disabled: disabled || uploading,
  });

  // Show current file if uploaded
  if (value) {
    return (
      <div className="flex items-center gap-3 p-4 bg-surface-elevated rounded-lg border border-bdr">
        <FileText className="w-8 h-8 text-interactive-primary" />
        <div className="flex-1">
          <p className="text-sm font-medium text-txt-primary">Schedule PDF uploaded</p>
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-interactive-primary hover:underline"
          >
            View PDF
          </a>
        </div>
        {!disabled && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="p-1 hover:bg-hover rounded"
          >
            <X className="w-4 h-4 text-txt-secondary" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div>
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition
          ${isDragActive ? 'border-interactive-primary bg-interactive-primary/5' : 'border-bdr'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-interactive-primary/50'}
        `}
      >
        <input {...getInputProps()} />
        {uploading ? (
          <Loader2 className="w-8 h-8 mx-auto mb-2 text-interactive-primary animate-spin" />
        ) : (
          <Upload className="w-8 h-8 mx-auto mb-2 text-txt-secondary" />
        )}
        <p className="text-sm text-txt-secondary">
          {isDragActive ? 'Drop PDF here' : 'Drag & drop PDF or click to browse'}
        </p>
        <p className="text-xs text-txt-tertiary mt-1">Max 10MB</p>
      </div>
      {error && <p className="text-sm text-status-error mt-2">{error}</p>}
    </div>
  );
}
