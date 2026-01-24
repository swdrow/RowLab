/**
 * Biometrics calculation utilities for lineup builder
 *
 * Calculates average weight, height, and erg test times for athletes
 * in lineups, supporting per-boat and total statistics.
 */

import type { Athlete } from '@v2/types/athletes';
import type { BoatInstance } from '@v2/types/lineup';

/**
 * Biometrics statistics for a group of athletes
 */
export interface BiometricsStats {
  athleteCount: number;
  avgWeight: number | null;
  minWeight: number | null;
  maxWeight: number | null;
  avgHeight: number | null;
  minHeight: number | null;
  maxHeight: number | null;
  avg2k: number | null; // in seconds
  fastest2k: number | null;
  slowest2k: number | null;
}

/**
 * Extract all assigned athletes from a boat
 */
function getBoatAthletes(boat: BoatInstance, excludeCoxFromErg = true): { all: Athlete[]; rowers: Athlete[] } {
  const all: Athlete[] = [];
  const rowers: Athlete[] = [];

  // Collect rowers from seats
  for (const seat of boat.seats) {
    if (seat.athlete) {
      all.push(seat.athlete);
      rowers.push(seat.athlete);
    }
  }

  // Collect coxswain
  if (boat.coxswain) {
    all.push(boat.coxswain);
    // Don't add to rowers - coxswains don't erg
  }

  return { all, rowers };
}

/**
 * Parse 2k erg time from latestErgTest
 * Returns time in seconds, or null if no 2k test
 */
function parse2kTime(athlete: Athlete): number | null {
  const latestTest = (athlete as any).latestErgTest;
  if (!latestTest || latestTest.testType !== '2k') {
    return null;
  }

  // Parse MM:SS.s format to seconds
  const time = latestTest.time;
  if (!time) return null;

  // Handle MM:SS.s format (e.g., "6:32.5")
  const match = time.match(/^(\d+):(\d+)\.?(\d)?$/);
  if (!match) return null;

  const minutes = parseInt(match[1], 10);
  const seconds = parseInt(match[2], 10);
  const tenths = match[3] ? parseInt(match[3], 10) : 0;

  return minutes * 60 + seconds + tenths / 10;
}

/**
 * Calculate average biometrics for a single boat
 *
 * @param boat - Boat instance with seats and athletes
 * @returns Statistics including averages and ranges, or null if no athletes
 */
export function calculateBoatBiometrics(boat: BoatInstance): BiometricsStats | null {
  const { all, rowers } = getBoatAthletes(boat);

  if (all.length === 0) {
    return null;
  }

  // Weight stats (all athletes including cox)
  const weights = all
    .map((a) => a.weightKg)
    .filter((w): w is number => w !== null && w !== undefined);

  const avgWeight = weights.length > 0
    ? weights.reduce((sum, w) => sum + w, 0) / weights.length
    : null;

  const minWeight = weights.length > 0 ? Math.min(...weights) : null;
  const maxWeight = weights.length > 0 ? Math.max(...weights) : null;

  // Height stats (all athletes including cox)
  const heights = all
    .map((a) => a.heightCm)
    .filter((h): h is number => h !== null && h !== undefined);

  const avgHeight = heights.length > 0
    ? heights.reduce((sum, h) => sum + h, 0) / heights.length
    : null;

  const minHeight = heights.length > 0 ? Math.min(...heights) : null;
  const maxHeight = heights.length > 0 ? Math.max(...heights) : null;

  // 2k stats (only rowers, exclude coxswain)
  const erg2kTimes = rowers
    .map((a) => parse2kTime(a))
    .filter((t): t is number => t !== null);

  const avg2k = erg2kTimes.length > 0
    ? erg2kTimes.reduce((sum, t) => sum + t, 0) / erg2kTimes.length
    : null;

  const fastest2k = erg2kTimes.length > 0 ? Math.min(...erg2kTimes) : null;
  const slowest2k = erg2kTimes.length > 0 ? Math.max(...erg2kTimes) : null;

  return {
    athleteCount: all.length,
    avgWeight,
    minWeight,
    maxWeight,
    avgHeight,
    minHeight,
    maxHeight,
    avg2k,
    fastest2k,
    slowest2k,
  };
}

