import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, File, X, AlertTriangle, CheckCircle, Loader2, Info } from 'lucide-react';
import { useTelemetryStore } from '../../store/telemetryStore';
import SpotlightCard from '../ui/SpotlightCard';

/**
 * CSV Column mappings for each telemetry source
 */
const SOURCE_MAPPINGS = {
  empower: {
    name: 'Empower Oarlock',
    columns: {
      name: 'Name',
      seat: 'Seat',
      avgPower: 'Avg Power',
      peakPower: 'Peak Power',
      workPerStroke: 'Work/Stroke',
      catchAngle: 'Catch',
      finishAngle: 'Finish',
      slip: 'Slip',
      wash: 'Wash',
    },
  },
  peach: {
    name: 'Peach PowerLine',
    columns: {
      name: 'Athlete',
      seat: 'Position',
      avgPower: 'Average Watts',
      peakPower: 'Max Watts',
      workPerStroke: 'Work Per Stroke',
      catchAngle: 'Catch Angle',
      finishAngle: 'Finish Angle',
      slip: 'Slip',
      wash: 'Wash',
      techScore: 'Tech Score',
    },
  },
  nk: {
    name: 'NK SpeedCoach',
    columns: {
      name: 'Name',
      seat: 'Seat',
      avgPower: 'Watts',
      peakPower: 'Peak Watts',
    },
  },
};

/**
 * Custom Select component
 */
const SelectField = ({ label, required, options, className = '', ...props }) => (
  <div>
    {label && (
      <label className="block text-sm font-medium text-text-secondary mb-2">
        {label}
        {required && <span className="text-danger-red ml-1">*</span>}
      </label>
    )}
    <select
      {...props}
      className={`w-full px-4 py-2.5 rounded-lg bg-void-deep/50 border border-white/[0.06] text-text-primary focus:outline-none focus:border-blade-blue/50 focus:ring-1 focus:ring-blade-blue/20 transition-all duration-200 appearance-none cursor-pointer ${className}`}
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2371717A'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 12px center',
        backgroundSize: '16px',
      }}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value} className="bg-void-elevated">
          {opt.label}
        </option>
      ))}
    </select>
  </div>
);

/**
 * Custom Input component
 */
const InputField = ({ label, required, type = 'text', className = '', ...props }) => (
  <div>
    {label && (
      <label className="block text-sm font-medium text-text-secondary mb-2">
        {label}
        {required && <span className="text-danger-red ml-1">*</span>}
      </label>
    )}
    <input
      type={type}
      {...props}
      className={`w-full px-4 py-2.5 rounded-lg bg-void-deep/50 border border-white/[0.06] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-blade-blue/50 focus:ring-1 focus:ring-blade-blue/20 transition-all duration-200 ${className}`}
    />
  </div>
);

/**
 * Badge component
 */
