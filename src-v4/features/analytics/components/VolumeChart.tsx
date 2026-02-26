/**
 * VolumeChart -- grouped bar chart showing workout volume over time.
 *
 * Displays volume broken down by sport type with color-coded bars from
 * SPORT_CONFIG, a 4-period rolling average overlay line, metric/granularity
 * toggles, custom tooltip, and click-to-navigate behavior.
 *
 * Uses recharts ComposedChart to combine Bar (volume by sport) with
 * Line (rolling average).
 */

import { useMemo } from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  type TooltipProps,
} from 'recharts';

import { SPORT_CONFIG } from '@/features/workouts/constants';
import type { VolumeBucket, VolumeMetric, VolumeGranularity } from '../types';

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

const GRID_COLOR = 'var(--color-edge-default)';
const TICK_COLOR = 'var(--color-text-faint)';
const ROLLING_AVG_COLOR = 'var(--color-accent-teal)';

// SPORT_COLORS removed: was unused (resolveSportColors() used instead for SVG gradients)

/** Resolve sport colors at runtime for SVG gradient stopColor */
function resolveSportColors(): Record<string, string> {
  const style = getComputedStyle(document.documentElement);
  return Object.fromEntries(
    Object.entries(SPORT_CONFIG).map(([key, cfg]) => [
      key,
      style.getPropertyValue(`--color-${cfg.color}`).trim() || 'oklch(0.55 0.01 270)',
    ])
  );
}

/* ------------------------------------------------------------------ */
/* Formatters                                                          */
/* ------------------------------------------------------------------ */

