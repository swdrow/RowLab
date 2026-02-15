/**
 * Splits data table for the workout detail page.
 * Shows pace, watts, SPM (and heart rate if available) per split.
 */

import { formatPace } from '@/lib/format';
import type { WorkoutSplit } from '../types';

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

const DASH = '\u2014';

/* ------------------------------------------------------------------ */
/* SplitsTable                                                         */
/* ------------------------------------------------------------------ */

interface SplitsTableProps {
  splits: WorkoutSplit[];
  machineType?: string | null;
}

export function SplitsTable({ splits, machineType }: SplitsTableProps) {
  const hasHeartRate = splits.some((s) => s.heartRate != null);
  const rateLabel = machineType === 'bikerg' ? 'RPM' : 'SPM';

  return (
    <div className="bg-ink-raised rounded-xl border border-ink-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm font-mono">
          <thead>
            <tr className="border-b border-ink-border">
              <th className="text-left py-2.5 px-4 text-ink-tertiary text-xs uppercase tracking-wider font-medium">
                Split
              </th>
              <th className="text-right py-2.5 px-4 text-ink-tertiary text-xs uppercase tracking-wider font-medium">
                Pace
              </th>
              <th className="text-right py-2.5 px-4 text-ink-tertiary text-xs uppercase tracking-wider font-medium">
                Watts
              </th>
              <th className="text-right py-2.5 px-4 text-ink-tertiary text-xs uppercase tracking-wider font-medium">
                {rateLabel}
              </th>
              {hasHeartRate && (
                <th className="text-right py-2.5 px-4 text-ink-tertiary text-xs uppercase tracking-wider font-medium">
                  HR
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {splits.map((split, idx) => (
              <tr
                key={split.splitNumber}
                className={`hover:bg-ink-hover transition-colors ${
                  idx % 2 === 1 ? 'bg-ink-well/50' : 'bg-ink-base'
                }`}
              >
                <td className="py-2 px-4 text-ink-muted">{split.splitNumber}</td>
                <td className="py-2 px-4 text-right text-ink-body tabular-nums">
                  {formatPace(split.pace, machineType)}
                </td>
                <td className="py-2 px-4 text-right text-ink-body tabular-nums">
                  {split.watts != null ? split.watts : DASH}
                </td>
                <td className="py-2 px-4 text-right text-ink-secondary tabular-nums">
                  {split.strokeRate != null ? split.strokeRate : DASH}
                </td>
                {hasHeartRate && (
                  <td className="py-2 px-4 text-right text-ink-secondary tabular-nums">
                    {split.heartRate != null ? split.heartRate : DASH}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
