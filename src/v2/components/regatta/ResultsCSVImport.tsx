import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, AlertCircle, Check, ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { RaceResultFormData, Race } from '../../types/regatta';
import { useBatchAddResults } from '../../hooks/useRaces';
import { parseTimeToSeconds } from '../../utils/timeFormatters';

type Step = 'upload' | 'map' | 'preview' | 'importing' | 'complete';

type ColumnMapping = {
  teamName?: string;
  place?: string;
  finishTime?: string;
  isOwnTeam?: string;
};

type ParsedRow = {
  teamName: string;
  place: number | null;
  finishTimeSeconds: number | null;
  isOwnTeam: boolean;
  errors: string[];
  rowIndex: number;
};

type ResultsCSVImportProps = {
  race: Race;
  onClose: () => void;
  onSuccess?: () => void;
};

export function ResultsCSVImport({ race, onClose, onSuccess }: ResultsCSVImportProps) {
  const [step, setStep] = useState<Step>('upload');
  const [rawData, setRawData] = useState<string[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [importResult, setImportResult] = useState<{ success: number; failed: number } | null>(null);

  const batchAddResults = useBatchAddResults();

  // File drop handler
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    Papa.parse(file, {
      complete: (results) => {
        const data = results.data as string[][];
        if (data.length > 0) {
          setHeaders(data[0]);
          setRawData(data.slice(1).filter(row => row.some(cell => cell.trim())));
          setStep('map');

          // Auto-detect column mappings
          const detectedMapping: ColumnMapping = {};
          data[0].forEach((header) => {
            const h = header.toLowerCase().trim();
            if (h.includes('team') || h.includes('school') || h.includes('crew') || h.includes('name')) {
              detectedMapping.teamName = header;
            } else if (h.includes('place') || h.includes('pos') || h.includes('finish') || h === 'pl') {
              detectedMapping.place = header;
            } else if (h.includes('time') || h.includes('split') || h.includes('elapsed')) {
              detectedMapping.finishTime = header;
            }
          });
          setMapping(detectedMapping);
        }
      },
      error: (error) => {
        console.error('CSV parse error:', error);
      },
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    maxFiles: 1,
  });

  // Parse rows based on mapping
  const parseRows = useCallback(() => {
    const rows: ParsedRow[] = rawData.map((row, rowIndex) => {
      const getCol = (col?: string) => {
        if (!col) return '';
        const idx = headers.indexOf(col);
        return idx >= 0 ? row[idx]?.trim() || '' : '';
      };

      const errors: string[] = [];
      const teamName = getCol(mapping.teamName);
      const placeStr = getCol(mapping.place);
      const timeStr = getCol(mapping.finishTime);
      const ownStr = getCol(mapping.isOwnTeam);

      // Parse place
      let place: number | null = null;
      if (placeStr) {
        const parsed = parseInt(placeStr, 10);
        if (!isNaN(parsed) && parsed > 0) {
          place = parsed;
        } else {
          errors.push(`Invalid place: "${placeStr}"`);
        }
      }

      // Parse time
      let finishTimeSeconds: number | null = null;
      if (timeStr) {
        finishTimeSeconds = parseTimeToSeconds(timeStr);
        if (finishTimeSeconds === null) {
          errors.push(`Invalid time format: "${timeStr}"`);
        }
      }

      // Validation
      if (!teamName) {
        errors.push('Team name is required');
      }
      if (!place && !finishTimeSeconds) {
        errors.push('Either place or time is required');
      }

      // Is own team (detect from "us", "own", etc.)
      const isOwnTeam = ownStr
        ? ['yes', 'true', '1', 'us', 'own'].includes(ownStr.toLowerCase())
        : false;

      return {
        teamName,
        place,
        finishTimeSeconds,
        isOwnTeam,
        errors,
        rowIndex: rowIndex + 2, // +2 for 1-indexed and header row
      };
    });

    setParsedRows(rows);
    setStep('preview');
  }, [rawData, headers, mapping]);

  // Import results
  const handleImport = async () => {
    setStep('importing');

    const validRows = parsedRows.filter(r => r.errors.length === 0);
    const results: RaceResultFormData[] = validRows.map(r => ({
      teamName: r.teamName,
      isOwnTeam: r.isOwnTeam,
      lineupId: null,
      finishTimeSeconds: r.finishTimeSeconds,
      place: r.place,
      marginBackSeconds: null,
      rawSpeed: null,
      adjustedSpeed: null,
    }));

    try {
      await batchAddResults.mutateAsync({ raceId: race.id, results });
      setImportResult({ success: validRows.length, failed: parsedRows.length - validRows.length });
      setStep('complete');
      onSuccess?.();
    } catch (error) {
      console.error('Import failed:', error);
      setImportResult({ success: 0, failed: parsedRows.length });
      setStep('complete');
    }
  };

  // Stats for preview
  const validCount = parsedRows.filter(r => r.errors.length === 0).length;
  const invalidCount = parsedRows.length - validCount;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-txt-primary">Import Results from CSV</h3>
          <p className="text-sm text-txt-secondary">
            {race.eventName} ({race.boatClass})
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-ink-hover text-txt-tertiary"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Progress indicator */}
      <div className="flex items-center gap-2">
        {['upload', 'map', 'preview', 'complete'].map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step === s
                  ? 'bg-data-good text-white'
                  : ['complete'].includes(step) || i < ['upload', 'map', 'preview', 'complete'].indexOf(step)
                  ? 'bg-data-excellent text-white'
                  : 'bg-ink-raised text-txt-tertiary'
              }`}
            >
              {['complete'].includes(step) || i < ['upload', 'map', 'preview', 'complete'].indexOf(step) ? (
                <Check className="w-4 h-4" />
              ) : (
                i + 1
              )}
            </div>
            {i < 3 && <div className="w-12 h-0.5 bg-ink-raised" />}
          </div>
        ))}
      </div>

      {/* Step content */}
      <AnimatePresence mode="wait">
        {step === 'upload' && (
          <motion.div
            key="upload"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? 'border-accent-primary bg-data-good/5'
                  : 'border-ink-border hover:border-ink-border-strong'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="w-12 h-12 mx-auto mb-4 text-txt-tertiary" />
              <p className="text-txt-primary font-medium">
                {isDragActive ? 'Drop CSV file here' : 'Drag & drop a CSV file'}
              </p>
              <p className="text-sm text-txt-secondary mt-1">or click to browse</p>
            </div>

            <div className="mt-4 p-4 bg-ink-raised rounded-lg">
              <p className="text-sm font-medium text-txt-primary">Expected CSV format:</p>
              <p className="text-xs text-txt-secondary mt-1">
                Columns: Team/School Name, Place (optional), Time (optional)
              </p>
              <p className="text-xs text-txt-tertiary mt-1">
                Either place or time is required. Time formats: M:SS.s, MM:SS, or seconds.
              </p>
            </div>
          </motion.div>
        )}

        {step === 'map' && (
          <motion.div
            key="map"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <p className="text-sm text-txt-secondary">
              Map your CSV columns to the required fields:
            </p>

            <div className="grid grid-cols-2 gap-4">
              {/* Team Name (required) */}
              <div>
                <label className="block text-sm font-medium text-txt-primary mb-1">
                  Team Name *
                </label>
                <select
                  value={mapping.teamName || ''}
                  onChange={(e) => setMapping(m => ({ ...m, teamName: e.target.value || undefined }))}
                  className="w-full px-3 py-2 bg-ink-well border border-ink-border rounded-lg
                           text-txt-primary focus:outline-none focus:ring-2 focus:ring-focus-ring"
                >
                  <option value="">Select column</option>
                  {headers.map(h => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>

              {/* Place */}
              <div>
                <label className="block text-sm font-medium text-txt-primary mb-1">
                  Place
                </label>
                <select
                  value={mapping.place || ''}
                  onChange={(e) => setMapping(m => ({ ...m, place: e.target.value || undefined }))}
                  className="w-full px-3 py-2 bg-ink-well border border-ink-border rounded-lg
                           text-txt-primary focus:outline-none focus:ring-2 focus:ring-focus-ring"
                >
                  <option value="">Select column</option>
                  {headers.map(h => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>

              {/* Finish Time */}
              <div>
                <label className="block text-sm font-medium text-txt-primary mb-1">
                  Finish Time
                </label>
                <select
                  value={mapping.finishTime || ''}
                  onChange={(e) => setMapping(m => ({ ...m, finishTime: e.target.value || undefined }))}
                  className="w-full px-3 py-2 bg-ink-well border border-ink-border rounded-lg
                           text-txt-primary focus:outline-none focus:ring-2 focus:ring-focus-ring"
                >
                  <option value="">Select column</option>
                  {headers.map(h => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>

              {/* Is Own Team (optional) */}
              <div>
                <label className="block text-sm font-medium text-txt-primary mb-1">
                  Own Team Flag (optional)
                </label>
                <select
                  value={mapping.isOwnTeam || ''}
                  onChange={(e) => setMapping(m => ({ ...m, isOwnTeam: e.target.value || undefined }))}
                  className="w-full px-3 py-2 bg-ink-well border border-ink-border rounded-lg
                           text-txt-primary focus:outline-none focus:ring-2 focus:ring-focus-ring"
                >
                  <option value="">None</option>
                  {headers.map(h => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Sample data preview */}
            <div className="mt-4">
              <p className="text-sm font-medium text-txt-secondary mb-2">Sample data (first 3 rows):</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-ink-border">
                      {headers.map(h => (
                        <th key={h} className="px-3 py-2 text-left text-txt-secondary font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rawData.slice(0, 3).map((row, i) => (
                      <tr key={i} className="border-b border-ink-border">
                        {row.map((cell, j) => (
                          <td key={j} className="px-3 py-2 text-txt-primary">{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between pt-4">
              <button
                onClick={() => setStep('upload')}
                className="flex items-center gap-2 px-4 py-2 text-sm text-txt-secondary hover:text-txt-primary"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
              <button
                onClick={parseRows}
                disabled={!mapping.teamName}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white
                         bg-data-good rounded-lg hover:bg-data-good-hover
                         disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Preview
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {step === 'preview' && (
          <motion.div
            key="preview"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            {/* Summary */}
            <div className="flex gap-4">
              <div className="flex-1 p-4 bg-data-excellent/10 rounded-lg">
                <p className="text-2xl font-bold text-data-excellent">{validCount}</p>
                <p className="text-sm text-txt-secondary">Valid rows</p>
              </div>
              {invalidCount > 0 && (
                <div className="flex-1 p-4 bg-red-500/10 rounded-lg">
                  <p className="text-2xl font-bold text-data-poor">{invalidCount}</p>
                  <p className="text-sm text-txt-secondary">Rows with errors</p>
                </div>
              )}
            </div>

            {/* Preview table */}
            <div className="max-h-64 overflow-y-auto border border-ink-border rounded-lg">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-ink-raised">
                  <tr className="border-b border-ink-border">
                    <th className="px-3 py-2 text-left text-txt-secondary font-medium w-8">#</th>
                    <th className="px-3 py-2 text-left text-txt-secondary font-medium">Team</th>
                    <th className="px-3 py-2 text-left text-txt-secondary font-medium">Place</th>
                    <th className="px-3 py-2 text-left text-txt-secondary font-medium">Time</th>
                    <th className="px-3 py-2 text-left text-txt-secondary font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedRows.map((row) => (
                    <tr
                      key={row.rowIndex}
                      className={`border-b border-ink-border ${
                        row.errors.length > 0 ? 'bg-red-500/5' : ''
                      }`}
                    >
                      <td className="px-3 py-2 text-txt-tertiary">{row.rowIndex}</td>
                      <td className="px-3 py-2 text-txt-primary">{row.teamName || '—'}</td>
                      <td className="px-3 py-2 text-txt-primary">{row.place || '—'}</td>
                      <td className="px-3 py-2 text-txt-primary font-mono">
                        {row.finishTimeSeconds ? `${Math.floor(row.finishTimeSeconds / 60)}:${(row.finishTimeSeconds % 60).toFixed(1).padStart(4, '0')}` : '—'}
                      </td>
                      <td className="px-3 py-2">
                        {row.errors.length > 0 ? (
                          <span className="flex items-center gap-1 text-data-poor text-xs">
                            <AlertCircle className="w-3 h-3" />
                            {row.errors[0]}
                          </span>
                        ) : (
                          <Check className="w-4 h-4 text-data-excellent" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Actions */}
            <div className="flex justify-between pt-4">
              <button
                onClick={() => setStep('map')}
                className="flex items-center gap-2 px-4 py-2 text-sm text-txt-secondary hover:text-txt-primary"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
              <button
                onClick={handleImport}
                disabled={validCount === 0}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white
                         bg-data-good rounded-lg hover:bg-data-good-hover
                         disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Import {validCount} Results
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {step === 'importing' && (
          <motion.div
            key="importing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-12 text-center"
          >
            <div className="w-12 h-12 border-4 border-accent-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="mt-4 text-txt-secondary">Importing results...</p>
          </motion.div>
        )}

        {step === 'complete' && importResult && (
          <motion.div
            key="complete"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="py-8 text-center"
          >
            {importResult.success > 0 ? (
              <>
                <div className="w-16 h-16 bg-data-excellent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-data-excellent" />
                </div>
                <h4 className="text-lg font-semibold text-txt-primary">Import Complete</h4>
                <p className="text-txt-secondary mt-1">
                  Successfully imported {importResult.success} results
                  {importResult.failed > 0 && ` (${importResult.failed} skipped)`}
                </p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-data-poor" />
                </div>
                <h4 className="text-lg font-semibold text-txt-primary">Import Failed</h4>
                <p className="text-txt-secondary mt-1">
                  No results were imported. Please check your data and try again.
                </p>
              </>
            )}

            <button
              onClick={onClose}
              className="mt-6 px-6 py-2 text-sm font-medium text-white
                       bg-data-good rounded-lg hover:bg-data-good-hover"
            >
              Done
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
