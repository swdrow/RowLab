/**
 * Workout utility functions: auto-calculation, day grouping, calendar grid, sport mapping.
 */

import {
  isToday,
  isYesterday,
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
} from 'date-fns';

import type { SportType } from './constants';
import type { Workout, WorkoutSplit } from './types';
import type { WorkoutGroup } from './types';

/**
 * Auto-calculate the third value from any two of distance, time, pace.
 * Pace is in tenths of seconds per 500m.
 * Duration is in seconds.
 * Distance is in meters.
 *
 * Returns only the calculated field(s). If fewer than 2 inputs are provided
 * or all 3 are provided, returns an empty object.
 */
export function autoCalculate(
  distanceM: number | undefined,
  durationSeconds: number | undefined,
  paceTenths: number | undefined
): { distanceM?: number; durationSeconds?: number; avgPace?: number } {
  const result: { distanceM?: number; durationSeconds?: number; avgPace?: number } = {};

  if (distanceM && durationSeconds && !paceTenths) {
    // Calculate pace from distance + time
    // pace (tenths/500m) = (time / (distance / 500)) * 10
    result.avgPace = Math.round((durationSeconds / (distanceM / 500)) * 10);
  } else if (distanceM && paceTenths && !durationSeconds) {
    // Calculate time from distance + pace
    // time (seconds) = (pace_tenths / 10) * (distance / 500)
    result.durationSeconds = Math.round((paceTenths / 10) * (distanceM / 500));
  } else if (durationSeconds && paceTenths && !distanceM) {
    // Calculate distance from time + pace
    // distance (meters) = (time / (pace_tenths / 10)) * 500
    result.distanceM = Math.round((durationSeconds / (paceTenths / 10)) * 500);
  }

  return result;
}

/**
 * Group workouts by calendar day, producing date-labeled sections.
 * Returns groups ordered by the input order (typically date desc).
 * Labels: "Today", "Yesterday", "Feb 12", "Jan 5, 2025" (for different years).
 */
export function groupWorkoutsByDay(workouts: Workout[]): WorkoutGroup[] {
  const groups = new Map<string, Workout[]>();

  for (const workout of workouts) {
    const dateKey = workout.date.split('T')[0] ?? workout.date; // "2026-02-14"
    if (!groups.has(dateKey)) groups.set(dateKey, []);
    groups.get(dateKey)!.push(workout);
  }

  return Array.from(groups.entries()).map(([dateKey, items]) => {
    const date = new Date(dateKey + 'T00:00:00');
    let label: string;
    if (isToday(date)) label = 'Today';
    else if (isYesterday(date)) label = 'Yesterday';
    else if (date.getFullYear() === new Date().getFullYear()) label = format(date, 'MMM d');
    else label = format(date, 'MMM d, yyyy');

    return { dateKey, label, workouts: items };
  });
}

/**
 * Get all visible calendar days for a month view.
 * Returns dates from the start of the first visible week (Sunday)
 * through the end of the last visible week, producing a complete 5-6 week grid.
 */
export function getCalendarDays(month: Date): Date[] {
  const start = startOfWeek(startOfMonth(month), { weekStartsOn: 0 });
  const end = endOfWeek(endOfMonth(month), { weekStartsOn: 0 });
  return eachDayOfInterval({ start, end });
}

/**
 * Reverse-map a workout's DB type/machineType to a user-friendly SportType key.
 * Falls back to 'Other' for unknown combinations.
 */
export function getSportFromWorkout(workout: {
  type: string | null;
  machineType: string | null;
}): SportType {
  if (workout.type === 'erg') {
    if (workout.machineType === 'rower') return 'RowErg';
    if (workout.machineType === 'skierg') return 'SkiErg';
    if (workout.machineType === 'bikerg') return 'BikeErg';
    return 'RowErg'; // Default erg to RowErg
  }
  if (workout.type === 'cardio') {
    // Without machineType, best guess based on most common cardio
    return 'Running';
  }
  if (workout.type === 'strength') return 'Strength';
  if (workout.type === 'other') return 'Other';

  return 'Other';
}

/**
 * Aggregate volume metrics across an array of workouts.
 * Null-safe: skips null/undefined values in sums.
 */
export function getWorkoutVolume(workouts: Workout[]): {
  totalMeters: number;
  totalSeconds: number;
  count: number;
} {
  let totalMeters = 0;
  let totalSeconds = 0;

  for (const w of workouts) {
    if (w.distanceM != null) totalMeters += w.distanceM;
    if (w.durationSeconds != null) totalSeconds += w.durationSeconds;
  }

  return { totalMeters, totalSeconds, count: workouts.length };
}

/* ------------------------------------------------------------------ */
/* Interval pattern detection                                          */
/* ------------------------------------------------------------------ */

