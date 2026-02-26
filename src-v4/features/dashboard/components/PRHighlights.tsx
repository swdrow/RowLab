/**
 * PR highlights grid showing personal records for standard distances.
 * Filters out records with no data, sorts by distance ascending (500m first).
 * Recent PRs (last 7 days) are flagged for celebration glow.
 * Ref: DASH-04 (PR highlights).
 */

import { motion } from 'motion/react';
import { IconTrophy } from '@/components/icons';
import { EmptyState } from '@/components/ui/EmptyState';
import { FancySectionHeader } from '@/components/ui/FancySectionHeader';
import { PRCard } from './PRCard';
import type { PRRecord } from '../types';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

/** Check if a PR date is within the last 7 days. */
function isRecentPR(bestDate: string | null): boolean {
  if (!bestDate) return false;
  const prDate = new Date(bestDate).getTime();
  return Date.now() - prDate < SEVEN_DAYS_MS;
}

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
  if (kMatch?.[1]) return parseFloat(kMatch[1]) * 1000;

  const mMatch = lower.match(/^(\d+)m$/);
  if (mMatch?.[1]) return parseInt(mMatch[1], 10);

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
        <FancySectionHeader
          label="Personal Records"
          icon={IconTrophy}
          accentColor="sand"
          className="mb-4"
        />
        <EmptyState
          icon={IconTrophy}
          title="No personal records yet"
          description="Complete an erg test to start tracking your PRs."
          size="sm"
        />
      </section>
    );
  }

  return (
    <section className={className} aria-label="Personal Records">
      <FancySectionHeader
        label="Personal Records"
        icon={IconTrophy}
        accentColor="sand"
        className="mb-4"
      />

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
        className="grid grid-cols-2 gap-3"
      >
        {sorted.map((record) => (
          <PRCard
            key={`${record.testType}-${record.machineType}`}
            record={record}
            isRecent={isRecentPR(record.bestDate)}
          />
        ))}
      </motion.div>
    </section>
  );
}
