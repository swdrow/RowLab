/**
 * Table displaying personal records for a single erg machine.
 * Shows 8 standard C2 distances with time, pace, watts, and date.
 * Empty distances show em dashes; distances with PRs have a subtle accent border.
 * Recent PRs (last 30 days) highlighted with copper accent background and border.
 */

import { Trophy } from 'lucide-react';
import { motion } from 'motion/react';

import { formatErgTime, formatPace, formatRelativeDate, formatNumber } from '@/lib/format';
import { listContainerVariants, listItemVariants } from '@/lib/animations';
import { EmptyState } from '@/components/ui/EmptyState';
import type { PRRecord } from '../types';
import type { MachineType } from './MachineTabs';

/** Standard C2 distance order, matching backend STANDARD_DISTANCES */
const DISTANCE_ORDER = ['500m', '1k', '2k', '5k', '6k', '10k', 'hm', 'fm'] as const;

/** Human-readable distance labels (RowErg/SkiErg) */
const DISTANCE_LABELS: Record<string, string> = {
  '500m': '500m',
  '1k': '1,000m',
  '2k': '2,000m',
  '5k': '5,000m',
  '6k': '6,000m',
  '10k': '10,000m',
  hm: 'Half Marathon',
  fm: 'Full Marathon',
};

/** BikeErg distances are 2x RowErg (a 2k row = 4k bike) */
const BIKERG_DISTANCE_LABELS: Record<string, string> = {
  '500m': '1,000m',
  '1k': '2,000m',
  '2k': '4,000m',
  '5k': '10,000m',
  '6k': '12,000m',
  '10k': '20,000m',
  hm: 'Half Marathon',
  fm: 'Full Marathon',
};

/** Check if a date string is within the last 30 days */
function isRecent(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  return date >= thirtyDaysAgo;
}

interface PRTableProps {
  records: PRRecord[];
  machineType: MachineType;
}

const DASH = '\u2014';

export function PRTable({ records, machineType }: PRTableProps) {
  // Build a lookup map from testType to record
  const recordMap = new Map(records.map((r) => [r.testType, r]));

  // Check if there are any PRs at all for this machine
  const hasAnyPRs = records.some((r) => r.bestTime != null);

  if (!hasAnyPRs) {
    return (
      <EmptyState
        icon={Trophy}
        title="No records yet"
        description={`Complete some ${machineType === 'rower' ? 'RowErg' : machineType === 'skierg' ? 'SkiErg' : 'BikeErg'} workouts at standard distances to see your PRs here.`}
        size="sm"
        className="py-10"
      />
    );
  }

  const paceLabel = machineType === 'bikerg' ? 'Pace /1000m' : 'Pace /500m';

  return (
    <motion.div
      variants={listContainerVariants}
      initial="hidden"
      animate="visible"
      className="overflow-x-auto"
    >
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-ink-well/40 text-ink-muted text-xs font-medium uppercase tracking-wider">
            <th className="text-left py-2.5 pr-4 pl-3 font-medium">Distance</th>
            <th className="text-right py-2.5 px-3 font-medium">Time</th>
            <th className="text-right py-2.5 px-3 font-medium">{paceLabel}</th>
            <th className="text-right py-2.5 px-3 font-medium">Watts</th>
            <th className="text-right py-2.5 pl-3 pr-3 font-medium">Date</th>
          </tr>
        </thead>
        <tbody>
          {DISTANCE_ORDER.map((dist) => {
            const record = recordMap.get(dist);
            const hasPR = record?.bestTime != null;
            const recent = hasPR && isRecent(record?.bestDate ?? null);

            return (
              <motion.tr
                key={dist}
                variants={listItemVariants}
                className={`
                  border-b border-ink-border/20 last:border-b-0
                  hover:bg-ink-hover/50 transition-colors
                  ${hasPR ? 'text-ink-primary' : 'text-ink-muted'}
                  ${recent ? 'bg-accent-copper/5 border-l-2 border-l-accent-copper' : ''}
                `}
              >
                <td className="py-3 pr-4 pl-3">
                  <div className="flex items-center gap-2">
                    {hasPR && (
                      <div className="w-0.5 h-5 rounded-full bg-accent-copper" aria-hidden="true" />
                    )}
                    <span className={hasPR ? 'font-medium' : ''}>
                      {machineType === 'bikerg'
                        ? BIKERG_DISTANCE_LABELS[dist]
                        : DISTANCE_LABELS[dist]}
                    </span>
                    {recent && (
                      <span className="text-[9px] font-semibold uppercase tracking-wider text-accent-copper bg-accent-copper/10 px-1.5 py-0.5 rounded">
                        New
                      </span>
                    )}
                  </div>
                </td>
                <td className="text-right py-3 px-3 font-mono tabular-nums">
                  {hasPR ? formatErgTime(record!.bestTime) : DASH}
                </td>
                <td className="text-right py-3 px-3 font-mono tabular-nums text-ink-secondary">
                  {hasPR ? computePaceDisplay(record!.bestTime!, dist, machineType) : DASH}
                </td>
                <td className="text-right py-3 px-3 font-mono tabular-nums text-ink-secondary">
                  {record?.avgWatts != null ? formatNumber(record.avgWatts) : DASH}
                </td>
                <td className="text-right py-3 pl-3 pr-3 text-ink-tertiary text-xs">
                  {record?.bestDate ? formatRelativeDate(record.bestDate) : DASH}
                </td>
              </motion.tr>
            );
          })}
        </tbody>
      </table>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Pace calculation helpers
// ---------------------------------------------------------------------------

/** Map distance labels to meters (RowErg/SkiErg) */
const DISTANCE_METERS: Record<string, number> = {
  '500m': 500,
  '1k': 1000,
  '2k': 2000,
  '5k': 5000,
  '6k': 6000,
  '10k': 10000,
  hm: 21097,
  fm: 42195,
};

/** BikeErg benchmark distances (2x RowErg) */
const BIKERG_DISTANCE_METERS: Record<string, number> = {
  '500m': 1000,
  '1k': 2000,
  '2k': 4000,
  '5k': 10000,
  '6k': 12000,
  '10k': 20000,
  hm: 42195,
  fm: 84390,
};

/**
 * Compute pace display from best time (tenths of seconds) and distance.
 * For rower/skierg: pace per 500m. For bikerg: pace per 1000m.
 */
function computePaceDisplay(
  timeTenths: number,
  distLabel: string,
  machineType: MachineType
): string {
  // BikeErg benchmarks use doubled distances
  const metersMap = machineType === 'bikerg' ? BIKERG_DISTANCE_METERS : DISTANCE_METERS;
  const meters = metersMap[distLabel];
  if (!meters || timeTenths <= 0) return DASH;

  const paceDistance = machineType === 'bikerg' ? 1000 : 500;
  // Time in tenths of seconds for the pace distance
  const paceTenths = (timeTenths / meters) * paceDistance;

  return formatPace(Math.round(paceTenths));
}
