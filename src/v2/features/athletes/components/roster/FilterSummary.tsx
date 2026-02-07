import { AnimatePresence, motion } from 'framer-motion';
import { SPRING_FAST } from '@v2/utils/animations';

export interface FilterSummaryProps {
  filteredCount: number;
  totalCount: number;
  className?: string;
}

/**
 * Displays "Showing X of Y athletes" when filters are active,
 * or "Y athletes" when no filters are applied.
 * Uses tabular-nums for stable number layout and AnimatePresence for count transitions.
 */
export function FilterSummary({ filteredCount, totalCount, className = '' }: FilterSummaryProps) {
  const isFiltered = filteredCount !== totalCount;

  return (
    <div className={`flex items-center text-sm text-txt-secondary ${className}`}>
      <AnimatePresence mode="wait">
        {isFiltered ? (
          <motion.span
            key="filtered"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={SPRING_FAST}
          >
            Showing{' '}
            <span className="font-medium text-txt-primary tabular-nums">{filteredCount}</span> of{' '}
            <span className="tabular-nums">{totalCount}</span> athletes
          </motion.span>
        ) : (
          <motion.span
            key="total"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={SPRING_FAST}
          >
            <span className="font-medium text-txt-primary tabular-nums">{totalCount}</span> athletes
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}

export default FilterSummary;
