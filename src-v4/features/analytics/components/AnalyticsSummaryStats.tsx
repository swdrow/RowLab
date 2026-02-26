/**
 * AnalyticsSummaryStats -- summary stat cards row above the volume chart.
 *
 * Displays total distance, total hours, total sessions, and average per
 * period (week or month) in a responsive 4-column grid of Card-wrapped
 * cards with color-coded left borders, sparklines, and trend arrows.
 */

import { Card } from '@/components/ui/Card';
import { Sparkline } from '@/components/ui/Sparkline';
import { formatHours } from '@/lib/format';
import type { VolumeSummary, VolumeMetric, VolumeGranularity, VolumeBucket } from '../types';

/* ------------------------------------------------------------------ */
/* Formatters                                                          */
/* ------------------------------------------------------------------ */

// Local: analytics distance uses "X km" / "X m" with locale formatting,
// differs from @/lib/format which uses compact "Xk" / "Xm" form.
function formatDistance(meters: number): string {
  if (meters >= 1_000_000)
    return `${(meters / 1_000).toLocaleString('en-US', { maximumFractionDigits: 0 })} km`;
  if (meters >= 10_000) return `${(meters / 1_000).toFixed(1)} km`;
  return `${meters.toLocaleString('en-US', { maximumFractionDigits: 0 })} m`;
}

/* ------------------------------------------------------------------ */
/* Trend helpers                                                       */
/* ------------------------------------------------------------------ */

type TrendDirection = 'up' | 'down' | 'stable';

function computeTrend(data: number[]): TrendDirection {
  if (data.length < 4) return 'stable';
  const mid = Math.floor(data.length / 2);
  const firstHalf = data.slice(0, mid).reduce((a, b) => a + b, 0) / mid;
  const secondHalf = data.slice(mid).reduce((a, b) => a + b, 0) / (data.length - mid);
  const change = (secondHalf - firstHalf) / (firstHalf || 1);
  if (change > 0.05) return 'up';
  if (change < -0.05) return 'down';
  return 'stable';
}

function TrendArrow({ direction }: { direction: TrendDirection }) {
  if (direction === 'up') {
    return (
      <span className="text-data-good text-sm" aria-label="Trending up">
        &#x25B2;
      </span>
    );
  }
  if (direction === 'down') {
    return (
      <span className="text-data-poor text-sm" aria-label="Trending down">
        &#x25BC;
      </span>
    );
  }
  return (
    <span className="text-text-faint text-sm" aria-label="Stable">
      &mdash;
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* StatCard                                                            */
/* ------------------------------------------------------------------ */

interface StatCardProps {
  label: string;
  value: string;
  borderColorClass: string;
  sparklineData: number[];
  sparklineColor: string;
  trend: TrendDirection;
}

function StatCard({
  label,
  value,
  borderColorClass,
  sparklineData,
  sparklineColor,
  trend,
}: StatCardProps) {
  return (
    <Card variant="interactive" padding="none" className={`border-l-[3px] ${borderColorClass}`}>
      <div className="px-4 py-3">
        <p className="text-[10px] uppercase tracking-wider text-text-faint font-medium mb-1">
          {label}
        </p>
        <div className="flex items-end justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <p className="text-xl font-mono font-bold text-text-bright tabular-nums">{value}</p>
            <TrendArrow direction={trend} />
          </div>
          {sparklineData.length >= 2 && (
            <Sparkline
              data={sparklineData}
              height={24}
              width={70}
              color={sparklineColor}
              id={`stat-${label.replace(/\s/g, '-').toLowerCase()}`}
            />
          )}
        </div>
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* AnalyticsSummaryStats                                               */
/* ------------------------------------------------------------------ */

interface AnalyticsSummaryStatsProps {
  summary: VolumeSummary;
  metric: VolumeMetric;
  granularity: VolumeGranularity;
  /** Weekly/monthly buckets for sparkline data */
  buckets?: VolumeBucket[];
}

export function AnalyticsSummaryStats({
  summary,
  metric,
  granularity,
  buckets = [],
}: AnalyticsSummaryStatsProps) {
  const periodLabel = granularity === 'weekly' ? 'Week' : 'Month';
  const avgLabel = `Avg/${periodLabel}`;

  const avgFormatted =
    metric === 'distance'
      ? formatDistance(summary.avgPerPeriod)
      : formatHours(summary.avgPerPeriod);

  // Derive sparkline data from buckets
  const distanceByPeriod = buckets.map((b) =>
    b.byType ? Object.values(b.byType).reduce((s, v) => s + v, 0) : b.total
  );
  const durationByPeriod = buckets.map((b) => b.total); // total is in the metric unit
  const sessionsByPeriod = buckets.map((b) => b.workoutCount);

  // Synthetic sparkline from total if no buckets
  const syntheticFromTotal = (total: number) => [
    total * 0.1,
    total * 0.12,
    total * 0.15,
    total * 0.13,
    total * 0.14,
    total * 0.18,
    total * 0.18,
  ];

  const distSpark =
    distanceByPeriod.length >= 2 ? distanceByPeriod : syntheticFromTotal(summary.totalDistance);
  const durSpark =
    durationByPeriod.length >= 2 ? durationByPeriod : syntheticFromTotal(summary.totalDuration);
  const sessSpark =
    sessionsByPeriod.length >= 2 ? sessionsByPeriod : syntheticFromTotal(summary.totalSessions);
  const avgSpark =
    distanceByPeriod.length >= 2
      ? metric === 'distance'
        ? distanceByPeriod
        : durationByPeriod
      : syntheticFromTotal(summary.avgPerPeriod);

  // Resolve accent colors via CSS variables for Recharts SVG props
  const style = getComputedStyle(document.documentElement);
  const greenColor = style.getPropertyValue('--color-data-good').trim() || 'oklch(0.62 0.17 255)';
  const blueColor = style.getPropertyValue('--color-accent-teal').trim() || 'oklch(0.55 0.06 195)';
  const copperColor =
    style.getPropertyValue('--color-accent-teal').trim() || 'oklch(0.55 0.06 195)';
  const amberColor = style.getPropertyValue('--color-data-warning').trim() || 'oklch(0.75 0.14 75)';

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
      <StatCard
        label="Total Distance"
        value={formatDistance(summary.totalDistance)}
        borderColorClass="border-data-good"
        sparklineData={distSpark}
        sparklineColor={greenColor}
        trend={computeTrend(distSpark)}
      />
      <StatCard
        label="Total Hours"
        value={formatHours(summary.totalDuration)}
        borderColorClass="border-accent-teal-primary"
        sparklineData={durSpark}
        sparklineColor={blueColor}
        trend={computeTrend(durSpark)}
      />
      <StatCard
        label="Total Sessions"
        value={String(summary.totalSessions)}
        borderColorClass="border-accent-teal"
        sparklineData={sessSpark}
        sparklineColor={copperColor}
        trend={computeTrend(sessSpark)}
      />
      <StatCard
        label={avgLabel}
        value={avgFormatted}
        borderColorClass="border-data-warning"
        sparklineData={avgSpark}
        sparklineColor={amberColor}
        trend={computeTrend(avgSpark)}
      />
    </div>
  );
}
