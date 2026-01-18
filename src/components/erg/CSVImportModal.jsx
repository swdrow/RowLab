import React, { useState, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { clsx } from 'clsx';
import { useCSVImportStore } from '../../store/csvImportStore';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';

/**
 * CSV Import Modal Component
 *
 * Features:
 * - File upload with drag and drop support
 * - Column mapping interface with auto-detection
 * - Preview table showing valid (green) and invalid (red) rows
 * - Import execution with progress
 * - Success/error summary
 */
function CSVImportModal({ isOpen, onClose, onSuccess }) {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [step, setStep] = useState('upload'); // 'upload' | 'mapping' | 'preview' | 'importing' | 'result'

  const {
    file,
    headers,
    mapping,
    preview,
    importing,
    error,
    result,
    setFile,
    detectMapping,
    updateMapping,
    previewImport,
    executeImport,
    reset,
    clearError,
  } = useCSVImportStore();

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      reset();
      setStep('upload');
    }
  }, [isOpen, reset]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape' && !importing) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, importing, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Handle file selection
  const handleFileSelect = useCallback(async (selectedFile) => {
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      alert('Please select a CSV file');
      return;
    }

    setFile(selectedFile);
    clearError();

    try {
      await detectMapping(selectedFile);
      setStep('mapping');
    } catch (err) {
      console.error('Failed to detect mapping:', err);
    }
  }, [setFile, detectMapping, clearError]);

  // Drag and drop handlers
  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      handleFileSelect(droppedFiles[0]);
    }
  }, [handleFileSelect]);

  // Handle file input change
  const handleInputChange = useCallback((e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  }, [handleFileSelect]);

  // Handle preview
  const handlePreview = useCallback(async () => {
    clearError();
    try {
      await previewImport();
      setStep('preview');
    } catch (err) {
      console.error('Preview failed:', err);
    }
  }, [previewImport, clearError]);

  // Handle import
  const handleImport = useCallback(async () => {
    clearError();
    setStep('importing');
    try {
      const importResult = await executeImport();
      setStep('result');
      if (importResult.created > 0 && onSuccess) {
        onSuccess(importResult);
      }
    } catch (err) {
      console.error('Import failed:', err);
      setStep('preview');
    }
  }, [executeImport, clearError, onSuccess]);

  // Handle close
  const handleClose = useCallback(() => {
    if (!importing) {
      onClose();
    }
  }, [importing, onClose]);

  // Field labels for mapping
  const fieldLabels = {
    athlete: 'Athlete Name',
    firstName: 'First Name',
    lastName: 'Last Name',
    testType: 'Test Type',
    date: 'Date',
    time: 'Time/Result',
    split: 'Split (500m)',
    watts: 'Watts',
    strokeRate: 'Stroke Rate',
    weight: 'Weight (kg)',
    notes: 'Notes',
  };

  // Required fields for import
  const requiredFields = ['athlete', 'testType', 'date', 'time'];

  // Check if required mappings are complete
  const hasRequiredMappings = requiredFields.every(
    (field) => mapping[field] || (field === 'athlete' && (mapping.firstName && mapping.lastName))
  );

  if (!isOpen) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={handleClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-surface-900/80 backdrop-blur-xl" />

      {/* Modal */}
      <div
        className={clsx(
          'relative w-full max-w-4xl',
          'bg-surface-800 border border-border-subtle',
          'rounded-2xl shadow-floating',
          'overflow-hidden',
          'animate-scale-in'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-border-subtle flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-text-primary">
              Import Erg Tests from CSV
            </h2>
            <p className="text-sm text-text-secondary mt-1">
              {step === 'upload' && 'Upload a CSV file with erg test data'}
              {step === 'mapping' && 'Map CSV columns to data fields'}
              {step === 'preview' && 'Review data before importing'}
              {step === 'importing' && 'Importing data...'}
              {step === 'result' && 'Import complete'}
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={importing}
            className={clsx(
              'p-2 rounded-lg text-text-tertiary',
              'hover:bg-surface-700 hover:text-text-primary',
              'transition-colors duration-200',
              'focus:outline-none focus:ring-2 focus:ring-accent/50',
              importing && 'opacity-50 cursor-not-allowed'
            )}
            aria-label="Close modal"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-spectrum-red/10 border border-spectrum-red/30 text-spectrum-red rounded-lg text-sm flex items-center gap-2">
              <AlertIcon className="w-5 h-5 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Step: Upload */}
          {step === 'upload' && (
            <div
              className={clsx(
                'border-2 border-dashed rounded-xl p-12',
                'transition-colors duration-200',
                isDragging
                  ? 'border-accent bg-accent/10'
                  : 'border-border-default hover:border-border-strong'
              )}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-surface-700 flex items-center justify-center">
                  <UploadIcon className="w-8 h-8 text-text-tertiary" />
                </div>
                <p className="text-lg font-medium text-text-primary mb-2">
                  Drag and drop your CSV file here
                </p>
                <p className="text-sm text-text-secondary mb-4">
                  or click to browse
                </p>
                <Button
                  variant="secondary"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Select File
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleInputChange}
                  className="hidden"
                />
                <p className="text-xs text-text-muted mt-4">
                  Supported format: CSV (max 5MB)
                </p>
              </div>
            </div>
          )}

          {/* Step: Mapping */}
          {step === 'mapping' && (
            <div className="space-y-6">
              <Card padding="md">
                <div className="flex items-center gap-3 mb-4">
                  <FileIcon className="w-5 h-5 text-text-tertiary" />
                  <span className="text-text-primary font-medium">{file?.name}</span>
                  <Badge variant="default" size="sm">
                    {headers.length} columns detected
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(fieldLabels).map(([field, label]) => (
                    <div key={field} className="flex items-center gap-3">
                      <label className={clsx(
                        'text-sm w-32 flex-shrink-0',
                        requiredFields.includes(field) ? 'text-text-primary font-medium' : 'text-text-secondary'
                      )}>
                        {label}
                        {requiredFields.includes(field) && (
                          <span className="text-spectrum-red ml-1">*</span>
                        )}
                      </label>
                      <select
                        value={mapping[field] || ''}
                        onChange={(e) => updateMapping(field, e.target.value)}
                        className={clsx(
                          'flex-1 px-3 py-2 rounded-lg text-sm',
                          'bg-surface-850 border border-border-default',
                          'text-text-primary',
                          'focus:border-accent focus:ring-2 focus:ring-accent/20',
                          'outline-none transition-all duration-200'
                        )}
                      >
                        <option value="">-- Select column --</option>
                        {headers.map((header) => (
                          <option key={header} value={header}>
                            {header}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>

                {!hasRequiredMappings && (
                  <div className="mt-4 p-3 bg-warning/10 border border-warning/30 text-warning rounded-lg text-sm">
                    Please map all required fields (marked with *) before continuing.
                    You need either Athlete Name or both First Name and Last Name.
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* Step: Preview */}
          {step === 'preview' && preview && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="flex items-center gap-4">
                <Badge variant="success" size="md">
                  {preview.valid.length} valid rows
                </Badge>
                {preview.invalid.length > 0 && (
                  <Badge variant="error" size="md">
                    {preview.invalid.length} invalid rows
                  </Badge>
                )}
                <span className="text-sm text-text-secondary">
                  Total: {preview.totalRows} rows
                </span>
              </div>

              {/* Preview Table */}
              <div className="border border-border-subtle rounded-lg overflow-hidden">
                <div className="overflow-x-auto max-h-96">
                  <table className="w-full text-sm">
                    <thead className="bg-surface-700 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left text-text-secondary font-medium w-16">
                          Row
                        </th>
                        <th className="px-4 py-3 text-left text-text-secondary font-medium w-20">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-text-secondary font-medium">
                          Athlete
                        </th>
                        <th className="px-4 py-3 text-left text-text-secondary font-medium">
                          Test Type
                        </th>
                        <th className="px-4 py-3 text-left text-text-secondary font-medium">
                          Date
                        </th>
                        <th className="px-4 py-3 text-left text-text-secondary font-medium">
                          Time
                        </th>
                        <th className="px-4 py-3 text-left text-text-secondary font-medium">
                          Details / Errors
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Valid rows */}
                      {preview.valid.slice(0, 10).map((item) => (
                        <tr
                          key={`valid-${item.row}`}
                          className="border-t border-border-subtle bg-success/5"
                        >
                          <td className="px-4 py-3 text-text-secondary">{item.row}</td>
                          <td className="px-4 py-3">
                            <Badge variant="success" size="xs">Valid</Badge>
                          </td>
                          <td className="px-4 py-3 text-text-primary">
                            {item.data.athleteId ? 'Matched' : '-'}
                          </td>
                          <td className="px-4 py-3 text-text-primary">{item.data.testType}</td>
                          <td className="px-4 py-3 text-text-primary">
                            {item.data.testDate ? new Date(item.data.testDate).toLocaleDateString() : '-'}
                          </td>
                          <td className="px-4 py-3 text-text-primary">
                            {item.data.timeSeconds ? formatTime(item.data.timeSeconds) : '-'}
                          </td>
                          <td className="px-4 py-3 text-text-secondary text-xs">
                            {item.data.splitSeconds && `Split: ${formatTime(item.data.splitSeconds)}`}
                            {item.data.watts && ` | ${item.data.watts}W`}
                            {item.data.strokeRate && ` | ${item.data.strokeRate}spm`}
                          </td>
                        </tr>
                      ))}

                      {/* Invalid rows */}
                      {preview.invalid.slice(0, 10).map((item) => (
                        <tr
                          key={`invalid-${item.row}`}
                          className="border-t border-border-subtle bg-spectrum-red/5"
                        >
                          <td className="px-4 py-3 text-text-secondary">{item.row}</td>
                          <td className="px-4 py-3">
                            <Badge variant="error" size="xs">Invalid</Badge>
                          </td>
                          <td colSpan={5} className="px-4 py-3">
                            <div className="text-spectrum-red text-xs space-y-1">
                              {item.errors.map((err, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                  <AlertIcon className="w-3 h-3 flex-shrink-0" />
                                  {err}
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Show more indicator */}
                {(preview.valid.length > 10 || preview.invalid.length > 10) && (
                  <div className="px-4 py-2 bg-surface-700 text-center text-xs text-text-tertiary">
                    Showing first 10 rows of each type.{' '}
                    {preview.valid.length > 10 && `${preview.valid.length - 10} more valid rows. `}
                    {preview.invalid.length > 10 && `${preview.invalid.length - 10} more invalid rows.`}
                  </div>
                )}
              </div>

              {preview.valid.length === 0 && (
                <div className="p-4 bg-spectrum-red/10 border border-spectrum-red/30 text-spectrum-red rounded-lg text-sm">
                  No valid rows found. Please check your CSV file and column mappings.
                </div>
              )}
            </div>
          )}

          {/* Step: Importing */}
          {step === 'importing' && (
            <div className="py-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent/10 flex items-center justify-center">
                <LoadingSpinner className="w-8 h-8 text-accent" />
              </div>
              <p className="text-lg font-medium text-text-primary mb-2">
                Importing data...
              </p>
              <p className="text-sm text-text-secondary">
                Please wait while we import your erg test data.
              </p>
            </div>
          )}

          {/* Step: Result */}
          {step === 'result' && result && (
            <div className="py-8 text-center">
              <div className={clsx(
                'w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center',
                result.errors.length === 0 ? 'bg-success/10' : 'bg-warning/10'
              )}>
                {result.errors.length === 0 ? (
                  <CheckIcon className="w-8 h-8 text-success" />
                ) : (
                  <AlertIcon className="w-8 h-8 text-warning" />
                )}
              </div>

              <h3 className="text-xl font-semibold text-text-primary mb-2">
                Import Complete
              </h3>

              <div className="flex items-center justify-center gap-4 mb-4">
                <Badge variant="success" size="lg">
                  {result.created} tests created
                </Badge>
                {result.errors.length > 0 && (
                  <Badge variant="error" size="lg">
                    {result.errors.length} errors
                  </Badge>
                )}
              </div>

              {result.errors.length > 0 && (
                <div className="mt-4 text-left max-w-lg mx-auto">
                  <p className="text-sm text-text-secondary mb-2">Errors:</p>
                  <div className="bg-surface-850 rounded-lg p-3 max-h-32 overflow-y-auto">
                    {result.errors.map((err, idx) => (
                      <div key={idx} className="text-xs text-spectrum-red mb-1">
                        Row {err.row}: {err.error}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border-subtle flex items-center justify-between">
          <div>
            {step === 'mapping' && (
              <Button
                variant="ghost"
                onClick={() => {
                  reset();
                  setStep('upload');
                }}
              >
                Back
              </Button>
            )}
            {step === 'preview' && (
              <Button
                variant="ghost"
                onClick={() => setStep('mapping')}
              >
                Back to Mapping
              </Button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {step !== 'result' && step !== 'importing' && (
              <Button variant="secondary" onClick={handleClose}>
                Cancel
              </Button>
            )}

            {step === 'mapping' && (
              <Button
                variant="primary"
                onClick={handlePreview}
                disabled={!hasRequiredMappings || importing}
                isLoading={importing}
              >
                Preview Import
              </Button>
            )}

            {step === 'preview' && preview && preview.valid.length > 0 && (
              <Button
                variant="primary"
                onClick={handleImport}
                disabled={importing}
              >
                Import {preview.valid.length} Tests
              </Button>
            )}

            {step === 'result' && (
              <Button variant="primary" onClick={handleClose}>
                Done
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

// Helper function to format time in seconds to mm:ss.s
function formatTime(seconds) {
  if (seconds === null || seconds === undefined) return '-';
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(1);
  return `${mins}:${secs.padStart(4, '0')}`;
}

// Icons
function XIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function UploadIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
      />
    </svg>
  );
}

function FileIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  );
}

function AlertIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
  );
}

function CheckIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function LoadingSpinner({ className }) {
  return (
    <svg className={clsx('animate-spin', className)} fill="none" viewBox="0 0 24 24">
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

export { CSVImportModal };
export default CSVImportModal;
