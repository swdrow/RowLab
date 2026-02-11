import { subMinutes, differenceInMinutes, format } from 'date-fns';
import type { WarmupScheduleItem, Race } from '../types/regatta';

export type WarmupConfig = {
  warmupDuration: number; // minutes
  travelToStartTime: number; // minutes (launch -> starting line)
};

const DEFAULT_CONFIG: WarmupConfig = {
  warmupDuration: 45,
  travelToStartTime: 15,
};

/**
 * Calculate warmup schedule for a list of races
 */
export function calculateWarmupSchedule(
  races: Array<Pick<Race, 'id' | 'eventName' | 'scheduledTime' | 'boatClass'>>,
  config: Partial<WarmupConfig> = {}
): WarmupScheduleItem[] {
  const { warmupDuration, travelToStartTime } = { ...DEFAULT_CONFIG, ...config };
  const schedule: WarmupScheduleItem[] = [];

  races.forEach((race) => {
    if (!race.scheduledTime) return;

    const raceTime = new Date(race.scheduledTime);
    const totalLeadTime = warmupDuration + travelToStartTime;
    const launchTime = subMinutes(raceTime, totalLeadTime);
    const warmupStartTime = subMinutes(raceTime, warmupDuration);

    schedule.push({
      raceId: race.id,
      raceName: race.eventName,
      raceTime,
      warmupStartTime,
      launchTime,
      durationMinutes: warmupDuration,
    });
  });

  // Sort by launch time
  return schedule.sort((a, b) => a.launchTime.getTime() - b.launchTime.getTime());
}

/**
 * Update launch time with manual override
 */
export function updateLaunchTime(
  item: WarmupScheduleItem,
  newLaunchTime: Date
): WarmupScheduleItem {
  const minutesBeforeRace = differenceInMinutes(item.raceTime, newLaunchTime);

  let warning: string | undefined;
  if (minutesBeforeRace < 30) {
    warning = `Only ${minutesBeforeRace} minutes before race`;
  } else if (minutesBeforeRace > 120) {
    warning = `${minutesBeforeRace} minutes is unusually long`;
  }

  return {
    ...item,
    launchTime: newLaunchTime,
    warmupStartTime: newLaunchTime, // Start immediately after launch
    durationMinutes: minutesBeforeRace,
    warning,
    isOverride: true,
  };
}

/**
 * Detect schedule conflicts (same boat in multiple races too close together)
 */
export function detectWarmupConflicts(
  schedule: WarmupScheduleItem[],
  minimumGapMinutes: number = 30
): Array<{ race1: string; race2: string; gapMinutes: number }> {
  const conflicts: Array<{ race1: string; race2: string; gapMinutes: number }> = [];

  for (let i = 0; i < schedule.length - 1; i++) {
    const current = schedule[i];
    const next = schedule[i + 1];

    // Guard: ensure both items exist
    if (!current || !next) continue;

    // Check if next race launch conflicts with current race end
    const currentRaceEnd = current.raceTime;
    const nextLaunch = next.launchTime;
    const gapMinutes = differenceInMinutes(nextLaunch, currentRaceEnd);

    if (gapMinutes < minimumGapMinutes) {
      conflicts.push({
        race1: current.raceName,
        race2: next.raceName,
        gapMinutes,
      });
    }
  }

  return conflicts;
}

/**
 * Format launch time for display
 */
export function formatLaunchTime(date: Date): string {
  return format(date, 'HH:mm');
}

/**
 * Get time until launch
 */
export function getTimeUntilLaunch(launchTime: Date, now: Date = new Date()): string {
  const minutes = differenceInMinutes(launchTime, now);

  if (minutes < 0) return 'Launched';
  if (minutes === 0) return 'Now';
  if (minutes < 60) return `${minutes}m`;

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

/**
 * Get urgency level for warmup based on time until launch
 */
export function getWarmupUrgency(
  launchTime: Date,
  now: Date = new Date()
): 'critical' | 'warning' | 'normal' | 'upcoming' {
  const minutes = differenceInMinutes(launchTime, now);

  if (minutes < 0) return 'critical'; // Already should have launched
  if (minutes <= 10) return 'critical';
  if (minutes <= 30) return 'warning';
  if (minutes <= 60) return 'normal';
  return 'upcoming';
}

/**
 * Group warmup schedule by time blocks (for timeline view)
 */
export function groupWarmupsByTimeBlock(
  schedule: WarmupScheduleItem[],
  blockDurationMinutes: number = 30
): Map<string, WarmupScheduleItem[]> {
  const groups = new Map<string, WarmupScheduleItem[]>();

  schedule.forEach((item) => {
    // Round down to nearest block
    const blockStart = new Date(item.launchTime);
    const minutes = blockStart.getMinutes();
    const roundedMinutes = Math.floor(minutes / blockDurationMinutes) * blockDurationMinutes;
    blockStart.setMinutes(roundedMinutes, 0, 0);

    const blockKey = format(blockStart, 'HH:mm');

    if (!groups.has(blockKey)) {
      groups.set(blockKey, []);
    }
    groups.get(blockKey)!.push(item);
  });

  return groups;
}

/**
 * Calculate recovery time between races for the same crew
 */
export function calculateRecoveryTime(
  previousRaceTime: Date,
  nextLaunchTime: Date
): { minutes: number; adequate: boolean; recommendation: string } {
  const minutes = differenceInMinutes(nextLaunchTime, previousRaceTime);

  // Typical recovery needs ~90 minutes for sprint racing
  const adequate = minutes >= 90;
  let recommendation: string;

  if (minutes < 45) {
    recommendation = 'Very tight - consider abbreviated warmup';
  } else if (minutes < 90) {
    recommendation = 'Limited recovery - focus on essential warmup';
  } else if (minutes < 120) {
    recommendation = 'Normal recovery - standard warmup';
  } else {
    recommendation = 'Full recovery available - optional extended warmup';
  }

  return { minutes, adequate, recommendation };
}

/**
 * Get default warmup config
 */
export function getDefaultWarmupConfig(): WarmupConfig {
  return { ...DEFAULT_CONFIG };
}
