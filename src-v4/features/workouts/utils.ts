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
 * Uses two strategies:
 *
 * 1. **C2 workout_type hint**: If workoutType contains "Interval", each split
 *    is a work interval (C2 stores rest as metadata, not separate splits).
 *
 * 2. **Split analysis fallback**: Classifies work vs rest by comparing watts/distance
 *    to median values — rest periods have significantly lower output.
 *
 * Handles common C2 patterns:
 * - Fixed distance intervals: 5x2000m, 8x500m
 * - Fixed time intervals: 5x11:00
 * - Intervals with rest: 4x1000m/3:00r
 */
export function parseIntervalPattern(
  splits: WorkoutSplit[] | undefined,
  workoutType?: string | null
): IntervalPattern {
  const none: IntervalPattern = { isInterval: false, pattern: '', intervals: [], workCount: 0 };

  if (!splits || splits.length < 2) return none;

  // Strategy 1: C2 workout_type hint — each split is one work interval
  const isC2Interval = workoutType
    ? /interval/i.test(workoutType) || /VariableInterval/i.test(workoutType)
    : false;

  if (isC2Interval && splits.length >= 2) {
    const preferTime = /FixedTime/i.test(workoutType ?? '');
    return buildPatternFromSplitsDirectly(splits, preferTime);
  }

  // Strategy 2: split-based work/rest classification (needs ≥3 splits)
  if (splits.length < 3) return none;

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

  const firstWorkDist = workDistances[0];
  const firstWorkTime = workTimes[0];

  if (distConsistent && firstWorkDist !== undefined && firstWorkDist > 0) {
    pattern = `${count} x ${formatIntervalDist(firstWorkDist)}`;
  } else if (timeConsistent && firstWorkTime !== undefined && firstWorkTime > 0) {
    pattern = `${count} x ${formatIntervalTime(firstWorkTime)}`;
  } else {
    return none;
  }

  // Add rest notation if rest blocks exist and are consistent
  if (restBlocks.length > 0) {
    const restTimes = restBlocks.map((b) => b.timeSeconds);
    const firstRestTime = restTimes[0];
    if (isConsistent(restTimes) && firstRestTime !== undefined && firstRestTime > 0) {
      pattern += ` / ${formatIntervalTime(firstRestTime)}r`;
    }
  }

  return { isInterval: true, pattern, intervals: blocks, workCount: count };
}

/**
 * Build interval pattern when each split is known to be one work interval.
 * Used for C2 interval workouts where rest is stored as metadata, not separate splits.
 * When preferTime is true (FixedTimeInterval), show time-based pattern even if distances are consistent.
 */
function buildPatternFromSplitsDirectly(
  splits: WorkoutSplit[],
  preferTime = false
): IntervalPattern {
  const none: IntervalPattern = { isInterval: false, pattern: '', intervals: [], workCount: 0 };
  const count = splits.length;

  const distances = splits.filter((s) => s.distanceM != null).map((s) => s.distanceM!);
  const times = splits.filter((s) => s.timeSeconds != null).map((s) => s.timeSeconds!);

  const distConsistent = distances.length === count && isConsistent(distances);
  const timeConsistent = times.length === count && isConsistent(times);

  const firstTime = times[0];
  const firstDist = distances[0];

  let pattern: string;
  if (preferTime && timeConsistent && firstTime !== undefined && firstTime > 0) {
    // FixedTimeInterval: always show time-based pattern
    pattern = `${count} x ${formatIntervalTime(firstTime)}`;
  } else if (!preferTime && distConsistent && firstDist !== undefined && firstDist > 0) {
    // FixedDistanceInterval or default: show distance-based pattern
    pattern = `${count} x ${formatIntervalDist(firstDist)}`;
  } else if (timeConsistent && firstTime !== undefined && firstTime > 0) {
    pattern = `${count} x ${formatIntervalTime(firstTime)}`;
  } else if (distConsistent && firstDist !== undefined && firstDist > 0) {
    pattern = `${count} x ${formatIntervalDist(firstDist)}`;
  } else if (count >= 2) {
    // Variable intervals — just show count
    pattern = `${count} intervals`;
  } else {
    return none;
  }

  // Each split becomes its own work block
  const blocks: IntervalBlock[] = splits.map((s) => ({
    type: 'work' as const,
    splits: [s],
    distanceM: s.distanceM ?? 0,
    timeSeconds: s.timeSeconds ?? 0,
  }));

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
  if (sorted.length % 2) {
    return sorted[mid] ?? 0;
  }
  return ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2;
}

