/**
 * Overview tab for the profile page.
 * Displays lifetime stat cards with sparkline trends,
 * time-range-toggled trend charts, and C2 integration status.
 */

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'motion/react';
import { Activity, Clock, Flame, Waves } from 'lucide-react';

import { profileStatsQueryOptions, profileTrendsQueryOptions } from '../api';
import { TrendChart } from './TrendChart';
import { GlassCard } from '@/components/ui/GlassCard';
import { Sparkline } from '@/components/ui/Sparkline';
import { formatNumber, formatDuration } from '@/lib/format';
import { listContainerVariants, listItemVariants, SPRING_SMOOTH } from '@/lib/animations';

import type { ProfileData } from '../types';
import type { TrendBucket } from '../types';

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

const RANGE_OPTIONS = ['7d', '30d', '90d', '1y', 'all'] as const;
type RangeOption = (typeof RANGE_OPTIONS)[number];

const RANGE_LABELS: Record<RangeOption, string> = {
  '7d': '7D',
  '30d': '30D',
  '90d': '90D',
  '1y': '1Y',
  all: 'All',
};

/** Number of recent data points to show in sparklines */
const SPARKLINE_POINTS = 8;

/* ------------------------------------------------------------------ */
/* Sparkline data extraction                                           */
/* ------------------------------------------------------------------ */

/**
 * Extract the last N values from trend buckets for a given metric.
 * Falls back to synthesized data from the stat value if no trend data.
 */
function extractSparklineData(
  buckets: TrendBucket[] | undefined,
  key: 'meters' | 'workouts' | 'durationSeconds',
  fallbackValue: number,
  count: number = SPARKLINE_POINTS
): number[] {
  if (buckets && buckets.length >= 2) {
    const slice = buckets.slice(-count);
    return slice.map((b) => b[key]);
  }

  // Synthesize a growing trend from the fallback stat value
  if (fallbackValue <= 0) return [];
  const points: number[] = [];
  for (let i = 0; i < count; i++) {
    const factor = 0.5 + (i / (count - 1)) * 0.5; // 0.5 to 1.0
    points.push(Math.round(fallbackValue * factor));
  }
  return points;
}

/**
 * Synthesize sparkline data for streak (no trend bucket equivalent).
 * Creates a rising pattern toward the current value.
 */
function synthesizeStreakSparkline(current: number, count: number = SPARKLINE_POINTS): number[] {
  if (current <= 0) return [];
  const points: number[] = [];
  for (let i = 0; i < count; i++) {
    // Simulate a streak building up with some variance
    const base = Math.max(0, current - (count - 1 - i));
    const variance = Math.random() * 0.3; // slight jitter
    points.push(Math.max(0, Math.round(base * (1 - variance))));
  }
  // Ensure last point is exactly current
  points[points.length - 1] = current;
  return points;
}

/* ------------------------------------------------------------------ */
/* Stat card sub-component                                             */
/* ------------------------------------------------------------------ */

interface OverviewStatProps {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string;
  footnote?: string;
  sparklineData?: number[];
}

function OverviewStat({ icon: Icon, label, value, footnote, sparklineData }: OverviewStatProps) {
  return (
    <GlassCard padding="md" as="article">
      <div className="flex flex-col gap-2" aria-label={`${label}: ${value}`} role="group">
        <div className="flex items-center justify-between">
          <div
            className="w-9 h-9 rounded-lg bg-ink-well flex items-center justify-center"
            aria-hidden="true"
          >
            <Icon size={18} className="text-accent-copper" />
          </div>
          {sparklineData && sparklineData.length >= 2 && (
            <Sparkline
              data={sparklineData}
              width={80}
              height={28}
              id={`stat-${label.replace(/\s+/g, '-').toLowerCase()}`}
            />
          )}
        </div>
        <span className="text-[10px] uppercase tracking-wider text-ink-muted font-medium">
          {label}
        </span>
        <span className="text-xl lg:text-2xl font-bold text-ink-primary tabular-nums">{value}</span>
        {footnote && <span className="text-[10px] text-ink-tertiary">{footnote}</span>}
      </div>
    </GlassCard>
  );
}

/* ------------------------------------------------------------------ */
/* Shimmer cards                                                       */
/* ------------------------------------------------------------------ */

function OverviewSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass rounded-xl p-5 space-y-3 animate-pulse">
            <div className="w-9 h-9 rounded-lg bg-ink-well" />
            <div className="h-3 w-16 rounded bg-ink-well" />
            <div className="h-6 w-24 rounded bg-ink-well" />
          </div>
        ))}
      </div>
      <div className="h-[200px] glass rounded-xl animate-pulse" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* OverviewTab                                                         */
/* ------------------------------------------------------------------ */

interface OverviewTabProps {
  profile: ProfileData;
}

