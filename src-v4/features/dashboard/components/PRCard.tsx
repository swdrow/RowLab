/**
 * Personal record card showing best time per distance with improvement indicator.
 * Displays test type, machine badge, formatted time, and delta from previous best.
 * Ref: DASH-04 (PR highlights).
 */

import { ArrowDown, ArrowUp } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { formatErgTime, formatRelativeDate } from '@/lib/format';
import type { PRRecord } from '../types';

interface PRCardProps {
  record: PRRecord;
  className?: string;
}

const machineDisplayMap: Record<string, string> = {
  rower: 'Row',
  bikerg: 'Bike',
  skierg: 'Ski',
};

export function PRCard({ record, className = '' }: PRCardProps) {
  const machineLabel = machineDisplayMap[record.machineType] ?? record.machineType;
  const hasBest = record.bestTime != null;

  return (
    <GlassCard padding="sm" className={className} as="article">
      <div
        className="flex flex-col gap-2"
        aria-label={`${record.testType} personal record${hasBest ? `: ${formatErgTime(record.bestTime)}` : ''}`}
        role="group"
      >
        {/* Header: test type + machine badge */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-ink-primary">{record.testType}</span>
          <span className="text-xs bg-ink-well px-2 py-0.5 rounded-md text-ink-muted">
            {machineLabel}
          </span>
        </div>

        {/* Best time or no data */}
        {hasBest ? (
          <>
            <span className="text-xl font-bold text-ink-primary tabular-nums">
              {formatErgTime(record.bestTime)}
            </span>

            {/* Date + improvement */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-ink-tertiary">
                {formatRelativeDate(record.bestDate)}
              </span>
              <ImprovementIndicator improvement={record.improvement} />
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center py-2">
            <span className="text-xl font-bold text-ink-muted tabular-nums" aria-label="No data">
              {'\u2014'}
            </span>
            <span className="text-xs text-ink-tertiary mt-1">No data</span>
          </div>
        )}
      </div>
    </GlassCard>
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
          <ArrowDown size={12} aria-hidden="true" />
          <span>{seconds}s</span>
          <span className="sr-only">improved by {seconds} seconds</span>
        </>
      ) : (
        <>
          <ArrowUp size={12} aria-hidden="true" />
          <span>{seconds}s</span>
          <span className="sr-only">slower by {seconds} seconds</span>
        </>
      )}
    </span>
  );
}
