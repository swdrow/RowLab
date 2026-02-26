/**
 * Splits visualization chart with bar/line toggle.
 * Bar chart (default) shows watts per split, colored by training zone.
 * Line chart shows pace + watts overlay.
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
import { IconBarChart, IconTrendingUp } from '@/components/icons';

import { formatPace } from '@/lib/format';
import type { WorkoutSplit } from '../types';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface SplitsChartProps {
  splits: WorkoutSplit[];
  machineType?: string | null;
}

type TrainingZone = 'ut2' | 'ut1' | 'at' | 'tr';

interface ChartDataPoint {
  split: number;
  pace: number | null; // seconds (not tenths)
  watts: number | null;
  spm: number | null;
  isRest: boolean;
  zone: TrainingZone;
  rateLabel: string;
}

type ChartMode = 'bar' | 'line';

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

const COPPER = 'var(--color-accent-teal)';
const BLUE = 'var(--color-machine-otw)';
const REST_COLOR = 'var(--color-text-faint)';
const GRID_COLOR = 'var(--color-edge-default)';
const TICK_COLOR = 'var(--color-text-faint)';

/** Zone color CSS variables */
const ZONE_COLORS: Record<TrainingZone, string> = {
  ut2: 'var(--color-zone-ut2)',
  ut1: 'var(--color-zone-ut1)',
  at: 'var(--color-zone-at)',
  tr: 'var(--color-zone-tr)',
};

const ZONE_LABELS: Record<TrainingZone, string> = {
  ut2: 'UT2',
  ut1: 'UT1',
  at: 'AT',
  tr: 'TR',
};

/* ------------------------------------------------------------------ */
/* Training zone classification                                        */
/* ------------------------------------------------------------------ */

/**
 * Classify a split into a training zone based on watts relative to the
 * max watts in the set. Uses percentage thresholds:
 *   UT2: < 60% of max watts
 *   UT1: 60-75%
 *   AT:  75-90%
 *   TR:  > 90%
 */
function classifyZone(watts: number | null, maxWatts: number): TrainingZone {
  if (watts == null || maxWatts <= 0) return 'ut2';

  const pct = watts / maxWatts;
  if (pct >= 0.9) return 'tr';
  if (pct >= 0.75) return 'at';
  if (pct >= 0.6) return 'ut1';
  return 'ut2';
}

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
/* Custom panel tooltip                                                */
/* ------------------------------------------------------------------ */

function ChartTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload || payload.length === 0) return null;
  const data = payload[0]?.payload as ChartDataPoint | undefined;
  if (!data) return null;

  const zoneColor = ZONE_COLORS[data.zone];

  return (
    <div className="bg-void-raised border border-edge-default rounded-xl shadow-md px-3 py-2 min-w-[130px]">
      <div className="flex items-center justify-between gap-3 mb-1">
        <p className="text-text-faint text-[10px] uppercase tracking-wider">Split {data.split}</p>
        {!data.isRest && (
          <span
            className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
            style={{
              color: zoneColor,
              backgroundColor: `color-mix(in oklch, ${zoneColor}, transparent 85%)`,
            }}
          >
            {ZONE_LABELS[data.zone]}
          </span>
        )}
      </div>
      {data.watts != null && (
        <p className="font-mono text-sm font-semibold text-text-bright">{data.watts}w</p>
      )}
      {data.pace != null && (
        <p className="font-mono text-xs text-text-dim">{formatPace(Math.round(data.pace * 10))}</p>
      )}
      {data.spm != null && (
        <p className="font-mono text-xs text-text-faint">
          {data.spm} {data.rateLabel}
        </p>
      )}
      {data.isRest && (
        <span className="inline-block mt-1 text-[10px] text-text-faint bg-void-overlay px-1.5 py-0.5 rounded">
          Rest
        </span>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Zone legend                                                         */
/* ------------------------------------------------------------------ */

function ZoneLegend() {
  return (
    <div className="flex items-center gap-3 mt-2">
      {(Object.keys(ZONE_COLORS) as TrainingZone[]).map((zone) => (
        <div key={zone} className="flex items-center gap-1">
          <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: ZONE_COLORS[zone] }} />
          <span className="text-[10px] text-text-faint font-medium">{ZONE_LABELS[zone]}</span>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* SplitsChart                                                         */
/* ------------------------------------------------------------------ */

export function SplitsChart({ splits, machineType }: SplitsChartProps) {
  const [mode, setMode] = useState<ChartMode>('bar');

  const { chartData, isInterval, maxWatts } = useMemo(() => {
    const restFlags = detectIntervals(splits);

    // Find max watts for zone classification
    const allWatts = splits.filter((s) => s.watts != null).map((s) => s.watts!);
    const mw = allWatts.length > 0 ? Math.max(...allWatts) : 0;

    const rl = machineType === 'bikerg' ? 'rpm' : 'spm';
    const data: ChartDataPoint[] = splits.map((s, i) => ({
      split: s.splitNumber,
      pace:
        s.pace != null
          ? (machineType === 'bikerg' ? Number(s.pace) * 2 : Number(s.pace)) / 10
          : null,
      watts: s.watts ?? null,
      spm: s.strokeRate ?? null,
      isRest: restFlags[i] ?? false,
      zone: classifyZone(s.watts ?? null, mw),
      rateLabel: rl,
    }));

    return {
      chartData: data,
      isInterval: restFlags.some(Boolean),
      maxWatts: mw,
    };
  }, [splits]);

  const hasWatts = chartData.some((d) => d.watts != null);
  const hasPace = chartData.some((d) => d.pace != null);

  if (!hasWatts && !hasPace) return null;

  // Whether we can show zone colors (need watts data)
  const showZoneColors = hasWatts && maxWatts > 0;

  return (
    <div className="bg-void-raised rounded-xl border border-edge-default p-4">
      {/* Toggle */}
      <div className="flex items-center justify-end gap-1 mb-3">
        <ToggleButton
          active={mode === 'bar'}
          onClick={() => setMode('bar')}
          icon={<IconBarChart width={14} height={14} />}
          label="Bar chart"
        />
        <ToggleButton
          active={mode === 'line'}
          onClick={() => setMode('line')}
          icon={<IconTrendingUp width={14} height={14} />}
          label="Line chart"
        />
      </div>

      {/* Chart */}
      <div className="h-[240px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          {mode === 'bar' ? (
            <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
              <defs>
                {showZoneColors &&
                  (Object.keys(ZONE_COLORS) as TrainingZone[]).map((zone) => (
                    <linearGradient key={zone} id={`zone-${zone}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={ZONE_COLORS[zone]} stopOpacity={1} />
                      <stop offset="100%" stopColor={ZONE_COLORS[zone]} stopOpacity={0.4} />
                    </linearGradient>
                  ))}
              </defs>
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
                cursor={{ fill: 'var(--color-void-overlay)', opacity: 0.5 }}
              />
              <Bar
                dataKey="watts"
                radius={[4, 4, 0, 0] as [number, number, number, number]}
                maxBarSize={40}
              >
                {chartData.map((entry, idx) => {
                  if (isInterval && entry.isRest) {
                    return <Cell key={idx} fill={REST_COLOR} opacity={0.5} />;
                  }
                  if (showZoneColors) {
                    return <Cell key={idx} fill={`url(#zone-${entry.zone})`} />;
                  }
                  return <Cell key={idx} fill={COPPER} />;
                })}
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

      {/* Zone legend (bar mode with zone colors only) */}
      {mode === 'bar' && showZoneColors && <ZoneLegend />}
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
        active ? 'bg-void-raised text-text-bright' : 'text-text-faint hover:text-text-dim'
      }`}
      aria-label={label}
      aria-pressed={active}
    >
      {icon}
    </button>
  );
}
