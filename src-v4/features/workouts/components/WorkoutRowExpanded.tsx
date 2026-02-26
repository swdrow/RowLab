/**
 * Expanded detail panel for a workout row.
 * Shows splits table, mini watts bar chart, notes, and secondary metrics.
 * Animates open/closed with AnimatePresence.
 */

import { motion } from 'motion/react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  type TooltipProps,
} from 'recharts';

import { formatPace, formatDistance, formatDuration } from '@/lib/format';
import { SPRING_GENTLE } from '@/lib/animations';
import { parseIntervalPattern } from '../utils';
import type { Workout, WorkoutSplit } from '../types';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface WorkoutRowExpandedProps {
  workout: Workout;
  onNavigateToDetail: (id: string) => void;
}

/* ------------------------------------------------------------------ */
/* Splits table                                                        */
/* ------------------------------------------------------------------ */

const DASH = '\u2014';

function SplitsTable({
  splits,
  machineType,
  workoutType,
}: {
  splits: WorkoutSplit[];
  machineType?: string | null;
  workoutType?: string | null;
}) {
  const rateLabel = machineType === 'bikerg' ? 'RPM' : 'SPM';
  const intervalInfo = parseIntervalPattern(splits, workoutType);

  // Build a set of rest split numbers for dimming
  const restSplitNumbers = new Set<number>();
  if (intervalInfo.isInterval) {
    for (const block of intervalInfo.intervals) {
      if (block.type === 'rest') {
        for (const s of block.splits) {
          restSplitNumbers.add(s.splitNumber);
        }
      }
    }
  }

  return (
    <div className="overflow-x-auto">
      {intervalInfo.isInterval && (
        <div className="mb-2 text-xs text-accent-teal font-mono font-medium">
          {intervalInfo.pattern}
        </div>
      )}
      <table className="w-full text-sm font-mono">
        <thead>
          <tr className="text-text-faint uppercase text-xs tracking-wider">
            <th className="text-left py-1.5 pr-3 font-medium">Split</th>
            <th className="text-right py-1.5 px-3 font-medium">Dist</th>
            <th className="text-right py-1.5 px-3 font-medium">Time</th>
            <th className="text-right py-1.5 px-3 font-medium">Pace</th>
            <th className="text-right py-1.5 px-3 font-medium">Watts</th>
            <th className="text-right py-1.5 pl-3 font-medium">{rateLabel}</th>
          </tr>
        </thead>
        <tbody>
          {splits.map((split) => {
            const isRest = restSplitNumbers.has(split.splitNumber);
            return (
              <tr
                key={split.splitNumber}
                className={`border-b border-edge-default last:border-0 ${isRest ? 'opacity-40' : ''}`}
              >
                <td className="py-1.5 pr-3 text-text-dim">{isRest ? 'R' : split.splitNumber}</td>
                <td className="py-1.5 px-3 text-right text-text-dim tabular-nums">
                  {split.distanceM != null ? formatDistance(split.distanceM) : DASH}
                </td>
                <td className="py-1.5 px-3 text-right text-text-dim tabular-nums">
                  {split.timeSeconds != null ? formatDuration(split.timeSeconds) : DASH}
                </td>
                <td className="py-1.5 px-3 text-right text-text-bright tabular-nums">
                  {formatPace(split.pace, machineType)}
                </td>
                <td className="py-1.5 px-3 text-right text-text-bright tabular-nums">
                  {split.watts != null ? split.watts : DASH}
                </td>
                <td className="py-1.5 pl-3 text-right text-text-dim tabular-nums">
                  {split.strokeRate != null ? split.strokeRate : DASH}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Chart tooltip                                                       */
/* ------------------------------------------------------------------ */

interface SplitChartPoint {
  split: number;
  watts: number;
}

function ChartTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload || payload.length === 0 || !payload[0]) return null;
  const data = payload[0].payload as SplitChartPoint;
  return (
    <div className="bg-void-raised border border-edge-default rounded-md px-2.5 py-1.5 shadow-md">
      <span className="font-mono text-sm font-semibold text-text-bright block">{data.watts}w</span>
      <span className="text-[10px] text-text-faint">Split {data.split}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Mini bar chart                                                      */
/* ------------------------------------------------------------------ */

function WattsChart({ splits }: { splits: WorkoutSplit[] }) {
  const data: SplitChartPoint[] = splits
    .filter((s) => s.watts != null)
    .map((s) => ({ split: s.splitNumber, watts: s.watts! }));

  if (data.length === 0) return null;

  return (
    <div className="h-[160px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--color-edge-default)"
            vertical={false}
          />
          <XAxis
            dataKey="split"
            tick={{ fontSize: 11, fill: 'var(--color-text-faint)' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: 'var(--color-text-faint)' }}
            axisLine={false}
            tickLine={false}
            width={36}
          />
          <Tooltip
            content={<ChartTooltip />}
            cursor={{ fill: 'var(--color-void-overlay)', opacity: 0.5 }}
          />
          <Bar
            dataKey="watts"
            fill="var(--color-accent-teal)"
            radius={[3, 3, 0, 0]}
            maxBarSize={32}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Secondary metrics                                                   */
/* ------------------------------------------------------------------ */

function SecondaryMetrics({ workout }: { workout: Workout }) {
  const items: Array<{ label: string; value: string }> = [];
  const rateLabel = workout.machineType === 'bikerg' ? 'RPM' : 'SPM';

  if (workout.strokeRate != null) {
    items.push({ label: `Avg ${rateLabel}`, value: String(workout.strokeRate) });
  }
  if (workout.avgHeartRate != null) {
    items.push({ label: 'Avg HR', value: `${workout.avgHeartRate} bpm` });
  }

  if (items.length === 0) return null;

  return (
    <div className="flex items-center gap-4">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5">
          <span className="text-xs text-text-faint">{item.label}:</span>
          <span className="text-xs font-mono text-text-dim tabular-nums">{item.value}</span>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* WorkoutRowExpanded                                                   */
/* ------------------------------------------------------------------ */

export function WorkoutRowExpanded({ workout, onNavigateToDetail }: WorkoutRowExpandedProps) {
  const hasSplits = workout.splits && workout.splits.length > 0;
  const hasNotes = workout.notes && workout.notes.trim().length > 0;
  const hasContent = hasSplits || hasNotes;

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={SPRING_GENTLE}
      className="overflow-hidden"
    >
      <div className="px-3 pb-4 pt-1 ml-12 space-y-4 border-l-2 border-edge-default">
        {hasSplits && (
          <>
            <SplitsTable
              splits={workout.splits!}
              machineType={workout.machineType}
              workoutType={workout.workoutType}
            />
            <WattsChart splits={workout.splits!} />
          </>
        )}

        {hasNotes && <p className="text-text-dim text-sm italic">{workout.notes}</p>}

        <SecondaryMetrics workout={workout} />

        {!hasContent && <p className="text-text-faint text-sm">No additional details</p>}

        <div className="flex justify-end">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onNavigateToDetail(workout.id);
            }}
            className="text-accent-teal hover:underline text-sm transition-colors"
          >
            View full detail
          </button>
        </div>
      </div>
    </motion.div>
  );
}