export function OverviewTab({ profile }: OverviewTabProps) {
  const [selectedRange, setSelectedRange] = useState<RangeOption>('30d');

  const { data: stats, isLoading: statsLoading } = useQuery(profileStatsQueryOptions());
  const { data: trends } = useQuery(profileTrendsQueryOptions(selectedRange));

  // Derive sparkline data from trends or synthesize from stats
  const sparklines = useMemo(() => {
    const buckets = trends?.buckets;
    const totalMeters = stats?.allTime.totalMeters ?? 0;
    const workoutCount = stats?.allTime.workoutCount ?? 0;
    const totalDuration = stats?.allTime.totalDurationSeconds ?? 0;
    const streak = stats?.streak.current ?? 0;

    return {
      meters: extractSparklineData(buckets, 'meters', totalMeters),
      workouts: extractSparklineData(buckets, 'workouts', workoutCount),
      hours: extractSparklineData(buckets, 'durationSeconds', totalDuration),
      streak: synthesizeStreakSparkline(streak),
    };
  }, [trends?.buckets, stats]);

  if (statsLoading) return <OverviewSkeleton />;

  const totalHours = stats?.allTime.totalDurationSeconds
    ? Math.round(stats.allTime.totalDurationSeconds / 3600)
    : 0;

  return (
    <motion.div
      className="space-y-6"
      variants={listContainerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Stat cards */}
      <motion.div
        className="grid grid-cols-2 lg:grid-cols-4 gap-3"
        variants={listItemVariants}
        transition={SPRING_SMOOTH}
      >
        <OverviewStat
          icon={Waves}
          label="Total Meters"
          value={formatNumber(stats?.allTime.totalMeters ?? 0)}
          footnote="Lifetime"
          sparklineData={sparklines.meters}
        />
        <OverviewStat
          icon={Activity}
          label="Total Workouts"
          value={formatNumber(stats?.allTime.workoutCount ?? 0)}
          footnote="Lifetime"
          sparklineData={sparklines.workouts}
        />
        <OverviewStat
          icon={Clock}
          label="Training Hours"
          value={formatNumber(totalHours)}
          footnote={
            totalHours > 0 && stats?.allTime.totalDurationSeconds
              ? formatDuration(stats.allTime.totalDurationSeconds) + ' total'
              : 'Lifetime'
          }
          sparklineData={sparklines.hours}
        />
        <OverviewStat
          icon={Flame}
          label="Day Streak"
          value={String(stats?.streak.current ?? 0)}
          footnote={`Longest: ${stats?.streak.longest ?? 0} days`}
          sparklineData={sparklines.streak}
        />
      </motion.div>

      {/* Range toggle */}
      <motion.div
        className="flex items-center gap-1"
        variants={listItemVariants}
        transition={SPRING_SMOOTH}
      >
        {RANGE_OPTIONS.map((range) => (
          <button
            key={range}
            type="button"
            onClick={() => setSelectedRange(range)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              selectedRange === range
                ? 'bg-accent-copper/15 text-accent-copper'
                : 'text-ink-muted hover:text-ink-secondary hover:bg-ink-hover'
            }`}
            aria-pressed={selectedRange === range}
          >
            {RANGE_LABELS[range]}
          </button>
        ))}
      </motion.div>

      {/* Trend charts */}
      <motion.div
        className="grid grid-cols-1 lg:grid-cols-2 gap-4"
        variants={listItemVariants}
        transition={SPRING_SMOOTH}
      >
        <TrendChart data={trends?.buckets ?? []} dataKey="meters" type="area" label="Volume" />
        <TrendChart data={trends?.buckets ?? []} dataKey="workouts" type="area" label="Frequency" />
      </motion.div>

      <motion.div variants={listItemVariants} transition={SPRING_SMOOTH}>
        <TrendChart
          data={trends?.buckets ?? []}
          dataKey="meters"
          type="stacked-bar"
          label="Sport Breakdown"
        />
      </motion.div>

      {/* C2 integration status */}
      {profile.integrations.concept2 && (
        <motion.div
          className="glass rounded-xl p-4 flex items-center gap-3"
          variants={listItemVariants}
          transition={SPRING_SMOOTH}
        >
          <div className="w-8 h-8 rounded-lg bg-accent-copper/10 flex items-center justify-center">
            <Waves size={16} className="text-accent-copper" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-ink-primary">Concept2 Logbook</p>
            <p className="text-xs text-ink-tertiary truncate">
              {profile.integrations.concept2.connected
                ? `Connected as ${profile.integrations.concept2.username ?? 'user'}`
                : 'Not connected'}
            </p>
          </div>
          <span
            className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
              profile.integrations.concept2.connected
                ? 'bg-data-good/15 text-data-good'
                : 'bg-ink-well text-ink-muted'
            }`}
          >
            {profile.integrations.concept2.connected ? 'Syncing' : 'Disconnected'}
          </span>
        </motion.div>
      )}
    </motion.div>
  );
}
