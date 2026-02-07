import { useState, useCallback, useMemo } from 'react';
import { Dialog } from '@headlessui/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ArrowLeft,
  ArrowRight,
  Check,
  AlertCircle,
  Upload as UploadIcon,
  Columns3,
  Eye,
  CheckCircle2,
} from 'lucide-react';
import * as Papa from 'papaparse';
import { useAthletes } from '@v2/hooks/useAthletes';
import {
  validateAllRows,
  type ColumnMapping,
  type ValidatedAthleteData,
  type ValidationError,
} from '@v2/utils/csvParser';
import type { CSVImportResult } from '@v2/types/athletes';
import { SPRING_CONFIG, MODAL_VARIANTS, usePrefersReducedMotion } from '@v2/utils/animations';

import { FileDropZone } from './FileDropZone';
import { ColumnMappingStep, autoMapColumns } from './ColumnMappingStep';
import { ImportProgressBar } from './ImportProgressBar';
import { ImportResultsSummary } from './ImportResultsSummary';

type WizardStep = 'upload' | 'map' | 'preview' | 'importing' | 'results';

interface CSVImportWizardProps {
  isOpen: boolean;
  onClose: () => void;
}

const STEPS: Array<{ key: WizardStep; label: string; icon: typeof UploadIcon }> = [
  { key: 'upload', label: 'Upload', icon: UploadIcon },
  { key: 'map', label: 'Map Columns', icon: Columns3 },
  { key: 'preview', label: 'Preview', icon: Eye },
  { key: 'results', label: 'Results', icon: CheckCircle2 },
];

const STEP_ORDER: WizardStep[] = ['upload', 'map', 'preview', 'importing', 'results'];

function getStepIndex(step: WizardStep): number {
  return STEP_ORDER.indexOf(step);
}

/** Convert column mapping from ColumnMappingStep format (csvCol -> field) to csvParser format (field -> csvCol) */
function invertMapping(mapping: Record<string, string>): ColumnMapping {
  const inverted: ColumnMapping = {};
  Object.entries(mapping).forEach(([csvCol, field]) => {
    if (field && field !== '__skip__') {
      inverted[field] = csvCol;
    }
  });
  return inverted;
}