export interface IntervalBlock {
  type: 'work' | 'rest';
  splits: WorkoutSplit[];
  distanceM: number;
  timeSeconds: number;
}

export interface IntervalPattern {
  isInterval: boolean;
  /** Human-readable notation like "5 x 2000m" or "4 x 1000m / 3:00r" */
  pattern: string;
  intervals: IntervalBlock[];
  /** Number of work intervals */
  workCount: number;
}

/**
 * Analyze a splits array to detect repeating interval patterns.
 * Distinguishes work vs rest splits by comparing watts/distance
 * to the median values — rest periods have significantly lower output.
 *
 * Handles common C2 patterns:
 * - Fixed distance intervals: 5x2000m, 8x500m
 * - Fixed time intervals: 5x11:00
 * - Intervals with rest: 4x1000m/3:00r
 */
export function parseIntervalPattern(splits: WorkoutSplit[] | undefined): IntervalPattern {
  const none: IntervalPattern = { isInterval: false, pattern: '', intervals: [], workCount: 0 };

  if (!splits || splits.length < 3) return none;

  // Classify each split as work or rest based on watts relative to median
  const wattsValues = splits.filter((s) => s.watts != null).map((s) => s.watts!);
  const distValues = splits.filter((s) => s.distanceM != null).map((s) => s.distanceM!);

  if (wattsValues.length < 2 && distValues.length < 2) return none;

  const medianWatts = wattsValues.length > 0 ? median(wattsValues) : 0;
  const medianDist = distValues.length > 0 ? median(distValues) : 0;

  // A split is "rest" if watts < 30% of median OR distance < 30% of median
  const classified = splits.map((s) => {
    const isRest =
      (medianWatts > 0 && s.watts != null && s.watts < medianWatts * 0.3) ||
      (medianDist > 0 && s.distanceM != null && s.distanceM < medianDist * 0.3) ||
      (s.watts != null && s.watts === 0);
    return { split: s, isRest };
  });

  // Group consecutive same-type splits into blocks
  const blocks: IntervalBlock[] = [];
  let current: { type: 'work' | 'rest'; splits: WorkoutSplit[] } | null = null;

  for (const { split, isRest } of classified) {
    const type = isRest ? 'rest' : 'work';
    if (!current || current.type !== type) {
      if (current) {
        blocks.push(finishBlock(current));
      }
      current = { type, splits: [split] };
    } else {
      current.splits.push(split);
    }
  }
  if (current) blocks.push(finishBlock(current));

  // Need at least 2 work blocks to be an interval workout
  const workBlocks = blocks.filter((b) => b.type === 'work');
  if (workBlocks.length < 2) return none;

  // Check if work blocks have consistent distance or time
  const workDistances = workBlocks.map((b) => b.distanceM);
  const workTimes = workBlocks.map((b) => b.timeSeconds);
  const restBlocks = blocks.filter((b) => b.type === 'rest');

  const distConsistent = isConsistent(workDistances);
  const timeConsistent = isConsistent(workTimes);

  if (!distConsistent && !timeConsistent) return none;

  // Build the pattern string
  let pattern: string;
  const count = workBlocks.length;

  if (distConsistent && workDistances[0] > 0) {
    const dist = workDistances[0];
    pattern = `${count} x ${formatIntervalDist(dist)}`;
  } else if (timeConsistent && workTimes[0] > 0) {
    const time = workTimes[0];
    pattern = `${count} x ${formatIntervalTime(time)}`;
  } else {
    return none;
  }

  // Add rest notation if rest blocks exist and are consistent
  if (restBlocks.length > 0) {
    const restTimes = restBlocks.map((b) => b.timeSeconds);
    if (isConsistent(restTimes) && restTimes[0] > 0) {
      pattern += ` / ${formatIntervalTime(restTimes[0])}r`;
    }
  }

  return { isInterval: true, pattern, intervals: blocks, workCount: count };
}

function finishBlock(block: { type: 'work' | 'rest'; splits: WorkoutSplit[] }): IntervalBlock {
  const distanceM = block.splits.reduce((sum, s) => sum + (s.distanceM ?? 0), 0);
  const timeSeconds = block.splits.reduce((sum, s) => sum + (s.timeSeconds ?? 0), 0);
  return { type: block.type, splits: block.splits, distanceM, timeSeconds };
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/** Values are "consistent" if all are within 15% of the first value */
function isConsistent(values: number[]): boolean {
  if (values.length < 2) return false;
  const base = values[0];
  if (base === 0) return values.every((v) => v === 0);
  return values.every((v) => Math.abs(v - base) / base < 0.15);
}

function formatIntervalDist(meters: number): string {
  if (meters >= 1000 && meters % 1000 === 0) return `${meters / 1000}k`;
  return `${meters}m`;
}

function formatIntervalTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  if (secs === 0) return `${mins}:00`;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
