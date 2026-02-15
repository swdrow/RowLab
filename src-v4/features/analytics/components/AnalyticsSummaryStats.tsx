/**
 * AnalyticsSummaryStats -- summary stat cards row above the volume chart.
 *
 * Displays total distance, total hours, total sessions, and average per
 * period (week or month) in a responsive 4-column grid of glass-style cards.
 * Uses copper accent on values.
 */

import type { VolumeSummary, VolumeMetric, VolumeGranularity } from '../types';

/* ------------------------------------------------------------------ */
/* Formatters                                                          */
/* ------------------------------------------------------------------ */

function formatDistance(meters: number): string {
  if (meters >= 1_000_000)
    return `${(meters / 1_000).toLocaleString('en-US', { maximumFractionDigits: 0 })} km`;
  if (meters >= 10_000) return `${(meters / 1_000).toFixed(1)} km`;
  return `${meters.toLocaleString('en-US', { maximumFractionDigits: 0 })} m`;
}

function formatHours(seconds: number): string {
  const hours = seconds / 3600;
  return `${hours.toFixed(1)} hrs`;
}

/* ------------------------------------------------------------------ */
/* StatCard                                                            */
/* ------------------------------------------------------------------ */

interface StatCardProps {
  label: string;
  value: string;
}

function StatCard({ label, value }: StatCardProps) {
  return (
    <div className="rounded-xl border border-ink-border bg-ink-raised/60 backdrop-blur-sm px-4 py-3">
      <p className="text-[10px] uppercase tracking-wider text-ink-muted font-medium mb-1">
        {label}
      </p>
      <p className="text-lg font-mono font-semibold text-accent-copper">{value}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* AnalyticsSummaryStats                                               */
/* ------------------------------------------------------------------ */

interface AnalyticsSummaryStatsProps {
  summary: VolumeSummary;
  metric: VolumeMetric;
  granularity: VolumeGranularity;
}

export function AnalyticsSummaryStats({
  summary,
  metric,
  granularity,
}: AnalyticsSummaryStatsProps) {
  const periodLabel = granularity === 'weekly' ? 'Week' : 'Month';
  const avgLabel = `Avg/${periodLabel}`;

  const avgFormatted =
    metric === 'distance'
      ? formatDistance(summary.avgPerPeriod)
      : formatHours(summary.avgPerPeriod);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
      <StatCard label="Total Distance" value={formatDistance(summary.totalDistance)} />
      <StatCard label="Total Hours" value={formatHours(summary.totalDuration)} />
      <StatCard label="Total Sessions" value={String(summary.totalSessions)} />
      <StatCard label={avgLabel} value={avgFormatted} />
    </div>
  );
}