const Badge = ({ children, variant = 'default', className = '' }) => {
  const variants = {
    default: 'bg-text-muted/10 text-text-muted border-text-muted/20',
    success: 'bg-blade-blue/10 text-blade-blue border-blade-blue/20',
    error: 'bg-danger-red/10 text-danger-red border-danger-red/20',
    info: 'bg-coxswain-violet/10 text-coxswain-violet border-coxswain-violet/20',
  };

  return (
    <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};

/**
 * TelemetryImport - Form for importing oarlock telemetry data
 * Redesigned with Precision Instrument design system
 */
export default function TelemetryImport() {
  const fileInputRef = useRef(null);
  const [source, setSource] = useState('empower');
  const [sessionDate, setSessionDate] = useState('');
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState([]);
  const [parseError, setParseError] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const { importTelemetry, loading, error, clearError } = useTelemetryStore();

  // Parse CSV based on source format
  const parseCSV = useCallback((text, sourceType) => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      throw new Error('CSV file must have a header row and at least one data row');
    }

    const headers = parseCSVLine(lines[0]);
    const mapping = SOURCE_MAPPINGS[sourceType].columns;

    const columnMap = {};
    Object.entries(mapping).forEach(([key, headerName]) => {
      const index = headers.findIndex(
        h => h.toLowerCase().trim() === headerName.toLowerCase()
      );
      if (index !== -1) {
        columnMap[key] = index;
      }
    });

    if (columnMap.name === undefined) {
      throw new Error(`Could not find athlete name column. Expected: "${mapping.name}"`);
    }

    const data = [];
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      if (values.length === 0) continue;

      const row = {
        athleteName: columnMap.name !== undefined ? values[columnMap.name]?.trim() : null,
        seat: columnMap.seat !== undefined ? parseInt(values[columnMap.seat]) || null : null,
        avgPower: columnMap.avgPower !== undefined ? parseFloat(values[columnMap.avgPower]) || null : null,
        peakPower: columnMap.peakPower !== undefined ? parseFloat(values[columnMap.peakPower]) || null : null,
        workPerStroke: columnMap.workPerStroke !== undefined ? parseFloat(values[columnMap.workPerStroke]) || null : null,
        catchAngle: columnMap.catchAngle !== undefined ? parseFloat(values[columnMap.catchAngle]) || null : null,
        finishAngle: columnMap.finishAngle !== undefined ? parseFloat(values[columnMap.finishAngle]) || null : null,
        slip: columnMap.slip !== undefined ? parseFloat(values[columnMap.slip]) || null : null,
        wash: columnMap.wash !== undefined ? parseFloat(values[columnMap.wash]) || null : null,
        techScore: columnMap.techScore !== undefined ? parseFloat(values[columnMap.techScore]) || null : null,
      };

      if (row.athleteName) {
        data.push(row);
      }
    }

    if (data.length === 0) {
      throw new Error('No valid data rows found in CSV');
    }

    return data;
  }, []);

  const parseCSVLine = (line) => {
    const values = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"' && nextChar === '"' && inQuotes) {
        // Escaped quote within quoted field
        current += '"';
        i++; // Skip next quote
      } else if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current);
    return values;
  };

  const processFile = useCallback((selectedFile) => {
    if (!selectedFile.name.endsWith('.csv')) {
      setParseError('Please select a CSV file');
      return;
    }

    setFile(selectedFile);
    setParseError(null);
    setParsedData([]);
    setImportResult(null);
    clearError();

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = parseCSV(e.target.result, source);
        setParsedData(parsed);
      } catch (err) {
        setParseError(err.message);
      }
    };
    reader.onerror = () => {
      setParseError('Failed to read file');
    };
    reader.readAsText(selectedFile);
  }, [source, parseCSV, clearError]);

  const handleFileChange = useCallback((e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processFile(selectedFile);
    }
  }, [processFile]);

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
      processFile(droppedFiles[0]);
    }
  }, [processFile]);

  const handleImport = useCallback(async () => {
    if (!sessionDate) {
      setParseError('Please select a session date');
      return;
    }

    if (parsedData.length === 0) {
      setParseError('No data to import');
      return;
    }

    setImportResult(null);
    clearError();

    try {
      const result = await importTelemetry(sessionDate, source, parsedData);
      setImportResult(result);
    } catch (err) {
      // Error handled by store
    }
  }, [sessionDate, source, parsedData, importTelemetry, clearError]);

  const handleReset = useCallback(() => {
    setFile(null);
    setParsedData([]);
    setParseError(null);
    setImportResult(null);
    clearError();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [clearError]);

  const getDisplayColumns = () => {
    const columns = [
      { key: 'athleteName', label: 'Athlete' },
      { key: 'seat', label: 'Seat' },
      { key: 'avgPower', label: 'Avg Power', unit: 'W' },
      { key: 'peakPower', label: 'Peak Power', unit: 'W' },
    ];

    if (source !== 'nk') {
      columns.push(
        { key: 'workPerStroke', label: 'Work/Stroke', unit: 'J' },
        { key: 'catchAngle', label: 'Catch', unit: '°' },
        { key: 'finishAngle', label: 'Finish', unit: '°' },
        { key: 'slip', label: 'Slip', unit: '°' },
        { key: 'wash', label: 'Wash', unit: '°' }
      );
    }

    if (source === 'peach') {
      columns.push({ key: 'techScore', label: 'Tech Score' });
    }

    return columns;
  };

  const sourceOptions = Object.entries(SOURCE_MAPPINGS).map(([key, { name }]) => ({
    value: key,
    label: name,
  }));

  return (
    <div className="space-y-6">
      {/* Configuration Card */}
      <SpotlightCard className="p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-text-primary">Import Telemetry Data</h2>
          <p className="text-sm text-text-secondary mt-1">
            Import oarlock telemetry data from CSV files
          </p>
        </div>

        <div className="space-y-4">
          {/* Source and Date Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SelectField
              label="Telemetry Source"
              value={source}
              onChange={(e) => {
                setSource(e.target.value);
                handleReset();
              }}
              options={sourceOptions}
            />

            <InputField
              label="Session Date"
              required
              type="date"
              value={sessionDate}
              onChange={(e) => setSessionDate(e.target.value)}
            />
          </div>

          {/* Expected Columns Info */}
          <div className="p-4 bg-void-deep/50 rounded-lg border border-white/[0.06]">
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-4 h-4 text-coxswain-violet" />
              <p className="text-xs text-text-secondary">
                Expected CSV columns for {SOURCE_MAPPINGS[source].name}:
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.values(SOURCE_MAPPINGS[source].columns).map((col) => (
                <Badge key={col} variant="default">
                  {col}
                </Badge>
              ))}
            </div>
          </div>

          {/* File Upload */}
          <motion.div
            animate={{
              borderColor: isDragging ? 'rgba(0, 112, 243, 0.5)' : 'rgba(255, 255, 255, 0.06)',
              backgroundColor: isDragging ? 'rgba(0, 112, 243, 0.05)' : 'transparent',
            }}
            transition={{ duration: 0.2 }}
            className="border-2 border-dashed rounded-xl p-8 transition-colors"
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <div className="text-center">
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-void-elevated border border-white/[0.06] flex items-center justify-center">
                <Upload className="w-7 h-7 text-text-muted" />
              </div>
              {file ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-center gap-2">
                    <File className="w-4 h-4 text-blade-blue" />
                    <span className="text-text-primary font-medium">{file.name}</span>
                    <button
                      onClick={handleReset}
                      className="p-1 rounded-lg hover:bg-white/[0.04] text-text-muted hover:text-text-primary transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  {parsedData.length > 0 && (
                    <Badge variant="success">
                      {parsedData.length} rows parsed
                    </Badge>
                  )}
                </div>
              ) : (
                <>
                  <p className="text-sm text-text-primary mb-1">
                    Drag and drop your CSV file here
                  </p>
                  <p className="text-xs text-text-muted mb-4">or click to browse</p>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 rounded-lg bg-void-elevated/50 hover:bg-void-elevated text-text-secondary hover:text-text-primary border border-white/[0.06] text-sm transition-all duration-200"
                  >
                    Select File
                  </motion.button>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </motion.div>
        </div>
      </SpotlightCard>

      {/* Error Messages */}
      <AnimatePresence>
        {(parseError || error) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-danger-red/10 border border-danger-red/20 rounded-xl flex items-center gap-3"
          >
            <AlertTriangle className="w-5 h-5 text-danger-red flex-shrink-0" />
            <span className="text-sm text-danger-red">{parseError || error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preview Table */}
      <AnimatePresence>
        {parsedData.length > 0 && !importResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <SpotlightCard className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-text-primary">Preview Data</h3>
                <Badge variant="info">{parsedData.length} athletes</Badge>
              </div>

              <div className="border border-white/[0.06] rounded-lg overflow-hidden">
                <div className="overflow-x-auto max-h-80">
                  <table className="w-full text-sm">
                    <thead className="bg-void-deep/50 sticky top-0">
                      <tr>
                        {getDisplayColumns().map(({ key, label, unit }) => (
                          <th
                            key={key}
                            className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider whitespace-nowrap"
                          >
                            {label}
                            {unit && <span className="text-text-muted/50 ml-1">({unit})</span>}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                      {parsedData.map((row, index) => (
                        <tr
                          key={index}
                          className={index % 2 === 0 ? 'bg-transparent' : 'bg-void-deep/30'}
                        >
                          {getDisplayColumns().map(({ key }) => (
                            <td key={key} className="px-4 py-3 text-text-primary whitespace-nowrap">
                              {row[key] !== null && row[key] !== undefined
                                ? typeof row[key] === 'number'
                                  ? row[key].toFixed(key === 'seat' ? 0 : 1)
                                  : row[key]
                                : <span className="text-text-muted">-</span>}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleReset}
                  className="px-5 py-2.5 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-white/[0.04] transition-all duration-200"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleImport}
                  disabled={!sessionDate || loading}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blade-blue text-void-deep font-medium text-sm transition-all duration-150 ease-out hover:shadow-[0_0_20px_rgba(0,112,243,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>Import {parsedData.length} Records</>
                  )}
                </motion.button>
              </div>
            </SpotlightCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Import Results */}
      <AnimatePresence>
        {importResult && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <SpotlightCard
              className="p-6"
              spotlightColor={importResult.errors?.length > 0 ? 'rgba(245, 158, 11, 0.08)' : 'rgba(0, 112, 243, 0.12)'}
            >
              <div className="text-center py-4">
                <div
                  className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center ${
                    importResult.errors?.length > 0
                      ? 'bg-warning-orange/10 border border-warning-orange/20'
                      : 'bg-blade-blue/10 border border-blade-blue/20 shadow-[0_0_20px_rgba(0,112,243,0.2)]'
                  }`}
                >
                  {importResult.errors?.length > 0 ? (
                    <AlertTriangle className="w-8 h-8 text-warning-orange" />
                  ) : (
                    <CheckCircle className="w-8 h-8 text-blade-blue" />
                  )}
                </div>

                <h3 className="text-lg font-semibold text-text-primary mb-4">
                  Import Complete
                </h3>

                <div className="flex items-center justify-center gap-3 mb-4 flex-wrap">
                  <Badge variant="success">
                    {importResult.created || importResult.imported || parsedData.length} records imported
                  </Badge>
                  {importResult.matched && (
                    <Badge variant="info">
                      {importResult.matched} athletes matched
                    </Badge>
                  )}
                  {importResult.errors?.length > 0 && (
                    <Badge variant="error">
                      {importResult.errors.length} errors
                    </Badge>
                  )}
                </div>

                {importResult.errors?.length > 0 && (
                  <div className="mt-4 text-left max-w-lg mx-auto">
                    <p className="text-sm text-text-secondary mb-2">Errors:</p>
                    <div className="bg-void-deep/50 rounded-lg p-3 max-h-32 overflow-y-auto border border-white/[0.06]">
                      {importResult.errors.map((err, idx) => (
                        <div key={idx} className="text-xs text-danger-red mb-1">
                          {err.row && `Row ${err.row}: `}
                          {err.error || err.message || err}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleReset}
                  className="mt-6 px-5 py-2.5 rounded-lg bg-blade-blue text-void-deep font-medium text-sm transition-all duration-150 ease-out hover:shadow-[0_0_20px_rgba(0,112,243,0.3)]"
                >
                  Import Another File
                </motion.button>
              </div>
            </SpotlightCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export { TelemetryImport };
