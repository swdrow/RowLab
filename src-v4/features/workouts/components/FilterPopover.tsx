/**
 * Filter controls popover for the workouts page.
 * Provides sport type, source, and date range filters.
 * Accepts an onFilterChange callback to update URL search params in the parent.
 */

import { motion, AnimatePresence } from 'motion/react';
import {
  Waves,
  Mountain,
  Bike,
  Footprints,
  Dumbbell,
  Heart,
  Activity,
  X,
  type LucideIcon,
} from 'lucide-react';

import { SPORT_CONFIG, SPORT_LIST, type SportType } from '../constants';
import { scaleIn } from '@/lib/animations';

/* ------------------------------------------------------------------ */
/* Icon map                                                            */
/* ------------------------------------------------------------------ */

const ICON_MAP: Record<string, LucideIcon> = {
  Waves,
  Mountain,
  Bike,
  Footprints,
  Dumbbell,
  Heart,
  Activity,
};

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface FilterPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  activeType?: string;
  activeSource?: string;
  activeDateFrom?: string;
  activeDateTo?: string;
  onFilterChange: (key: string, value: string | undefined) => void;
  onClearAll: () => void;
}

/* ------------------------------------------------------------------ */
/* Source options                                                       */
/* ------------------------------------------------------------------ */

const SOURCE_OPTIONS: Array<{ key: string | undefined; label: string }> = [
  { key: undefined, label: 'All' },
  { key: 'manual', label: 'Manual' },
  { key: 'concept2', label: 'Concept2' },
  { key: 'strava', label: 'Strava' },
  { key: 'garmin', label: 'Garmin' },
];

/* ------------------------------------------------------------------ */
/* FilterPopover                                                       */
/* ------------------------------------------------------------------ */

export function FilterPopover({
  isOpen,
  onClose,
  activeType,
  activeSource,
  activeDateFrom,
  activeDateTo,
  onFilterChange,
  onClearAll,
}: FilterPopoverProps) {
  const hasActiveFilters =
    activeType != null || activeSource != null || activeDateFrom != null || activeDateTo != null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            onClick={onClose}
          />

          {/* Popover */}
          <motion.div
            {...scaleIn}
            className="absolute right-0 top-full mt-2 z-50 w-80 bg-ink-base border border-ink-border rounded-xl shadow-card p-4 space-y-4 origin-top-right"
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-ink-primary">Filters</h3>
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-md hover:bg-ink-hover transition-colors"
                aria-label="Close filters"
              >
                <X size={14} className="text-ink-tertiary" />
              </button>
            </div>

            {/* Sport type filter */}
            <div>
              <label className="text-xs font-medium text-ink-secondary uppercase tracking-wider mb-2 block">
                Type
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {SPORT_LIST.map((sport: SportType) => {
                  const config = SPORT_CONFIG[sport];
                  const Icon = ICON_MAP[config.icon] ?? Activity;
                  const filterValue =
                    config.type + (config.machineType ? ':' + config.machineType : '');
                  const isActive = activeType === filterValue;

                  return (
                    <button
                      key={sport}
                      type="button"
                      onClick={() => onFilterChange('type', isActive ? undefined : filterValue)}
                      className={`flex flex-col items-center gap-1 py-2 px-1 rounded-lg text-xs transition-all ${
                        isActive
                          ? 'bg-ink-raised ring-2 ring-accent-copper text-ink-primary'
                          : 'bg-ink-well text-ink-secondary hover:bg-ink-hover hover:text-ink-body'
                      }`}
                    >
                      <Icon size={16} className={isActive ? `text-${config.color}` : ''} />
                      <span className="truncate max-w-full">{config.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Source filter */}
            <div>
              <label className="text-xs font-medium text-ink-secondary uppercase tracking-wider mb-2 block">
                Source
              </label>
              <div className="flex gap-1.5 flex-wrap">
                {SOURCE_OPTIONS.map((opt) => {
                  const isActive = activeSource === opt.key;

                  return (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => onFilterChange('source', isActive ? undefined : opt.key)}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-ink-raised ring-2 ring-accent-copper text-ink-primary'
                          : 'bg-ink-well text-ink-secondary hover:bg-ink-hover hover:text-ink-body'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Date range */}
            <div>
              <label className="text-xs font-medium text-ink-secondary uppercase tracking-wider mb-2 block">
                Date Range
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={activeDateFrom ?? ''}
                  onChange={(e) => onFilterChange('dateFrom', e.target.value || undefined)}
                  className="flex-1 bg-ink-well border border-ink-border rounded-md text-ink-primary text-sm px-2.5 py-1.5 focus:ring-2 focus:ring-accent-copper focus:border-accent-copper outline-none"
                />
                <span className="text-ink-muted text-xs">to</span>
                <input
                  type="date"
                  value={activeDateTo ?? ''}
                  onChange={(e) => onFilterChange('dateTo', e.target.value || undefined)}
                  className="flex-1 bg-ink-well border border-ink-border rounded-md text-ink-primary text-sm px-2.5 py-1.5 focus:ring-2 focus:ring-accent-copper focus:border-accent-copper outline-none"
                />
              </div>
            </div>

            {/* Clear all */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={() => {
                  onClearAll();
                  onClose();
                }}
                className="text-xs text-accent-copper hover:text-accent-copper-hover transition-colors font-medium"
              >
                Clear all filters
              </button>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/**
 * Count active filters for badge display.
 */
export function countActiveFilters(search: {
  type?: string;
  source?: string;
  dateFrom?: string;
  dateTo?: string;
}): number {
  let count = 0;
  if (search.type) count++;
  if (search.source) count++;
  if (search.dateFrom) count++;
  if (search.dateTo) count++;
  return count;
}
