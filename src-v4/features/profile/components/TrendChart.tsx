/**
 * Reusable trend chart for profile Overview tab.
 * Supports area chart (volume/frequency) and stacked bar chart (sport breakdown).
 * Uses design-system CSS variables for all colors.
 * Area charts use gradient fill from accent color to transparent.
 */

import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  type TooltipProps,
} from 'recharts';

import type { TrendBucket } from '../types';

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

const COPPER = 'var(--color-accent-teal)';
const GRID_COLOR = 'var(--color-edge-default)';
const TICK_COLOR = 'var(--color-text-faint)';

/** Sport color mapping for stacked bar segments */
const SPORT_COLORS: Record<string, string> = {
  RowErg: 'var(--color-machine-rower)',
  SkiErg: 'var(--color-data-good)',
  BikeErg: 'var(--color-data-warning)',
  Running: 'var(--color-data-excellent)',
  Strength: 'var(--color-data-poor)',
  Other: 'var(--color-text-faint)',
};

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface TrendChartProps {
  data: TrendBucket[];
  dataKey: 'meters' | 'workouts';
  type: 'area' | 'stacked-bar';
  label?: string;
}

/* ------------------------------------------------------------------ */
/* Color resolver                                                      */
/* ------------------------------------------------------------------ */

/** Resolve CSS variable to actual color value for SVG gradient stops */
function resolveAccentColor(): string {
  if (typeof document === 'undefined') return 'oklch(0.62 0.12 55)';
  const style = getComputedStyle(document.documentElement);
  return style.getPropertyValue('--color-accent-teal').trim() || 'oklch(0.55 0.06 195)';
}

/* ------------------------------------------------------------------ */
/* Formatters                                                          */
/* ------------------------------------------------------------------ */

function formatWeekLabel(week: string): string {
  // 'YYYY-Www' -> 'Www' for compact display
  return week.split('-')[1] ?? week;
}

function formatKValue(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return String(value);
}

/* ------------------------------------------------------------------ */
/* Custom panel tooltip                                                */
/* ------------------------------------------------------------------ */

function ChartTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="bg-void-raised border border-edge-default rounded-xl px-3 py-2 shadow-md min-w-[120px]">
      <p className="text-text-faint text-[10px] uppercase tracking-wider mb-1.5">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2 py-0.5">
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: entry.color }}
          />
          <p className="text-text-bright font-medium text-sm">
            {typeof entry.value === 'number' ? formatKValue(entry.value) : entry.value}
          </p>
          <p className="text-text-faint text-xs">{entry.name}</p>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* TrendChart                                                          */
/* ------------------------------------------------------------------ */

export function TrendChart({ data, dataKey, type, label }: TrendChartProps) {
  // Resolve CSS var for SVG gradient stops
  const accentColor = useMemo(() => resolveAccentColor(), []);

  // Unique gradient ID per chart instance to avoid collisions
  const gradientId = `trendFill-${dataKey}`;

  if (data.length === 0) {
    return (
      <div className="bg-void-raised rounded-xl border border-edge-default p-4">
        {label && (
          <p className="text-xs uppercase tracking-wider text-text-faint font-medium mb-3">
            {label}
          </p>
        )}
        <div className="h-[200px] flex items-center justify-center">
          <p className="text-sm text-text-faint">No trend data available</p>
        </div>
      </div>
    );
  }

  // Extract unique sport keys for stacked bar
  const sportKeys =
    type === 'stacked-bar' ? Array.from(new Set(data.flatMap((b) => Object.keys(b.byType)))) : [];

  return (
    <div className="bg-void-raised rounded-xl border border-edge-default p-4">
      {label && (
        <p className="text-xs uppercase tracking-wider text-text-faint font-medium mb-3">{label}</p>
      )}
      <div className="h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          {type === 'area' ? (
            <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={accentColor} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={accentColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} vertical={false} />
              <XAxis
                dataKey="week"
                tickFormatter={formatWeekLabel}
                tick={{ fontSize: 10, fill: TICK_COLOR }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={formatKValue}
                tick={{ fontSize: 10, fill: TICK_COLOR }}
                axisLine={false}
                tickLine={false}
                width={40}
              />
              <Tooltip content={<ChartTooltip />} />
              <Area
                type="monotone"
                dataKey={dataKey}
                name={dataKey === 'meters' ? 'Volume' : 'Workouts'}
                stroke={COPPER}
                strokeWidth={2}
                fill={`url(#${gradientId})`}
                isAnimationActive={false}
              />
            </AreaChart>
          ) : (
            <BarChart data={data} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} vertical={false} />
              <XAxis
                dataKey="week"
                tickFormatter={formatWeekLabel}
                tick={{ fontSize: 10, fill: TICK_COLOR }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={formatKValue}
                tick={{ fontSize: 10, fill: TICK_COLOR }}
                axisLine={false}
                tickLine={false}
                width={40}
              />
              <Tooltip content={<ChartTooltip />} />
              {sportKeys.map((sport) => (
                <Bar
                  key={sport}
                  dataKey={`byType.${sport}`}
                  name={sport}
                  stackId="sport"
                  fill={SPORT_COLORS[sport] ?? SPORT_COLORS.Other}
                  radius={
                    sportKeys.indexOf(sport) === sportKeys.length - 1 ? [2, 2, 0, 0] : undefined
                  }
                  isAnimationActive={false}
                />
              ))}
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
