import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, ArrowLeft, ArrowRight, Check, AlertCircle } from 'lucide-react';
import { useAthletes } from '@v2/hooks/useAthletes';
import { useBulkImportErgTests } from '@v2/hooks/useErgTests';
import { ErgColumnMapper } from './ErgColumnMapper';
import { ErgImportPreview } from './ErgImportPreview';
import {
  parseErgCSV,
  autoMapErgColumns,
  validateAllErgRows,
  type ColumnMapping,
  type ParsedCSV,
  type ValidatedErgTestData,
  type ValidationError,
} from '@v2/utils/ergCsvParser';

type Step = 'upload' | 'map' | 'preview' | 'importing' | 'complete';

interface ErgCSVImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (count: number) => void;
}

export function ErgCSVImportModal({ isOpen, onClose, onSuccess }: ErgCSVImportModalProps) {
  const [step, setStep] = useState<Step>('upload');
  const [parsedCSV, setParsedCSV] = useState<ParsedCSV | null>(null);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({});
  const [validRows, setValidRows] = useState<ValidatedErgTestData[]>([]);
  const [invalidRows, setInvalidRows] = useState<{ row: number; errors: ValidationError[] }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [importCount, setImportCount] = useState(0);

  const { athletes } = useAthletes();
  const { importTests, isImporting } = useBulkImportErgTests();

  // Reset state when modal closes
  const handleClose = useCallback(() => {
    setStep('upload');
    setParsedCSV(null);
    setColumnMapping({});
    setValidRows([]);
    setInvalidRows([]);
    setError(null);
    setImportCount(0);
    onClose();
  }, [onClose]);

  // Step 1: Handle file upload
  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    try {
      const parsed = await parseErgCSV(file);
      if (parsed.rowCount === 0) {
        setError('CSV file is empty');
        return;
      }

      setParsedCSV(parsed);
      const mapping = autoMapErgColumns(parsed.headers);
      setColumnMapping(mapping);
      setStep('map');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse CSV');
    }
  }, []);

  // Step 2: Validate mapping and move to preview
  const handleValidateMapping = useCallback(() => {
    if (!parsedCSV) return;

    // Check required columns are mapped
    const requiredMapped =
      columnMapping.athleteName &&
      columnMapping.testType &&
      columnMapping.testDate &&
      columnMapping.timeSeconds;

    if (!requiredMapped) {
      setError('Athlete Name, Test Type, Date, and Time must be mapped');
      return;
    }

    const result = validateAllErgRows(parsedCSV.data, columnMapping, athletes);
    setValidRows(result.validRows);
    setInvalidRows(result.invalidRows);
    setError(null);
    setStep('preview');
  }, [parsedCSV, columnMapping, athletes]);

  // Step 3: Execute import
  const handleImport = useCallback(() => {
    if (validRows.length === 0) return;

    setStep('importing');

    importTests(validRows, {
      onSuccess: (result) => {
        setImportCount(result.created);
        setStep('complete');
        onSuccess?.(result.created);
      },
      onError: (err) => {
        setError(err instanceof Error ? err.message : 'Import failed');
        setStep('preview');
      },
    });
  }, [validRows, importTests, onSuccess]);

  // Navigation
  const canGoBack = step === 'map' || step === 'preview';
  const handleBack = () => {
    if (step === 'map') setStep('upload');
    if (step === 'preview') setStep('map');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/60"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
      />

      {/* Modal */}
      <motion.div
        className="relative w-full max-w-3xl max-h-[90vh] bg-bg-surface rounded-xl shadow-2xl overflow-hidden"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-bdr-default">
          <h2 className="text-lg font-semibold text-txt-primary">Import Erg Tests from CSV</h2>
          <button
            onClick={handleClose}
            className="p-2 text-txt-secondary hover:text-txt-primary hover:bg-bg-hover rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        {/* Progress indicator */}
        <div className="px-6 py-3 border-b border-bdr-subtle">
          <div className="flex items-center gap-2">
            {(['upload', 'map', 'preview'] as const).map((s, i) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                    ${
                      step === s
                        ? 'bg-interactive-primary text-white'
                        : ['map', 'preview', 'importing', 'complete'].indexOf(step) > i
                          ? 'bg-data-excellent text-white'
                          : 'bg-bg-surface-elevated text-txt-secondary'
                    }`}
                >
                  {['map', 'preview', 'importing', 'complete'].indexOf(step) > i ? (
                    <Check size={16} />
                  ) : (
                    i + 1
                  )}
                </div>
                {i < 2 && (
                  <div
                    className={`w-12 h-0.5 mx-2 ${
                      ['map', 'preview', 'importing', 'complete'].indexOf(step) > i
                        ? 'bg-data-excellent'
                        : 'bg-bg-surface-elevated'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4 overflow-y-auto max-h-[60vh]">
          {error && (
            <div className="mb-4 p-3 bg-status-error/10 border border-status-error/20 rounded-lg flex items-center gap-2 text-status-error">
              <AlertCircle size={18} />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <AnimatePresence mode="wait">
            {/* Step 1: Upload */}
            {step === 'upload' && (
              <motion.div
                key="upload"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <p className="text-sm text-txt-secondary">
                  Upload a CSV file containing erg test data. Required columns: Athlete Name, Test
                  Type, Date, and Time.
                </p>

                <label className="block">
                  <div
                    className="border-2 border-dashed border-bdr-default rounded-lg p-8 text-center
                                  hover:border-interactive-primary hover:bg-bg-hover cursor-pointer transition-colors"
                  >
                    <Upload className="mx-auto mb-3 text-txt-tertiary" size={40} />
                    <p className="text-txt-primary font-medium">Click to select CSV file</p>
                    <p className="text-xs text-txt-tertiary mt-1">or drag and drop</p>
                  </div>
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>

                <div className="p-4 bg-bg-surface-elevated rounded-lg">
                  <h4 className="text-sm font-medium text-txt-primary mb-2">CSV Format Tips:</h4>
                  <ul className="text-xs text-txt-secondary space-y-1">
                    <li>• Athlete Name: Use "First Last" format or separate columns</li>
                    <li>• Test Type: 2k, 6k, 30min, or 500m (various formats supported)</li>
                    <li>• Time: MM:SS.s (e.g., "6:30.5") or seconds (e.g., "390.5")</li>
                    <li>• Date: YYYY-MM-DD or most common date formats</li>
                  </ul>
                </div>
              </motion.div>
            )}

            {/* Step 2: Column Mapping */}
            {step === 'map' && parsedCSV && (
              <motion.div
                key="map"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <ErgColumnMapper
                  csvHeaders={parsedCSV.headers}
                  mapping={columnMapping}
                  onChange={setColumnMapping}
                />
              </motion.div>
            )}

            {/* Step 3: Preview */}
            {step === 'preview' && (
              <motion.div
                key="preview"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <ErgImportPreview
                  validRows={validRows}
                  invalidRows={invalidRows}
                  totalValid={validRows.length}
                  totalInvalid={invalidRows.length}
                />
              </motion.div>
            )}

            {/* Step 4: Importing */}
            {step === 'importing' && (
              <motion.div
                key="importing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-12 text-center"
              >
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-interactive-primary mx-auto" />
                <p className="mt-4 text-txt-secondary">Importing {validRows.length} erg tests...</p>
              </motion.div>
            )}

            {/* Step 5: Complete */}
            {step === 'complete' && (
              <motion.div
                key="complete"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-12 text-center"
              >
                <div className="w-16 h-16 bg-data-excellent/20 rounded-full flex items-center justify-center mx-auto">
                  <Check className="text-data-excellent" size={32} />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-txt-primary">Import Complete</h3>
                <p className="mt-2 text-txt-secondary">
                  Successfully imported {importCount} erg tests
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-bdr-default flex items-center justify-between">
          <div>
            {canGoBack && (
              <button
                onClick={handleBack}
                className="flex items-center gap-2 px-4 py-2 text-txt-secondary hover:text-txt-primary"
              >
                <ArrowLeft size={18} />
                Back
              </button>
            )}
          </div>

          <div className="flex gap-3">
            {step === 'complete' ? (
              <button
                onClick={handleClose}
                className="px-4 py-2 bg-interactive-primary text-white rounded-lg font-medium hover:bg-interactive-hover"
              >
                Done
              </button>
            ) : (
              <>
                <button
                  onClick={handleClose}
                  className="px-4 py-2 text-txt-secondary hover:text-txt-primary"
                >
                  Cancel
                </button>

                {step === 'map' && (
                  <button
                    onClick={handleValidateMapping}
                    disabled={
                      !columnMapping.athleteName ||
                      !columnMapping.testType ||
                      !columnMapping.testDate ||
                      !columnMapping.timeSeconds
                    }
                    className="flex items-center gap-2 px-4 py-2 bg-interactive-primary text-white rounded-lg
                               font-medium hover:bg-interactive-hover disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Preview
                    <ArrowRight size={18} />
                  </button>
                )}

                {step === 'preview' && (
                  <button
                    onClick={handleImport}
                    disabled={validRows.length === 0 || isImporting}
                    className="flex items-center gap-2 px-4 py-2 bg-interactive-primary text-white rounded-lg
                               font-medium hover:bg-interactive-hover disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {invalidRows.length > 0
                      ? `Import ${validRows.length} Valid`
                      : `Import All ${validRows.length}`}
                    <Check size={18} />
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
