import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, ChevronDown, ChevronUp, Upload, X } from 'lucide-react';
import { SPRING_GENTLE, FADE_IN_VARIANTS, usePrefersReducedMotion } from '@v2/utils/animations';
import type { CSVImportResult } from '@v2/types/athletes';

interface ImportResultsSummaryProps {
  result: CSVImportResult;
  onImportMore: () => void;
  onDone: () => void;
}

export function ImportResultsSummary({ result, onImportMore, onDone }: ImportResultsSummaryProps) {
  const [errorsExpanded, setErrorsExpanded] = useState(false);
  const prefersReducedMotion = usePrefersReducedMotion();
  const transition = prefersReducedMotion ? { duration: 0 } : SPRING_GENTLE;

  const hasErrors = result.errors.length > 0;
  const hasImported = result.imported > 0;

  return (
    <div className="space-y-6">
      {/* Main summary */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={transition}
        className="text-center py-4"
      >
        <div
          className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto
            ${hasImported ? 'bg-status-success/20' : 'bg-status-warning/20'}`}
        >
          {hasImported ? (
            <CheckCircle2 size={32} className="text-status-success" />
          ) : (
            <AlertCircle size={32} className="text-status-warning" />
          )}
        </div>

        <h3 className="mt-4 text-lg font-semibold text-txt-primary">
          {hasImported ? 'Import Complete' : 'Import Finished with Issues'}
        </h3>

        {/* Stats row */}
        <div className="flex items-center justify-center gap-4 mt-3">
          {result.imported > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-status-success/10 text-status-success rounded-lg text-sm font-medium">
              <CheckCircle2 size={14} />
              {result.imported} imported
            </div>
          )}
          {result.skipped > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-status-warning/10 text-status-warning rounded-lg text-sm font-medium">
              <X size={14} />
              {result.skipped} skipped
            </div>
          )}
          {result.errors.length > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-status-error/10 text-status-error rounded-lg text-sm font-medium">
              <AlertCircle size={14} />
              {result.errors.length} error{result.errors.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      </motion.div>

      {/* Error details (collapsible) */}
      {hasErrors && (
        <div className="border border-status-error/20 rounded-lg overflow-hidden">
          <button
            onClick={() => setErrorsExpanded(!errorsExpanded)}
            className="w-full flex items-center justify-between px-4 py-3
                       bg-status-error/5 hover:bg-status-error/10 transition-colors"
          >
            <span className="text-sm font-medium text-status-error">
              {result.errors.length} error{result.errors.length !== 1 ? 's' : ''} during import
            </span>
            {errorsExpanded ? (
              <ChevronUp size={16} className="text-status-error" />
            ) : (
              <ChevronDown size={16} className="text-status-error" />
            )}
          </button>

          <AnimatePresence>
            {errorsExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-4 py-3 space-y-2 max-h-48 overflow-y-auto">
                  {result.errors.map((error, index) => (
                    <motion.div
                      key={index}
                      variants={FADE_IN_VARIANTS}
                      initial="hidden"
                      animate="visible"
                      transition={{ ...transition, delay: prefersReducedMotion ? 0 : index * 0.02 }}
                      className="flex items-start gap-2 text-sm"
                    >
                      <span className="text-status-error font-mono text-xs shrink-0 mt-0.5">
                        Row {error.row}
                      </span>
                      <span className="text-txt-secondary">
                        <span className="font-medium text-txt-primary">{error.field}:</span>{' '}
                        {error.message}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-center gap-3 pt-2">
        <button
          onClick={onImportMore}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium
                     text-txt-secondary hover:text-txt-primary border border-bdr-default
                     rounded-lg hover:bg-bg-hover transition-colors"
        >
          <Upload size={16} />
          Import More
        </button>
        <button
          onClick={onDone}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium
                     text-white bg-interactive-primary rounded-lg
                     hover:bg-interactive-hover transition-colors"
        >
          Done
        </button>
      </div>
    </div>
  );
}
