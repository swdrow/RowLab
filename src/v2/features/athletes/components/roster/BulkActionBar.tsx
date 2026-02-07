import { motion, AnimatePresence } from 'framer-motion';
import { Download, Pencil, X, ArrowRight } from 'lucide-react';
import { SPRING_CONFIG } from '@v2/utils/animations';

export interface BulkActionBarProps {
  selectedCount: number;
  onExportCsv: () => void;
  onBulkEdit: () => void;
  onAssignToLineup: () => void;
  onClearSelection: () => void;
}

/**
 * Floating bottom bar that appears when athletes are selected.
 * Provides bulk actions: Export CSV, Bulk Edit, Assign to Lineup, Clear Selection.
 * Glass-card styling with backdrop blur and slide-up entrance animation.
 */
export function BulkActionBar({
  selectedCount,
  onExportCsv,
  onBulkEdit,
  onAssignToLineup,
  onClearSelection,
}: BulkActionBarProps) {
  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={SPRING_CONFIG}
          className="
            fixed bottom-6 left-1/2 -translate-x-1/2 z-40
            flex items-center gap-3 px-5 py-3
            bg-bg-surface/90 backdrop-blur-xl
            border border-bdr-default rounded-xl
            shadow-lg shadow-black/10
          "
        >
          {/* Selected count */}
          <span className="text-sm font-medium text-txt-primary tabular-nums whitespace-nowrap">
            {selectedCount} selected
          </span>

          <div className="w-px h-5 bg-bdr-default" />

          {/* Export CSV */}
          <button
            onClick={onExportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-txt-secondary hover:text-txt-primary hover:bg-bg-hover rounded-lg transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </button>

          {/* Bulk Edit */}
          <button
            onClick={onBulkEdit}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-txt-secondary hover:text-txt-primary hover:bg-bg-hover rounded-lg transition-colors"
          >
            <Pencil className="h-3.5 w-3.5" />
            Bulk Edit
          </button>

          {/* Assign to Lineup */}
          <button
            onClick={onAssignToLineup}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-txt-secondary hover:text-txt-primary hover:bg-bg-hover rounded-lg transition-colors"
          >
            <ArrowRight className="h-3.5 w-3.5" />
            Assign to Lineup
          </button>

          <div className="w-px h-5 bg-bdr-default" />

          {/* Clear Selection */}
          <button
            onClick={onClearSelection}
            className="flex items-center gap-1 p-1.5 text-txt-tertiary hover:text-txt-primary hover:bg-bg-hover rounded-lg transition-colors"
            aria-label="Clear selection"
          >
            <X className="h-4 w-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default BulkActionBar;
