/**
 * Quick stats grid — 4 stat cards in responsive layout.
 * Displays total meters, workout count, active days, and current streak.
 * Each card includes a synthetic sparkline showing growth trajectory.
 */

import { useMemo } from 'react';
import { motion } from 'motion/react';
import { IconWaves, IconDumbbell, IconCalendarDays, IconFlame } from '@/components/icons';
import { StatCard } from './StatCard';
import type { StatsData } from '../types';
import { formatNumber } from '@/lib/format';

/**
 * Generate a synthetic sparkline from a final value.
 * Simulates a 7-point growth trajectory for visual trend indication.
 * Returns null for zero values (no trend to show).
 */
function syntheticSparkline(value: number): number[] | undefined {
  if (value <= 0) return undefined;
  const factors = [0.6, 0.68, 0.75, 0.82, 0.89, 0.95, 1.0];
  return factors.map((f) => Math.round(value * f));
}

interface QuickStatsGridProps {
  stats: StatsData;
  className?: string;
}

export function QuickStatsGrid({ stats, className = '' }: QuickStatsGridProps) {
  const { allTime, streak } = stats;

  const sparklines = useMemo(
    () => ({
      meters: syntheticSparkline(allTime.totalMeters),
      workouts: syntheticSparkline(allTime.workoutCount),
      activeDays: syntheticSparkline(allTime.activeDays),
      streak: syntheticSparkline(streak.current),
    }),
    [allTime.totalMeters, allTime.workoutCount, allTime.activeDays, streak.current]
  );

  return (
    <motion.div
      className={`grid grid-cols-2 gap-3 ${className}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <StatCard
        icon={IconWaves}
        label="Total Meters"
        value={allTime.totalMeters}
        formattedValue={formatNumber(allTime.totalMeters)}
        footnote="All time"
        sparklineData={sparklines.meters}
      />
      <StatCard
        icon={IconDumbbell}
        label="Workouts"
        value={allTime.workoutCount}
        footnote="All time"
        sparklineData={sparklines.workouts}
        sparklineColor="oklch(0.62 0.17 255)"
      />
      <StatCard
        icon={IconCalendarDays}
        label="Active Days"
        value={allTime.activeDays}
        footnote="All time"
        sparklineData={sparklines.activeDays}
        sparklineColor="oklch(0.72 0.17 142)"
      />
      <StatCard
        icon={IconFlame}
        label="Current Streak"
        value={streak.current}
        footnote={streak.longest > 0 ? `Best: ${streak.longest} days` : undefined}
        sparklineData={sparklines.streak}
        sparklineColor="oklch(0.75 0.14 75)"
      />
    </motion.div>
  );
}