export function CSVImportWizard({ isOpen, onClose }: CSVImportWizardProps) {
  const [step, setStep] = useState<WizardStep>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  // Parsed CSV data
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvData, setCsvData] = useState<Record<string, unknown>[]>([]);
  const [sampleData, setSampleData] = useState<string[][]>([]);

  // Column mapping (csvColumnName -> athleteFieldKey)
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});

  // Validation results
  const [validRows, setValidRows] = useState<ValidatedAthleteData[]>([]);
  const [invalidRows, setInvalidRows] = useState<{ row: number; errors: ValidationError[] }[]>([]);

  // Import progress
  const [importStage, setImportStage] = useState<
    'parsing' | 'validating' | 'importing' | 'complete'
  >('parsing');
  const [importCurrent, setImportCurrent] = useState(0);

  // Import result
  const [importResult, setImportResult] = useState<CSVImportResult | null>(null);

  const { importAthletes, isImporting } = useAthletes();
  const prefersReducedMotion = usePrefersReducedMotion();
  const springTransition = prefersReducedMotion ? { duration: 0 } : SPRING_CONFIG;

  // Reset all state
  const resetWizard = useCallback(() => {
    setStep('upload');
    setSelectedFile(null);
    setFileError(null);
    setCsvHeaders([]);
    setCsvData([]);
    setSampleData([]);
    setColumnMapping({});
    setValidRows([]);
    setInvalidRows([]);
    setImportStage('parsing');
    setImportCurrent(0);
    setImportResult(null);
  }, []);

  const handleClose = useCallback(() => {
    resetWizard();
    onClose();
  }, [resetWizard, onClose]);

  // Step 1: File selected - parse CSV
  const handleFileSelected = useCallback((file: File) => {
    setSelectedFile(file);
    setFileError(null);
    setImportStage('parsing');

    // Use worker thread for files > 500KB
    const useWorker = file.size > 500 * 1024;

    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: 'greedy',
      worker: useWorker,
      transformHeader: (header: string) => header.trim(),
      complete: (results) => {
        const headers = results.meta.fields || [];
        const data = results.data as Record<string, unknown>[];

        if (headers.length === 0 || data.length === 0) {
          setFileError('CSV file appears empty or has no valid data.');
          return;
        }

        setCsvHeaders(headers);
        setCsvData(data);

        // Build sample data as 2D array for preview
        const samples = data.slice(0, 3).map((row) =>
          headers.map((h) => {
            const val = row[h];
            return val !== null && val !== undefined ? String(val) : '';
          })
        );
        setSampleData(samples);

        // Auto-map columns
        const mapping = autoMapColumns(headers);
        setColumnMapping(mapping);

        setStep('map');
      },
      error: (error) => {
        setFileError(`Failed to parse CSV: ${error.message}`);
      },
    });
  }, []);

  // Step 2 -> 3: Validate mapping and move to preview
  const handleValidateMapping = useCallback(() => {
    if (csvData.length === 0) return;

    // Convert our mapping format (csvCol -> field) to csvParser format (field -> csvCol)
    const invertedMapping = invertMapping(columnMapping);

    // Check required fields are mapped
    if (!invertedMapping.firstName || !invertedMapping.lastName) {
      setFileError('First Name and Last Name must be mapped to proceed.');
      return;
    }

    setFileError(null);
    const result = validateAllRows(csvData, invertedMapping);
    setValidRows(result.validRows);
    setInvalidRows(result.invalidRows);
    setStep('preview');
  }, [csvData, columnMapping]);

  // Step 3 -> 4: Execute import
  const handleImport = useCallback(() => {
    if (validRows.length === 0) return;

    setStep('importing');
    setImportStage('importing');
    setImportCurrent(0);

    // Convert validated data to athlete create format
    const athletesToImport = validRows.map((row) => ({
      firstName: row.firstName,
      lastName: row.lastName,
      email: row.email || null,
      side: row.side || null,
      canScull: row.canScull || false,
      canCox: row.canCox || false,
      heightCm: row.heightCm || null,
      weightKg: row.weightKg || null,
      isManaged: true,
      userId: null,
      concept2UserId: null,
      country: null,
      avatar: null,
      status: 'active' as const,
      classYear: null,
    }));

    // Simulate progress (API is a single bulk call, but show progress)
    const progressInterval = setInterval(() => {
      setImportCurrent((prev) => {
        const next = prev + Math.ceil(athletesToImport.length / 10);
        return Math.min(next, athletesToImport.length - 1);
      });
    }, 200);

    importAthletes(athletesToImport, {
      onSuccess: (result) => {
        clearInterval(progressInterval);
        setImportCurrent(athletesToImport.length);
        setImportStage('complete');
        setImportResult(result);

        // Brief pause to show 100% before switching to results
        setTimeout(() => {
          setStep('results');
        }, 500);
      },
      onError: (err) => {
        clearInterval(progressInterval);
        setFileError(err instanceof Error ? err.message : 'Import failed. Please try again.');
        setStep('preview');
      },
    });
  }, [validRows, importAthletes]);

  // Navigation helpers
  const canGoBack = step === 'map' || step === 'preview';
  const handleBack = useCallback(() => {
    setFileError(null);
    if (step === 'map') setStep('upload');
    if (step === 'preview') setStep('map');
  }, [step]);

  // "Import More" from results
  const handleImportMore = useCallback(() => {
    resetWizard();
  }, [resetWizard]);

  // Required fields mapped check
  const requiredFieldsMapped = useMemo(() => {
    const mappedFields = new Set(Object.values(columnMapping));
    return mappedFields.has('firstName') && mappedFields.has('lastName');
  }, [columnMapping]);

  return (
    <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
      {/* Backdrop */}
      <motion.div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        aria-hidden="true"
      />

      {/* Modal container */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-2xl max-h-[85vh]">
          <motion.div
            variants={MODAL_VARIANTS}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={springTransition}
            className="w-full max-h-[85vh] bg-bg-surface rounded-xl shadow-2xl
                       border border-bdr-subtle overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-bdr-default shrink-0">
              <Dialog.Title className="text-lg font-semibold text-txt-primary">
                Import Athletes from CSV
              </Dialog.Title>
              <button
                onClick={handleClose}
                className="p-2 text-txt-secondary hover:text-txt-primary hover:bg-bg-hover
                         rounded-lg transition-colors"
                aria-label="Close import wizard"
              >
                <X size={20} />
              </button>
            </div>

            {/* Step indicator */}
            {step !== 'importing' && (
              <div className="px-6 py-3 border-b border-bdr-subtle shrink-0">
                <div className="flex items-center gap-1">
                  {STEPS.map((s, i) => {
                    const stepIdx = getStepIndex(s.key);
                    const currentIdx = getStepIndex(step);
                    const isComplete = currentIdx > stepIdx || step === 'results';
                    const isCurrent = s.key === step || (step === 'results' && s.key === 'results');
                    const Icon = s.icon;

                    return (
                      <div key={s.key} className="flex items-center">
                        <div className="flex items-center gap-2">
                          <div
                            className={`
                            w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                            transition-colors
                            ${
                              isCurrent
                                ? 'bg-interactive-primary text-white'
                                : isComplete
                                  ? 'bg-status-success text-white'
                                  : 'bg-bg-surface-elevated text-txt-tertiary'
                            }
                          `}
                          >
                            {isComplete && !isCurrent ? <Check size={16} /> : <Icon size={16} />}
                          </div>
                          <span
                            className={`text-xs font-medium hidden sm:block ${
                              isCurrent ? 'text-txt-primary' : 'text-txt-tertiary'
                            }`}
                          >
                            {s.label}
                          </span>
                        </div>
                        {i < STEPS.length - 1 && (
                          <div
                            className={`w-8 h-0.5 mx-2 ${
                              isComplete ? 'bg-status-success' : 'bg-bg-surface-elevated'
                            }`}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {/* Error banner */}
              {fileError && step !== 'importing' && (
                <div
                  className="mb-4 p-3 bg-status-error/10 border border-status-error/20 rounded-lg
                              flex items-center gap-2 text-status-error"
                >
                  <AlertCircle size={18} className="shrink-0" />
                  <span className="text-sm">{fileError}</span>
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
                    transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.2 }}
                    className="space-y-4"
                  >
                    <p className="text-sm text-txt-secondary">
                      Upload a CSV file containing athlete information. The file should have columns
                      for at least first name and last name.
                    </p>
                    <FileDropZone
                      onFileSelected={handleFileSelected}
                      selectedFile={selectedFile}
                      error={null}
                    />
                  </motion.div>
                )}

                {/* Step 2: Column Mapping */}
                {step === 'map' && (
                  <motion.div
                    key="map"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.2 }}
                  >
                    <ColumnMappingStep
                      columns={csvHeaders}
                      sampleData={sampleData}
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
                    transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.2 }}
                    className="space-y-6"
                  >
                    {/* Summary stats */}
                    <div className="flex items-center gap-4">
                      <div
                        className="flex items-center gap-2 px-4 py-2 bg-status-success/10
                                    text-status-success rounded-lg"
                      >
                        <CheckCircle2 size={18} />
                        <span className="font-medium">{validRows.length} valid</span>
                      </div>
                      {invalidRows.length > 0 && (
                        <div
                          className="flex items-center gap-2 px-4 py-2 bg-status-error/10
                                      text-status-error rounded-lg"
                        >
                          <AlertCircle size={18} />
                          <span className="font-medium">{invalidRows.length} with errors</span>
                        </div>
                      )}
                    </div>

                    {/* Invalid rows */}
                    {invalidRows.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium text-txt-primary">Rows with errors:</h4>
                        <div className="max-h-48 overflow-y-auto space-y-2">
                          {invalidRows.slice(0, 20).map(({ row, errors }) => (
                            <div
                              key={row}
                              className="p-3 bg-status-error/5 border border-status-error/20 rounded-lg"
                            >
                              <div className="text-sm font-medium text-status-error">Row {row}</div>
                              <ul className="mt-1 space-y-1">
                                {errors.map((error, i) => (
                                  <li key={i} className="text-xs text-status-error/80">
                                    <span className="font-medium">{error.column}:</span>{' '}
                                    {error.message}
                                    {error.value !== null && error.value !== undefined && (
                                      <span className="opacity-70">
                                        {' '}
                                        (got: &quot;{String(error.value)}&quot;)
                                      </span>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                          {invalidRows.length > 20 && (
                            <p className="text-xs text-txt-tertiary">
                              And {invalidRows.length - 20} more rows with errors...
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Valid rows preview */}
                    {validRows.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium text-txt-primary">
                          Preview ({Math.min(5, validRows.length)} of {validRows.length} valid
                          rows):
                        </h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-txt-secondary text-xs uppercase">
                                <th className="px-3 py-2 text-left">Name</th>
                                <th className="px-3 py-2 text-left">Email</th>
                                <th className="px-3 py-2 text-left">Side</th>
                                <th className="px-3 py-2 text-left">Height</th>
                                <th className="px-3 py-2 text-left">Weight</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-bdr-subtle">
                              {validRows.slice(0, 5).map((row, i) => (
                                <tr key={i} className="text-txt-primary">
                                  <td className="px-3 py-2">
                                    {row.firstName} {row.lastName}
                                  </td>
                                  <td className="px-3 py-2 text-txt-secondary">
                                    {row.email || '--'}
                                  </td>
                                  <td className="px-3 py-2">{row.side || '--'}</td>
                                  <td className="px-3 py-2">
                                    {row.heightCm ? `${row.heightCm} cm` : '--'}
                                  </td>
                                  <td className="px-3 py-2">
                                    {row.weightKg ? `${row.weightKg} kg` : '--'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Step 4: Importing */}
                {step === 'importing' && (
                  <motion.div
                    key="importing"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ImportProgressBar
                      stage={importStage}
                      current={importCurrent}
                      total={validRows.length}
                    />
                  </motion.div>
                )}

                {/* Step 5: Results */}
                {step === 'results' && importResult && (
                  <motion.div
                    key="results"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.2 }}
                  >
                    <ImportResultsSummary
                      result={importResult}
                      onImportMore={handleImportMore}
                      onDone={handleClose}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            {step !== 'importing' && step !== 'results' && (
              <div className="px-6 py-4 border-t border-bdr-default flex items-center justify-between shrink-0">
                <div>
                  {canGoBack && (
                    <button
                      onClick={handleBack}
                      className="flex items-center gap-2 px-4 py-2 text-txt-secondary
                               hover:text-txt-primary transition-colors"
                    >
                      <ArrowLeft size={18} />
                      Back
                    </button>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleClose}
                    className="px-4 py-2 text-txt-secondary hover:text-txt-primary transition-colors"
                  >
                    Cancel
                  </button>

                  {step === 'map' && (
                    <button
                      onClick={handleValidateMapping}
                      disabled={!requiredFieldsMapped}
                      className="flex items-center gap-2 px-4 py-2 bg-interactive-primary text-white
                               rounded-lg font-medium hover:bg-interactive-hover
                               disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Preview
                      <ArrowRight size={18} />
                    </button>
                  )}

                  {step === 'preview' && (
                    <button
                      onClick={handleImport}
                      disabled={validRows.length === 0 || isImporting}
                      className="flex items-center gap-2 px-4 py-2 bg-interactive-primary text-white
                               rounded-lg font-medium hover:bg-interactive-hover
                               disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {invalidRows.length > 0
                        ? `Import ${validRows.length} Valid`
                        : `Import All ${validRows.length}`}
                      <Check size={18} />
                    </button>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