/**
 * Calculate total biometrics across all boats
 *
 * @param boats - Array of boat instances
 * @returns Aggregated statistics, or null if no athletes
 */
export function calculateTotalBiometrics(boats: BoatInstance[]): BiometricsStats | null {
  const allAthletes: Athlete[] = [];
  const allRowers: Athlete[] = [];
  const seenIds = new Set<string>(); // Deduplicate

  for (const boat of boats) {
    const { all, rowers } = getBoatAthletes(boat);

    for (const athlete of all) {
      if (!seenIds.has(athlete.id)) {
        seenIds.add(athlete.id);
        allAthletes.push(athlete);
      }
    }

    for (const rower of rowers) {
      if (!seenIds.has(`rower-${rower.id}`)) {
        seenIds.add(`rower-${rower.id}`);
        allRowers.push(rower);
      }
    }
  }

  if (allAthletes.length === 0) {
    return null;
  }

  // Weight stats
  const weights = allAthletes
    .map((a) => a.weightKg)
    .filter((w): w is number => w !== null && w !== undefined);

  const avgWeight = weights.length > 0
    ? weights.reduce((sum, w) => sum + w, 0) / weights.length
    : null;

  const minWeight = weights.length > 0 ? Math.min(...weights) : null;
  const maxWeight = weights.length > 0 ? Math.max(...weights) : null;

  // Height stats
  const heights = allAthletes
    .map((a) => a.heightCm)
    .filter((h): h is number => h !== null && h !== undefined);

  const avgHeight = heights.length > 0
    ? heights.reduce((sum, h) => sum + h, 0) / heights.length
    : null;

  const minHeight = heights.length > 0 ? Math.min(...heights) : null;
  const maxHeight = heights.length > 0 ? Math.max(...heights) : null;

  // 2k stats (only rowers)
  const erg2kTimes = allRowers
    .map((a) => parse2kTime(a))
    .filter((t): t is number => t !== null);

  const avg2k = erg2kTimes.length > 0
    ? erg2kTimes.reduce((sum, t) => sum + t, 0) / erg2kTimes.length
    : null;

  const fastest2k = erg2kTimes.length > 0 ? Math.min(...erg2kTimes) : null;
  const slowest2k = erg2kTimes.length > 0 ? Math.max(...erg2kTimes) : null;

  return {
    athleteCount: allAthletes.length,
    avgWeight,
    minWeight,
    maxWeight,
    avgHeight,
    minHeight,
    maxHeight,
    avg2k,
    fastest2k,
    slowest2k,
  };
}

/**
 * Format erg split time from seconds to MM:SS.s
 *
 * @param seconds - Time in seconds
 * @returns Formatted string like "6:32.5", or "--:--.-" if null
 */
export function formatSplit(seconds: number | null): string {
  if (seconds === null || seconds === undefined) {
    return '--:--.--';
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  const wholeSecs = Math.floor(remainingSeconds);
  const tenths = Math.floor((remainingSeconds - wholeSecs) * 10);

  return `${minutes}:${wholeSecs.toString().padStart(2, '0')}.${tenths}`;
}

/**
 * Format weight in kilograms
 *
 * @param kg - Weight in kilograms
 * @returns Formatted string like "75.5 kg", or "--" if null
 */
export function formatWeight(kg: number | null): string {
  if (kg === null || kg === undefined) {
    return '--';
  }

  return `${kg.toFixed(1)} kg`;
}

/**
 * Format height in centimeters
 *
 * @param cm - Height in centimeters
 * @returns Formatted string like "185 cm", or "--" if null
 */
export function formatHeight(cm: number | null): string {
  if (cm === null || cm === undefined) {
    return '--';
  }

  return `${Math.round(cm)} cm`;
}
