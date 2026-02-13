/**
 * PR highlights grid showing personal records for standard distances.
 * Filters out records with no data, sorts by distance ascending (500m first).
 * Ref: DASH-04 (PR highlights).
 */

import { motion } from 'motion/react';
import { Trophy } from 'lucide-react';
import { listContainerVariants, listItemVariants, SPRING_SMOOTH } from '@/lib/animations';
import { EmptyState } from '@/components/ui/EmptyState';
import { PRCard } from './PRCard';
import type { PRRecord } from '../types';

interface PRHighlightsProps {
  records: PRRecord[];
  className?: string;
}

/** Extract numeric distance from testType string for sorting.
 * e.g., "500m" → 500, "2k" → 2000, "HM" → 21097
 */
function parseDistance(testType: string): number {
  const lower = testType.toLowerCase();
  if (lower === 'hm') return 21097;
  if (lower === 'fm') return 42195;

  const kMatch = lower.match(/^(\d+(?:\.\d+)?)k$/);
  if (kMatch) return parseFloat(kMatch[1]) * 1000;

  const mMatch = lower.match(/^(\d+)m$/);
  if (mMatch) return parseInt(mMatch[1], 10);

  return Infinity;
}

export function PRHighlights({ records, className = '' }: PRHighlightsProps) {
  const withData = records.filter((r) => r.bestTime != null);

  const sorted = [...withData].sort(
    (a, b) => parseDistance(a.testType) - parseDistance(b.testType)
  );

  if (sorted.length === 0) {
    return (
      <section className={className} aria-label="Personal Records">
        <h2 className="text-lg font-semibold text-ink-primary mb-4">Personal Records</h2>
        <EmptyState
          icon={Trophy}
          title="No personal records yet"
          description="Complete an erg test to start tracking your PRs."
          size="sm"
        />
      </section>
    );
  }

  return (
    <section className={className} aria-label="Personal Records">
      <h2 className="text-lg font-semibold text-ink-primary mb-4">Personal Records</h2>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={listContainerVariants}
        className="grid grid-cols-2 lg:grid-cols-3 gap-3"
      >
        {sorted.map((record) => (
          <motion.div
            key={`${record.testType}-${record.machineType}`}
            variants={listItemVariants}
            transition={SPRING_SMOOTH}
          >
            <PRCard record={record} />
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
