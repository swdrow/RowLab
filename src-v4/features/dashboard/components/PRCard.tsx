/**
 * Personal record card showing best time per distance with improvement indicator.
 * Displays test type, machine badge, formatted time, and delta from previous best.
 * Recent PRs (last 7 days) get a copper celebration glow and "New" badge.
 * Ref: DASH-04 (PR highlights).
 */

import { IconArrowDown, IconArrowUp } from '@/components/icons';
import { Card } from '@/components/ui/Card';
import { formatErgTime, formatRelativeDate } from '@/lib/format';
import type { PRRecord } from '../types';

interface PRCardProps {
  record: PRRecord;
  /** True if PR was set within the last 7 days -- enables celebration glow. */
  isRecent?: boolean;
  className?: string;
}

const machineDisplayMap: Record<string, string> = {
  rower: 'Row',
  bikerg: 'Bike',
  skierg: 'Ski',
};

/** Check if a PR improvement is significant (> 2% improvement). */
function isSignificantImprovement(record: PRRecord): boolean {
  if (record.improvement == null || record.previousBest == null || record.previousBest === 0) {
    return false;
  }
  const percentChange = Math.abs(record.improvement) / Math.abs(record.previousBest);
  return percentChange > 0.02;
}

export function PRCard({ record, isRecent = false, className = '' }: PRCardProps) {
  const machineLabel = machineDisplayMap[record.machineType] ?? record.machineType;
  const hasBest = record.bestTime != null;
  const showGlow = isRecent && isSignificantImprovement(record);

  return (
    <Card padding="sm" className={`relative ${className}`} as="article">
      {/* Copper pulse overlay for recent significant PRs */}
      {showGlow && (
        <div className="absolute inset-0 rounded-xl animate-pulse-slow bg-accent-teal/5 pointer-events-none z-0" />
      )}

      <div
        className="relative z-10 flex flex-col gap-2"
        aria-label={`${record.testType} personal record${hasBest ? `: ${formatErgTime(record.bestTime)}` : ''}`}
        role="group"
      >
        {/* Header: test type + machine badge */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-text-bright">{record.testType}</span>
          <span className="text-xs bg-void-deep px-2 py-0.5 rounded-md text-text-faint">
            {machineLabel}
          </span>
        </div>

        {/* Best time or no data */}
        {hasBest ? (
          <>
            <span className="text-xl font-mono font-bold text-text-bright tabular-nums">
              {formatErgTime(record.bestTime)}
            </span>

            {/* Date + improvement + New badge */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-text-faint">{formatRelativeDate(record.bestDate)}</span>
              <div className="flex items-center gap-1.5">
                <ImprovementIndicator improvement={record.improvement} />
                {isRecent && (
                  <span className="text-[9px] font-bold uppercase tracking-widest text-accent-sand bg-accent-sand/10 px-1.5 py-0.5 rounded-md">
                    New
                  </span>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center py-2">
            <span
              className="text-xl font-mono font-bold text-text-faint tabular-nums"
              aria-label="No data"
            >
              {'\u2014'}
            </span>
            <span className="text-xs text-text-faint mt-1">No data</span>
          </div>
        )}
      </div>
    </Card>
  );
}

function ImprovementIndicator({ improvement }: { improvement: number | null }) {
  if (improvement == null || improvement === 0) return null;

  // Negative improvement = time decreased = faster = good (e.g. -54 = 5.4s faster)
  // Positive improvement = time increased = slower = bad
  const isImproved = improvement < 0;
  const seconds = Math.abs(improvement / 10).toFixed(1);

  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-medium ${
        isImproved ? 'text-data-excellent' : 'text-data-poor'
      }`}
    >
      {isImproved ? (
        <>
          <IconArrowDown width={12} height={12} aria-hidden="true" />
          <span>{seconds}s</span>
          <span className="sr-only">improved by {seconds} seconds</span>
        </>
      ) : (
        <>
          <IconArrowUp width={12} height={12} aria-hidden="true" />
          <span>{seconds}s</span>
          <span className="sr-only">slower by {seconds} seconds</span>
        </>
      )}
    </span>
  );
}