/** Values are "consistent" if all are within 15% of the first value */
function isConsistent(values: number[]): boolean {
  if (values.length < 2) return false;
  const base = values[0];
  if (base === undefined) return false;
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

/* ------------------------------------------------------------------ */
/* Session grouping: merge consecutive same-distance pieces            */
/* ------------------------------------------------------------------ */

/** Maximum gap between pieces to consider them part of one session (seconds) */
const MAX_SESSION_GAP = 1800; // 30 minutes

/**
 * Detect consecutive same-distance erg workouts within each day that were
 * likely done as one interval session (e.g., 5 x 1500m logged as 5 separate
 * pieces on C2). Returns a new array where detected sessions are replaced
 * with a synthetic session workout.
 *
 * The synthetic workout:
 * - Has `id` prefixed with `session:` (not a real DB record)
 * - Uses `workoutType: 'FixedDistanceInterval'` to trigger interval display
 * - Has splits derived from the individual pieces
 * - Shows inferred rest between pieces in the notes field
 */
export function detectWorkoutSessions(workouts: Workout[]): Workout[] {
  if (workouts.length < 2) return workouts;

  // Group by calendar day
  const byDate = new Map<string, Workout[]>();
  for (const w of workouts) {
    const dateKey = w.date.split('T')[0] ?? w.date;
    if (!byDate.has(dateKey)) byDate.set(dateKey, []);
    byDate.get(dateKey)!.push(w);
  }

  // Track which workout IDs get merged into sessions
  const mergedIds = new Set<string>();
  // Map from date key to synthetic sessions for that day
  const sessionsByDate = new Map<string, { position: number; workout: Workout }[]>();

  for (const [dateKey, dayWorkouts] of byDate) {
    // Sort ascending by time within the day for session detection
    const sorted = [...dayWorkouts].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const sessions: { position: number; workout: Workout }[] = [];
    let i = 0;

    while (i < sorted.length) {
      const current = sorted[i];
      if (!current) {
        i++;
        continue;
      }

      // Skip non-erg, no-distance, or already-interval workouts
      if (
        current.type !== 'erg' ||
        !current.distanceM ||
        (current.workoutType && /interval/i.test(current.workoutType))
      ) {
        i++;
        continue;
      }

      // Look ahead for consecutive same-distance, same-machine pieces
      const group = [current];
      let j = i + 1;

      while (j < sorted.length) {
        const next = sorted[j];
        if (!next) break;

        if (next.machineType !== current.machineType) break;
        if (next.distanceM !== current.distanceM) break;
        if (next.type !== 'erg') break;
        if (next.workoutType && /interval/i.test(next.workoutType)) break;

        // Check time gap between end of previous piece and start of next
        const prev = group[group.length - 1];
        if (!prev) break;
        const prevEnd = new Date(prev.date).getTime() + (prev.durationSeconds || 0) * 1000;
        const nextStart = new Date(next.date).getTime();
        const gapSeconds = (nextStart - prevEnd) / 1000;

        if (gapSeconds > MAX_SESSION_GAP || gapSeconds < -60) break;

        group.push(next);
        j++;
      }

      if (group.length >= 2) {
        const synthetic = createSessionWorkout(group as [Workout, ...Workout[]]);
        for (const g of group) mergedIds.add(g.id);
        // Position = index of first piece in the original day list
        const firstInGroup = group[0];
        if (firstInGroup) {
          const pos = dayWorkouts.indexOf(firstInGroup);
          sessions.push({ position: pos, workout: synthetic });
        }
        i = j;
      } else {
        i++;
      }
    }

    if (sessions.length > 0) {
      sessionsByDate.set(dateKey, sessions);
    }
  }

  // If no sessions detected, return unchanged
  if (mergedIds.size === 0) return workouts;

  // Rebuild the workouts array: remove merged pieces, insert sessions
  const result: Workout[] = [];
  for (const w of workouts) {
    if (mergedIds.has(w.id)) {
      // Check if this is the first piece of a session (insert session here)
      const dateKey = w.date.split('T')[0] ?? w.date;
      const sessions = sessionsByDate.get(dateKey);
      if (sessions) {
        const session = sessions.find((s) => s.workout.date === w.date);
        if (session) {
          result.push(session.workout);
          // Remove from map so we don't insert again
          const idx = sessions.indexOf(session);
          sessions.splice(idx, 1);
        }
      }
      // Otherwise skip (this piece was merged into a session)
    } else {
      result.push(w);
    }
  }

  return result;
}

function createSessionWorkout(pieces: [Workout, ...Workout[]]): Workout {
  const first = pieces[0];
  const totalDistance = pieces.reduce((s, w) => s + (w.distanceM || 0), 0);
  const totalDuration = pieces.reduce((s, w) => s + (w.durationSeconds || 0), 0);

  // Average pace and watts across pieces
  const paces = pieces.filter((w) => w.avgPace != null).map((w) => w.avgPace!);
  const avgPace =
    paces.length > 0 ? Math.round(paces.reduce((s, p) => s + p, 0) / paces.length) : null;

  const wattsList = pieces.filter((w) => w.avgWatts != null).map((w) => w.avgWatts!);
  const avgWatts =
    wattsList.length > 0
      ? Math.round(wattsList.reduce((s, w) => s + w, 0) / wattsList.length)
      : null;

  const srs = pieces.filter((w) => w.strokeRate != null).map((w) => w.strokeRate!);
  const avgSR = srs.length > 0 ? Math.round(srs.reduce((s, r) => s + r, 0) / srs.length) : null;

  // Create splits from individual pieces
  const splits: WorkoutSplit[] = pieces.map((w, idx) => ({
    splitNumber: idx + 1,
    distanceM: w.distanceM,
    timeSeconds: w.durationSeconds,
    pace: w.avgPace,
    watts: w.avgWatts,
    strokeRate: w.strokeRate,
    heartRate: w.avgHeartRate ?? null,
  }));

  // Infer rest between pieces from timestamps
  const rests: number[] = [];
  for (let k = 0; k < pieces.length - 1; k++) {
    const piece = pieces[k];
    const nextPiece = pieces[k + 1];
    if (!piece || !nextPiece) continue;
    const endTime = new Date(piece.date).getTime() + (piece.durationSeconds || 0) * 1000;
    const nextStart = new Date(nextPiece.date).getTime();
    rests.push(Math.max(0, Math.round((nextStart - endTime) / 1000)));
  }

  // Format rest as human-readable notes
  const avgRest =
    rests.length > 0 ? Math.round(rests.reduce((s, r) => s + r, 0) / rests.length) : 0;
  const restNote =
    rests.length > 0
      ? `Rest: ${rests.map((r) => formatIntervalTime(r)).join(' / ')} (avg ${formatIntervalTime(avgRest)})`
      : null;

  return {
    id: `session:${first.id}`,
    date: first.date,
    source: first.source,
    type: first.type,
    machineType: first.machineType,
    distanceM: totalDistance,
    durationSeconds: totalDuration,
    avgPace: avgPace,
    avgWatts: avgWatts,
    strokeRate: avgSR,
    avgHeartRate: null,
    teamId: first.teamId,
    notes: restNote,
    workoutType: 'FixedDistanceInterval',
    splits,
  };
}
