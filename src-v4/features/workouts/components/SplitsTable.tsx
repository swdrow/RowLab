/**
 * Splits data table for the workout detail page.
 * Shows pace, watts, SPM (and heart rate if available) per split.
 * When intervalInfo is provided, rest splits are dimmed and labeled.
 */

import { formatPace, formatDistance, formatDuration } from '@/lib/format';
import type { WorkoutSplit } from '../types';
import type { IntervalPattern } from '../utils';

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
  intervalInfo?: IntervalPattern;
}

export function SplitsTable({ splits, machineType, intervalInfo }: SplitsTableProps) {
  const hasHeartRate = splits.some((s) => s.heartRate != null);
  const rateLabel = machineType === 'bikerg' ? 'RPM' : 'SPM';

  // Build a set of rest split numbers for dimming
  const restSplitNumbers = new Set<number>();
  if (intervalInfo?.isInterval) {
    for (const block of intervalInfo.intervals) {
      if (block.type === 'rest') {
        for (const s of block.splits) {
          restSplitNumbers.add(s.splitNumber);
        }
      }
    }
  }

  return (
    <div className="bg-void-raised rounded-xl border border-edge-default overflow-hidden">
      {intervalInfo?.isInterval && (
        <div className="px-4 py-2 border-b border-edge-default/50">
          <span className="text-xs text-accent-teal font-mono font-medium">
            {intervalInfo.pattern}
          </span>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm font-mono">
          <thead>
            <tr className="border-b border-edge-default">
              <th className="text-left py-2.5 px-4 text-text-faint text-xs uppercase tracking-wider font-medium">
                Split
              </th>
              <th className="text-right py-2.5 px-4 text-text-faint text-xs uppercase tracking-wider font-medium">
                Dist
              </th>
              <th className="text-right py-2.5 px-4 text-text-faint text-xs uppercase tracking-wider font-medium">
                Time
              </th>
              <th className="text-right py-2.5 px-4 text-text-faint text-xs uppercase tracking-wider font-medium">
                Pace
              </th>
              <th className="text-right py-2.5 px-4 text-text-faint text-xs uppercase tracking-wider font-medium">
                Watts
              </th>
              <th className="text-right py-2.5 px-4 text-text-faint text-xs uppercase tracking-wider font-medium">
                {rateLabel}
              </th>
              {hasHeartRate && (
                <th className="text-right py-2.5 px-4 text-text-faint text-xs uppercase tracking-wider font-medium">
                  HR
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {splits.map((split, idx) => {
              const isRest = restSplitNumbers.has(split.splitNumber);
              return (
                <tr
                  key={split.splitNumber}
                  className={`hover:bg-void-overlay transition-colors ${
                    idx % 2 === 1 ? 'bg-void-deep/50' : 'bg-void-surface'
                  } ${isRest ? 'opacity-40' : ''}`}
                >
                  <td className="py-2 px-4 text-text-faint">{isRest ? 'R' : split.splitNumber}</td>
                  <td className="py-2 px-4 text-right text-text-dim tabular-nums">
                    {split.distanceM != null ? formatDistance(split.distanceM) : DASH}
                  </td>
                  <td className="py-2 px-4 text-right text-text-dim tabular-nums">
                    {split.timeSeconds != null ? formatDuration(split.timeSeconds) : DASH}
                  </td>
                  <td className="py-2 px-4 text-right text-text-default tabular-nums">
                    {formatPace(split.pace, machineType)}
                  </td>
                  <td className="py-2 px-4 text-right text-text-default tabular-nums">
                    {split.watts != null ? split.watts : DASH}
                  </td>
                  <td className="py-2 px-4 text-right text-text-dim tabular-nums">
                    {split.strokeRate != null ? split.strokeRate : DASH}
                  </td>
                  {hasHeartRate && (
                    <td className="py-2 px-4 text-right text-text-dim tabular-nums">
                      {split.heartRate != null ? split.heartRate : DASH}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
