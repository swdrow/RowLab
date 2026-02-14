/**
 * Splits visualization chart with bar/line toggle.
 * Bar chart (default) shows watts per split. Line chart shows pace + watts overlay.
 * Interval workouts get work/rest color-coding via pace variance heuristic.
 */

import { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Legend,
  Cell,
  type TooltipProps,
} from 'recharts';
import { BarChart3, TrendingUp } from 'lucide-react';

import { formatPace } from '@/lib/format';
import type { WorkoutSplit } from '../types';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface SplitsChartProps {
  splits: WorkoutSplit[];
}

interface ChartDataPoint {
  split: number;
  pace: number | null; // seconds (not tenths)
  watts: number | null;
  spm: number | null;
  isRest: boolean;
}

type ChartMode = 'bar' | 'line';

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

const COPPER = 'var(--color-accent-copper)';
const BLUE = 'var(--color-accent-primary)';
const REST_COLOR = 'var(--color-ink-tertiary)';
const GRID_COLOR = 'var(--color-ink-border)';
const TICK_COLOR = 'var(--color-ink-tertiary)';

/* ------------------------------------------------------------------ */
/* Interval detection                                                  */
/* ------------------------------------------------------------------ */

/**
 * Detect interval workouts by looking for alternating fast/slow pace patterns.
 * If consecutive splits differ by > 20% in pace, mark slower splits as rest.
 */
function detectIntervals(splits: WorkoutSplit[]): boolean[] {
  if (splits.length < 4) return splits.map(() => false);

  const paces = splits.map((s) => (s.pace != null ? Number(s.pace) : null));
  let alternations = 0;

  for (let i = 1; i < paces.length; i++) {
    const prev = paces[i - 1];
    const curr = paces[i];
    if (prev == null || curr == null) continue;
    const diff = Math.abs(curr - prev) / Math.min(curr, prev);
    if (diff > 0.2) alternations++;
  }

  // Need at least half the transitions to be large variance for interval detection
  const isInterval = alternations >= Math.floor(paces.length / 2);
  if (!isInterval) return splits.map(() => false);

  // Mark splits: find the median pace, slower-than-median = rest
  const validPaces = paces.filter((p): p is number => p != null);
  if (validPaces.length === 0) return splits.map(() => false);

  const sorted = [...validPaces].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)]!;

  return paces.map((p) => (p != null ? p > median * 1.1 : false));
}

/* ------------------------------------------------------------------ */
/* Custom tooltip                                                      */
/* ------------------------------------------------------------------ */

function ChartTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload || payload.length === 0) return null;
  const data = payload[0]?.payload as ChartDataPoint | undefined;
  if (!data) return null;

  return (
    <div className="bg-ink-raised border border-ink-border rounded-lg shadow-card p-2.5 min-w-[120px]">
      <p className="text-ink-tertiary text-[10px] uppercase tracking-wider mb-1">
        Split {data.split}
      </p>
      {data.watts != null && (
        <p className="font-mono text-sm font-semibold text-ink-primary">{data.watts}w</p>
      )}
      {data.pace != null && (
        <p className="font-mono text-xs text-ink-secondary">
          {formatPace(Math.round(data.pace * 10))}
        </p>
      )}
      {data.spm != null && <p className="font-mono text-xs text-ink-muted">{data.spm} spm</p>}
      {data.isRest && (
        <span className="inline-block mt-1 text-[10px] text-ink-muted bg-ink-hover px-1.5 py-0.5 rounded">
          Rest
        </span>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* SplitsChart                                                         */
/* ------------------------------------------------------------------ */

export function SplitsChart({ splits }: SplitsChartProps) {
  const [mode, setMode] = useState<ChartMode>('bar');

  const { chartData, isInterval } = useMemo(() => {
    const restFlags = detectIntervals(splits);
    const data: ChartDataPoint[] = splits.map((s, i) => ({
      split: s.splitNumber,
      pace: s.pace != null ? Number(s.pace) / 10 : null,
      watts: s.watts ?? null,
      spm: s.strokeRate ?? null,
      isRest: restFlags[i] ?? false,
    }));

    return {
      chartData: data,
      isInterval: restFlags.some(Boolean),
    };
  }, [splits]);

  const hasWatts = chartData.some((d) => d.watts != null);
  const hasPace = chartData.some((d) => d.pace != null);

  if (!hasWatts && !hasPace) return null;

  return (
    <div className="bg-ink-raised rounded-xl border border-ink-border p-4">
      {/* Toggle */}
      <div className="flex items-center justify-end gap-1 mb-3">
        <ToggleButton
          active={mode === 'bar'}
          onClick={() => setMode('bar')}
          icon={<BarChart3 size={14} />}
          label="Bar chart"
        />
        <ToggleButton
          active={mode === 'line'}
          onClick={() => setMode('line')}
          icon={<TrendingUp size={14} />}
          label="Line chart"
        />
      </div>

      {/* Chart */}
      <div className="h-[240px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          {mode === 'bar' ? (
            <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} vertical={false} />
              <XAxis
                dataKey="split"
                tick={{ fontSize: 11, fill: TICK_COLOR }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: TICK_COLOR }}
                axisLine={false}
                tickLine={false}
                width={40}
              />
              <Tooltip
                content={<ChartTooltip />}
                cursor={{ fill: 'var(--color-ink-hover)', opacity: 0.5 }}
              />
              <Bar
                dataKey="watts"
                radius={[4, 4, 0, 0] as [number, number, number, number]}
                maxBarSize={40}
              >
                {chartData.map((entry, idx) => (
                  <Cell
                    key={idx}
                    fill={isInterval && entry.isRest ? REST_COLOR : COPPER}
                    opacity={isInterval && entry.isRest ? 0.5 : 1}
                  />
                ))}
              </Bar>
            </BarChart>
          ) : (
            <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} vertical={false} />
              <XAxis
                dataKey="split"
                tick={{ fontSize: 11, fill: TICK_COLOR }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                yAxisId="left"
                tick={{ fontSize: 11, fill: TICK_COLOR }}
                axisLine={false}
                tickLine={false}
                width={40}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 11, fill: TICK_COLOR }}
                axisLine={false}
                tickLine={false}
                width={40}
                reversed
              />
              <Tooltip content={<ChartTooltip />} />
              <Legend verticalAlign="bottom" height={24} wrapperStyle={{ fontSize: 11 }} />
              {hasWatts && (
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="watts"
                  name="Watts"
                  stroke={COPPER}
                  strokeWidth={2}
                  dot={{ r: 3, fill: COPPER }}
                  activeDot={{ r: 5 }}
                />
              )}
              {hasPace && (
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="pace"
                  name="Pace (s)"
                  stroke={BLUE}
                  strokeWidth={2}
                  strokeDasharray="6 3"
                  dot={{ r: 3, fill: BLUE }}
                  activeDot={{ r: 5 }}
                />
              )}
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Toggle button sub-component                                         */
/* ------------------------------------------------------------------ */

function ToggleButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`p-1.5 rounded-md transition-colors ${
        active ? 'bg-ink-raised text-ink-primary' : 'text-ink-muted hover:text-ink-secondary'
      }`}
      aria-label={label}
      aria-pressed={active}
    >
      {icon}
    </button>
  );
}