function formatPeriodLabel(period: string, granularity: VolumeGranularity): string {
  if (granularity === 'monthly') {
    // "2026-01" -> "Jan"
    const d = new Date(period + '-01');
    return d.toLocaleDateString('en-US', { month: 'short' });
  }
  // Weekly: "2026-W03" or ISO date -> "Jan 13"
  if (period.includes('W')) {
    // ISO week format: extract approximate date
    const [yearStr, weekStr] = period.split('-W');
    const year = parseInt(yearStr!, 10);
    const week = parseInt(weekStr!, 10);
    const jan1 = new Date(year, 0, 1);
    const dayOffset = (week - 1) * 7 + (1 - jan1.getDay());
    const weekDate = new Date(year, 0, 1 + dayOffset);
    return weekDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  // Fallback: treat as date
  const d = new Date(period);
  if (!isNaN(d.getTime())) {
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  return period;
}

function formatYAxisValue(value: number, metric: VolumeMetric): string {
  if (metric === 'duration') {
    const hours = value / 3600;
    return hours >= 10 ? `${hours.toFixed(0)}h` : `${hours.toFixed(1)}h`;
  }
  // Distance
  if (value >= 10_000) return `${(value / 1_000).toFixed(0)}km`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}km`;
  return `${value}m`;
}

function formatTooltipValue(value: number, metric: VolumeMetric): string {
  if (metric === 'duration') {
    const hours = value / 3600;
    return `${hours.toFixed(1)} hrs`;
  }
  if (value >= 10_000) return `${(value / 1_000).toFixed(1)} km`;
  return `${value.toLocaleString('en-US')} m`;
}

/* ------------------------------------------------------------------ */
/* Toggle buttons                                                      */
/* ------------------------------------------------------------------ */

interface ToggleGroupProps<T extends string> {
  options: Array<{ value: T; label: string }>;
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
}

function ToggleGroup<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: ToggleGroupProps<T>) {
  return (
    <div
      className="flex gap-1 rounded-lg bg-void-surface/50 p-0.5"
      role="group"
      aria-label={ariaLabel}
    >
      {options.map((opt) => {
        const isActive = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            aria-pressed={isActive}
            className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${
              isActive
                ? 'bg-accent-teal/15 text-accent-teal'
                : 'text-text-faint hover:text-text-dim'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Custom Tooltip                                                      */
/* ------------------------------------------------------------------ */

interface VolumeTooltipProps extends TooltipProps<number, string> {
  metric: VolumeMetric;
  granularity: VolumeGranularity;
}

function VolumeTooltip({ active, payload, label, metric, granularity }: VolumeTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const periodLabel = formatPeriodLabel(label as string, granularity);

  // Filter out rolling average line and zero-value entries
  const sportEntries = payload.filter(
    (entry) => entry.dataKey !== 'rollingAvg' && (entry.value ?? 0) > 0
  );

  const total = sportEntries.reduce((sum, entry) => sum + ((entry.value as number) ?? 0), 0);

  return (
    <div className="bg-void-raised border border-edge-default rounded-xl px-4 py-3 shadow-md min-w-[180px]">
      <p className="text-[10px] uppercase tracking-wider text-text-faint font-medium mb-2">
        {periodLabel}
      </p>
      <div className="space-y-1.5">
        {sportEntries.map((entry) => (
          <div key={entry.name} className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm text-text-dim">{entry.name}:</span>
            <span className="text-sm font-semibold text-text-bright tabular-nums">
              {formatTooltipValue((entry.value as number) ?? 0, metric)}
            </span>
          </div>
        ))}
      </div>
      {sportEntries.length > 1 && (
        <div className="mt-2 pt-1.5 border-t border-edge-default/50 flex items-center justify-between">
          <span className="text-xs text-text-dim">Total</span>
          <span className="text-sm font-semibold text-text-bright tabular-nums">
            {formatTooltipValue(total, metric)}
          </span>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* VolumeChart                                                         */
/* ------------------------------------------------------------------ */

const METRIC_OPTIONS: Array<{ value: VolumeMetric; label: string }> = [
  { value: 'distance', label: 'Distance' },
  { value: 'duration', label: 'Duration' },
];

const GRANULARITY_OPTIONS: Array<{ value: VolumeGranularity; label: string }> = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

interface VolumeChartProps {
  data: VolumeBucket[];
  rollingAverage: number[];
  metric: VolumeMetric;
  granularity: VolumeGranularity;
  onMetricChange: (metric: VolumeMetric) => void;
  onGranularityChange: (granularity: VolumeGranularity) => void;
  onBarClick?: (startDate: string, endDate: string) => void;
}

export function VolumeChart({
  data,
  rollingAverage,
  metric,
  granularity,
  onMetricChange,
  onGranularityChange,
  onBarClick,
}: VolumeChartProps) {
  // Resolve sport colors for gradient defs
  const resolvedColors = useMemo(resolveSportColors, []);

  // Merge rolling average into chart data
  const chartData = useMemo(
    () =>
      data.map((bucket, i) => ({
        ...bucket,
        rollingAvg: rollingAverage[i] ?? null,
      })),
    [data, rollingAverage]
  );

  // Determine which sport types have data (only render bars for sports with workouts)
  const activeSportKeys = useMemo(() => {
    const sportSet = new Set<string>();
    for (const bucket of data) {
      for (const [sport, value] of Object.entries(bucket.byType)) {
        if (value > 0) sportSet.add(sport);
      }
    }
    // Sort by SPORT_CONFIG order
    const configOrder = Object.keys(SPORT_CONFIG);
    return Array.from(sportSet).sort((a, b) => configOrder.indexOf(a) - configOrder.indexOf(b));
  }, [data]);

  const handleChartClick = (
    state: {
      activePayload?: Array<{ payload: VolumeBucket & { rollingAvg: number | null } }>;
    } | null
  ) => {
    if (!state?.activePayload?.[0] || !onBarClick) return;
    const bucket = state.activePayload[0].payload;
    onBarClick(bucket.startDate, bucket.endDate);
  };

  // Empty state
  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-edge-default bg-void-raised p-8">
        {/* Header row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <h3 className="text-sm font-display font-semibold text-text-bright">Volume Trends</h3>
          <div className="flex items-center gap-2">
            <ToggleGroup
              options={METRIC_OPTIONS}
              value={metric}
              onChange={onMetricChange}
              ariaLabel="Volume metric"
            />
            <ToggleGroup
              options={GRANULARITY_OPTIONS}
              value={granularity}
              onChange={onGranularityChange}
              ariaLabel="Time granularity"
            />
          </div>
        </div>
        <div className="h-[220px] md:h-[300px] flex flex-col items-center justify-center">
          <p className="text-sm text-text-faint mb-2">No workout data for this period</p>
          <p className="text-xs text-text-faint">Log a workout to see your volume trends</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-edge-default bg-void-raised p-4">
      {/* Header row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <h3 className="text-sm font-display font-semibold text-text-bright">Volume Trends</h3>
        <div className="flex items-center gap-2">
          <ToggleGroup
            options={METRIC_OPTIONS}
            value={metric}
            onChange={onMetricChange}
            ariaLabel="Volume metric"
          />
          <ToggleGroup
            options={GRANULARITY_OPTIONS}
            value={granularity}
            onChange={onGranularityChange}
            ariaLabel="Time granularity"
          />
        </div>
      </div>

      {/* Chart */}
      <div className="h-[220px] md:h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 8, right: 8, bottom: 4, left: 4 }}
            onClick={handleChartClick}
          >
            {/* Gradient definitions for sport bar fills */}
            <defs>
              {activeSportKeys.map((sport) => {
                const color = resolvedColors[sport] || 'oklch(0.55 0.01 270)';
                return (
                  <linearGradient
                    key={`gradFill-${sport}`}
                    id={`gradFill-${sport}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor={color} stopOpacity={0.9} />
                    <stop offset="100%" stopColor={color} stopOpacity={0.4} />
                  </linearGradient>
                );
              })}
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} vertical={false} />

            <XAxis
              dataKey="period"
              tickFormatter={(p: string) => formatPeriodLabel(p, granularity)}
              tick={{ fontSize: 10, fill: TICK_COLOR }}
              axisLine={false}
              tickLine={false}
              minTickGap={30}
            />

            <YAxis
              tickFormatter={(v: number) => formatYAxisValue(v, metric)}
              tick={{ fontSize: 10, fill: TICK_COLOR }}
              axisLine={false}
              tickLine={false}
              width={45}
            />

            <Tooltip content={<VolumeTooltip metric={metric} granularity={granularity} />} />

            {/* Legend is rendered by recharts auto-legend */}
            <Legend
              iconType="square"
              iconSize={8}
              wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
              formatter={(value: string) => (
                <span className="text-text-dim text-[11px]">{value}</span>
              )}
            />

            {/* Grouped bars per sport type with gradient fills */}
            {activeSportKeys.map((sport, idx) => (
              <Bar
                key={sport}
                dataKey={`byType.${sport}`}
                name={SPORT_CONFIG[sport as keyof typeof SPORT_CONFIG]?.label ?? sport}
                fill={`url(#gradFill-${sport})`}
                radius={idx === activeSportKeys.length - 1 ? [2, 2, 0, 0] : undefined}
                barSize={activeSportKeys.length > 3 ? 8 : 14}
                isAnimationActive={false}
              />
            ))}

            {/* 4-period rolling average overlay */}
            <Line
              dataKey="rollingAvg"
              name="4-period avg"
              stroke={ROLLING_AVG_COLOR}
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={false}
              isAnimationActive={false}
              connectNulls
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
