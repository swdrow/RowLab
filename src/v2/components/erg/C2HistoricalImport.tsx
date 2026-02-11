import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, List, Check, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { useC2LogbookBrowse, useC2HistoricalImport } from '@v2/hooks/useC2Import';
import { SPRING_GENTLE } from '@v2/utils/animations';
import { MACHINE_TYPE_LABELS } from '@v2/types/ergTests';

export interface C2HistoricalImportProps {
  isOpen: boolean;
  onClose: () => void;
}

type ImportMode = 'dateRange' | 'browse';

/**
 * Historical import modal for Concept2 workouts
 *
 * Two modes:
 * 1. Date Range - Import all workouts in a date range
 * 2. Browse & Select - Paginated list with individual workout selection
 */
export function C2HistoricalImport({ isOpen, onClose }: C2HistoricalImportProps) {
  const [mode, setMode] = useState<ImportMode>('dateRange');

  // Date range mode state
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Browse mode state
  const [browsePage, setBrowsePage] = useState(1);
  const [selectedWorkoutIds, setSelectedWorkoutIds] = useState<Set<string>>(new Set());

  const perPage = 20;

  // Fetch logbook data for browse mode
  const { data: logbookData, isLoading: isBrowseLoading } = useC2LogbookBrowse({
    page: browsePage,
    perPage,
    fromDate: mode === 'browse' ? fromDate : undefined,
    toDate: mode === 'browse' ? toDate : undefined,
    enabled: isOpen && mode === 'browse',
  });

  // Import mutation
  const importMutation = useC2HistoricalImport();

  const handleDateRangeImport = () => {
    if (!fromDate && !toDate) {
      return; // Need at least one date
    }

    importMutation.mutate(
      { fromDate: fromDate || undefined, toDate: toDate || undefined },
      {
        onSuccess: () => {
          onClose();
          setFromDate('');
          setToDate('');
        },
      }
    );
  };

  const handleBrowseImport = () => {
    if (selectedWorkoutIds.size === 0) {
      return; // Nothing selected
    }

    importMutation.mutate(
      { resultIds: Array.from(selectedWorkoutIds) },
      {
        onSuccess: () => {
          onClose();
          setSelectedWorkoutIds(new Set());
          setBrowsePage(1);
        },
      }
    );
  };

  const handleToggleWorkout = (workoutId: string) => {
    setSelectedWorkoutIds((prev) => {
      const next = new Set(prev);
      if (next.has(workoutId)) {
        next.delete(workoutId);
      } else {
        next.add(workoutId);
      }
      return next;
    });
  };

  const handlePrevPage = () => {
    if (browsePage > 1) {
      setBrowsePage((p) => p - 1);
      setSelectedWorkoutIds(new Set());
    }
  };

  const handleNextPage = () => {
    if (logbookData && browsePage < logbookData.totalPages) {
      setBrowsePage((p) => p + 1);
      setSelectedWorkoutIds(new Set());
    }
  };

  // Count available (not already imported) workouts
  const availableWorkouts = useMemo(() => {
    if (!logbookData) return [];
    return logbookData.results.filter((w) => !w.alreadyImported);
  }, [logbookData]);

  const selectedCount = selectedWorkoutIds.size;
  const canImportDateRange = (fromDate || toDate) && !importMutation.isPending;
  const canImportBrowse = selectedCount > 0 && !importMutation.isPending;

  // Format time as MM:SS.d
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(1);
    return `${mins}:${secs.padStart(4, '0')}`;
  };

  // Format distance as km
  const formatDistance = (meters: number) => {
    return `${(meters / 1000).toFixed(1)}k`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-txt-primary/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={SPRING_GENTLE}
        className="relative w-full max-w-3xl max-h-[90vh] bg-bg-elevated border border-border-primary rounded-lg shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-border-primary bg-bg-secondary">
          <h2 className="text-xl font-semibold text-txt-primary">Import from Concept2 Logbook</h2>
        </div>

        {/* Tab Bar */}
        <div className="flex border-b border-border-primary bg-bg-secondary">
          <button
            onClick={() => setMode('dateRange')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors relative ${
              mode === 'dateRange'
                ? 'text-interactive-primary'
                : 'text-txt-secondary hover:text-txt-primary'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Calendar size={16} />
              <span>Date Range</span>
            </div>
            {mode === 'dateRange' && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-interactive-primary"
                transition={SPRING_GENTLE}
              />
            )}
          </button>

          <button
            onClick={() => setMode('browse')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors relative ${
              mode === 'browse'
                ? 'text-interactive-primary'
                : 'text-txt-secondary hover:text-txt-primary'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <List size={16} />
              <span>Browse & Select</span>
            </div>
            {mode === 'browse' && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-interactive-primary"
                transition={SPRING_GENTLE}
              />
            )}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            {mode === 'dateRange' ? (
              <motion.div
                key="dateRange"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={SPRING_GENTLE}
                className="space-y-4"
              >
                <p className="text-sm text-txt-secondary mb-4">
                  Import all workouts within a date range. Leave either field blank to import from
                  the beginning or to the end.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-txt-primary mb-2">
                      From Date
                    </label>
                    <input
                      type="date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      className="w-full px-3 py-2 bg-bg-primary border border-border-primary rounded-md text-txt-primary focus:outline-none focus:ring-2 focus:ring-interactive-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-txt-primary mb-2">
                      To Date
                    </label>
                    <input
                      type="date"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      className="w-full px-3 py-2 bg-bg-primary border border-border-primary rounded-md text-txt-primary focus:outline-none focus:ring-2 focus:ring-interactive-primary"
                    />
                  </div>
                </div>

                {!fromDate && !toDate && (
                  <div className="mt-4 p-3 bg-status-warning/10 border border-status-warning/30 rounded-md">
                    <p className="text-sm text-status-warning">
                      Select at least one date to define the import range.
                    </p>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="browse"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={SPRING_GENTLE}
                className="space-y-4"
              >
                <p className="text-sm text-txt-secondary mb-4">
                  Browse your Concept2 logbook and select individual workouts to import.
                </p>

                {/* Optional date filters */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-txt-primary mb-2">
                      Filter From
                    </label>
                    <input
                      type="date"
                      value={fromDate}
                      onChange={(e) => {
                        setFromDate(e.target.value);
                        setBrowsePage(1);
                        setSelectedWorkoutIds(new Set());
                      }}
                      className="w-full px-3 py-2 bg-bg-primary border border-border-primary rounded-md text-txt-primary text-sm focus:outline-none focus:ring-2 focus:ring-interactive-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-txt-primary mb-2">
                      Filter To
                    </label>
                    <input
                      type="date"
                      value={toDate}
                      onChange={(e) => {
                        setToDate(e.target.value);
                        setBrowsePage(1);
                        setSelectedWorkoutIds(new Set());
                      }}
                      className="w-full px-3 py-2 bg-bg-primary border border-border-primary rounded-md text-txt-primary text-sm focus:outline-none focus:ring-2 focus:ring-interactive-primary"
                    />
                  </div>
                </div>

                {/* Workout list */}
                {isBrowseLoading ? (
                  <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-16 bg-bg-subtle rounded-md animate-pulse" />
                    ))}
                  </div>
                ) : availableWorkouts.length === 0 ? (
                  <div className="py-12 text-center">
                    <p className="text-sm text-txt-secondary">
                      {logbookData?.results.length === 0
                        ? 'No workouts found in your logbook'
                        : 'All workouts in this range have already been imported'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {availableWorkouts.map((workout) => {
                      const isSelected = selectedWorkoutIds.has(workout.id);
                      const workoutDate = new Date(workout.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      });

                      return (
                        <button
                          key={workout.id}
                          onClick={() => handleToggleWorkout(workout.id)}
                          className={`w-full p-3 rounded-md border transition-colors text-left ${
                            isSelected
                              ? 'bg-interactive-primary/10 border-interactive-primary'
                              : 'bg-bg-primary border-border-primary hover:border-border-hover'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            {/* Checkbox */}
                            <div
                              className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                isSelected
                                  ? 'bg-interactive-primary border-interactive-primary'
                                  : 'border-border-primary'
                              }`}
                            >
                              {isSelected && <Check size={14} className="text-white" />}
                            </div>

                            {/* Workout info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium text-txt-primary">
                                  {formatDistance(workout.distance)}
                                </span>
                                <span className="text-xs text-txt-secondary">•</span>
                                <span className="text-xs font-mono text-txt-secondary">
                                  {formatTime(workout.time)}
                                </span>
                                {workout.machineType && workout.machineType !== 'rower' && (
                                  <>
                                    <span className="text-xs text-txt-secondary">•</span>
                                    <span className="text-xs px-1.5 py-0.5 rounded bg-data-warning/10 text-data-warning border border-data-warning/30">
                                      {MACHINE_TYPE_LABELS[workout.machineType] ||
                                        workout.machineType}
                                    </span>
                                  </>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-txt-muted">
                                <Calendar size={12} />
                                <span>{workoutDate}</span>
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Pagination */}
                {logbookData && logbookData.totalPages > 1 && (
                  <div className="flex items-center justify-between pt-4 border-t border-border-primary">
                    <button
                      onClick={handlePrevPage}
                      disabled={browsePage === 1}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm text-txt-secondary hover:text-txt-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft size={16} />
                      <span>Previous</span>
                    </button>

                    <span className="text-sm text-txt-secondary">
                      Page {browsePage} of {logbookData.totalPages}
                    </span>

                    <button
                      onClick={handleNextPage}
                      disabled={browsePage === logbookData.totalPages}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm text-txt-secondary hover:text-txt-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <span>Next</span>
                      <ChevronRight size={16} />
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border-primary bg-bg-secondary flex items-center justify-between gap-4">
          <button
            onClick={onClose}
            disabled={importMutation.isPending}
            className="px-4 py-2 text-sm font-medium text-txt-secondary hover:text-txt-primary transition-colors disabled:opacity-50"
          >
            Cancel
          </button>

          <div className="flex items-center gap-3">
            {mode === 'browse' && selectedCount > 0 && (
              <span className="text-sm text-txt-secondary">{selectedCount} selected</span>
            )}

            <button
              onClick={mode === 'dateRange' ? handleDateRangeImport : handleBrowseImport}
              disabled={mode === 'dateRange' ? !canImportDateRange : !canImportBrowse}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                importMutation.isPending
                  ? 'bg-bg-subtle text-txt-disabled cursor-not-allowed'
                  : (mode === 'dateRange' ? canImportDateRange : canImportBrowse)
                    ? 'bg-interactive-primary text-white hover:bg-interactive-primary-hover'
                    : 'bg-bg-subtle text-txt-disabled cursor-not-allowed'
              }`}
            >
              {importMutation.isPending && <Clock size={16} className="animate-spin" />}
              <span>
                {importMutation.isPending
                  ? 'Importing...'
                  : mode === 'dateRange'
                    ? 'Import Range'
                    : `Import Selected (${selectedCount})`}
              </span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
