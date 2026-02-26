/**
 * ELO distribution bar chart.
 *
 * Vertical bar chart showing athlete ELO ratings, color-coded by rating level.
 * Uses recharts with CSS variable tokens from the v4 design system.
 * Bar opacity scales with confidence score (higher confidence = more opaque).
 */

import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Cell,
  type TooltipProps,
} from 'recharts';
import { getConfidenceLevel, getRatingColor, type AthleteRating } from '../types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const GRID_COLOR = 'var(--color-edge-default)';
const TICK_COLOR = 'var(--color-text-faint)';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EloChartProps {
  ratings: AthleteRating[];
  maxAthletes?: number;
}

interface ChartDataPoint {
  name: string;
  rating: number;
  confidence: number;
  racesCount: number;
  color: string;
}

// ---------------------------------------------------------------------------
// Custom tooltip
// ---------------------------------------------------------------------------

function ChartTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload || payload.length === 0) return null;
  const data = payload[0]?.payload as ChartDataPoint | undefined;
  if (!data) return null;

  return (
    <div className="bg-void-raised border border-edge-default rounded-lg shadow-md p-2.5 min-w-[140px]">
      <p className="text-text-bright text-sm font-medium mb-1">{data.name}</p>
      <div className="space-y-0.5">
        <p className="font-mono text-sm" style={{ color: data.color }}>
          {Math.round(data.rating)} ELO
        </p>
        <p className="text-text-dim text-xs">
          Confidence: {getConfidenceLevel(data.confidence)}
        </p>
        <p className="text-text-faint text-xs">{data.racesCount} pieces raced</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// EloChart
// ---------------------------------------------------------------------------

export function EloChart({ ratings, maxAthletes = 15 }: EloChartProps) {
  const chartData = useMemo<ChartDataPoint[]>(() => {
    const sorted = [...ratings].sort((a, b) => b.ratingValue - a.ratingValue).slice(0, maxAthletes);

    return sorted.map((r) => ({
      name: `${r.athlete.firstName} ${r.athlete.lastName}`,
      rating: r.ratingValue,
      confidence: r.confidenceScore ?? 0,
      racesCount: r.racesCount,
      color: getRatingColor(r.ratingValue),
    }));
  }, [ratings, maxAthletes]);

  if (ratings.length === 0) return null;

  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 4, right: 12, bottom: 4, left: 4 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} horizontal={false} />
          <XAxis
            type="number"
            domain={['dataMin - 50', 'dataMax + 50']}
            tick={{ fontSize: 11, fill: TICK_COLOR }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 11, fill: TICK_COLOR }}
            axisLine={false}
            tickLine={false}
            width={110}
          />
          <Tooltip
            content={<ChartTooltip />}
            cursor={{ fill: 'var(--color-void-overlay)', opacity: 0.5 }}
          />
          <Bar dataKey="rating" radius={[0, 4, 4, 0]} maxBarSize={28}>
            {chartData.map((entry, idx) => (
              <Cell key={idx} fill={entry.color} fillOpacity={0.3 + entry.confidence * 0.7} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
