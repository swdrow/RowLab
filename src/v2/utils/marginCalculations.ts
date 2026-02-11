/**
 * Margin calculation utilities for boat comparison visualization
 *
 * Calculates margins between boats based on piece times,
 * converts to boat lengths, and formats for display.
 */

export interface MarginResult {
  distanceMeters: number;
  timeDelta: number;
  leader: 'A' | 'B';
  faster: string; // boat name
  slower: string; // boat name
}

/**
 * Shell lengths in meters by boat class
 */
const SHELL_LENGTHS: Record<string, number> = {
  '8+': 18.0,
  '4+': 13.2,
  '4-': 13.0,
  '2+': 10.0,
  '2-': 10.0,
  '2x': 10.0,
  '1x': 8.2,
};

/**
 * Calculate margin in meters between two boats
 *
 * @param timeA - Time for boat A in seconds
 * @param timeB - Time for boat B in seconds
 * @param winnerSpeed - Speed of the winning boat in m/s
 * @param boatNameA - Name of boat A
 * @param boatNameB - Name of boat B
 * @returns Margin result with distance, time delta, and leader
 */
export function calculateMarginMeters(
  timeA: number,
  timeB: number,
  winnerSpeed: number,
  boatNameA: string = 'Boat A',
  boatNameB: string = 'Boat B'
): MarginResult {
  const timeDelta = Math.abs(timeA - timeB);
  const distanceGap = timeDelta * winnerSpeed;

  const leader = timeA < timeB ? 'A' : 'B';
  const faster = leader === 'A' ? boatNameA : boatNameB;
  const slower = leader === 'A' ? boatNameB : boatNameA;

  return {
    distanceMeters: distanceGap,
    timeDelta,
    leader,
    faster,
    slower,
  };
}

/**
 * Calculate margin in boat lengths
 *
 * @param distanceMeters - Distance gap in meters
 * @param boatClass - Boat class (e.g., '8+', '4+', '2x', '1x')
 * @returns Number of boat lengths
 */
export function calculateBoatLengths(distanceMeters: number, boatClass: string): number {
  const shellLength = SHELL_LENGTHS[boatClass] || 10.0; // default 10m if unknown
  return distanceMeters / shellLength;
}

/**
 * Estimate boat speed from time and distance
 *
 * @param time - Time in seconds
 * @param distance - Distance in meters
 * @returns Speed in m/s
 */
export function estimateSpeed(time: number, distance: number): number {
  if (time <= 0) return 0;
  return distance / time;
}

/**
 * Format margin for human-readable display
 *
 * @param boatLengths - Margin in boat lengths
 * @returns Formatted margin string
 */
export function formatMargin(boatLengths: number): string {
  if (boatLengths < 0.1) {
    return 'Dead heat';
  } else if (boatLengths < 0.25) {
    return 'Canvas';
  } else if (boatLengths < 0.5) {
    return '1/4 length';
  } else if (boatLengths < 1.0) {
    return '1/2 length';
  } else {
    return `${boatLengths.toFixed(1)} lengths`;
  }
}

/**
 * Get shell image path for boat class
 *
 * @param boatClass - Boat class (e.g., '8+', '4+', '2x', '1x')
 * @returns Path to shell SVG
 */
export function getShellImage(boatClass: string): string {
  const normalized = boatClass.toLowerCase().replace(/[^a-z0-9+-]/g, '');

  // Map boat classes to SVG filenames
  const imageMap: Record<string, string> = {
    '8+': 'eight-plus.svg',
    '8': 'eight-plus.svg',
    '4+': 'four-plus.svg',
    '4-': 'four-plus.svg', // use same image
    '4': 'four-plus.svg',
    '2+': 'pair.svg',
    '2-': 'pair.svg',
    '2x': 'double.svg',
    '2': 'pair.svg',
    '1x': 'single.svg',
    '1': 'single.svg',
  };

  const filename = imageMap[boatClass] || imageMap[normalized] || 'eight-plus.svg';
  return `/images/shells/${filename}`;
}

/**
 * Get shell length in meters for boat class
 *
 * @param boatClass - Boat class
 * @returns Shell length in meters
 */
export function getShellLength(boatClass: string): number {
  return SHELL_LENGTHS[boatClass] || 10.0;
}

// ============================================
// Extended Margin Calculations for Regattas
// ============================================

import type { BoatClass, MarginInfo } from '../types/regatta';

// Boat lengths in feet (approximate, World Rowing specs)
const BOAT_LENGTHS_FEET: Record<string, number> = {
  '8+': 60,
  '4+': 42,
  '4-': 42,
  '4x': 42,
  '2+': 34,
  '2-': 27,
  '2x': 27,
  '1x': 26,
};

const FEET_TO_METERS = 0.3048;

/**
 * Calculate margin in seconds between two finish times
 */
export function calculateMarginSeconds(
  winnerTimeSeconds: number,
  loserTimeSeconds: number
): number {
  return Math.max(0, loserTimeSeconds - winnerTimeSeconds);
}

/**
 * Estimate winner's speed from race distance and time
 * @param distanceMeters - Race distance (typically 2000m)
 * @param timeSeconds - Winner's finish time
 * @returns Speed in meters per second
 */
export function calculateSpeed(distanceMeters: number, timeSeconds: number): number {
  if (timeSeconds <= 0) return 0;
  return distanceMeters / timeSeconds;
}

/**
 * Convert time margin to boat lengths
 * @param marginSeconds - Time gap in seconds
 * @param winnerSpeed - Winner's speed in m/s
 * @param boatClass - Boat class for length lookup
 */
export function secondsToBoatLengths(
  marginSeconds: number,
  winnerSpeed: number,
  boatClass: BoatClass | string
): number {
  if (winnerSpeed <= 0 || marginSeconds <= 0) return 0;

  // Distance covered in margin time
  const distanceMeters = winnerSpeed * marginSeconds;

  // Get boat length in meters
  const boatLengthFeet = BOAT_LENGTHS_FEET[boatClass] || BOAT_LENGTHS_FEET['8+'] || 60; // Default to 8+ (60 feet)
  const boatLengthMeters = boatLengthFeet * FEET_TO_METERS;

  return distanceMeters / boatLengthMeters;
}

/**
 * Convert boat lengths to time margin
 * @param lengths - Number of boat lengths
 * @param winnerSpeed - Winner's speed in m/s
 * @param boatClass - Boat class for length lookup
 */
export function boatLengthsToSeconds(
  lengths: number,
  winnerSpeed: number,
  boatClass: BoatClass | string
): number {
  if (winnerSpeed <= 0 || lengths <= 0) return 0;

  const boatLengthFeet = BOAT_LENGTHS_FEET[boatClass] || BOAT_LENGTHS_FEET['8+'] || 60; // Default to 8+ (60 feet)
  const boatLengthMeters = boatLengthFeet * FEET_TO_METERS;
  const distanceMeters = lengths * boatLengthMeters;

  return distanceMeters / winnerSpeed;
}

/**
 * Format margin using rowing terminology
 * Terminology: Canvas (< 1/4), lengths, open water (10+)
 */
export function formatMarginTerminology(
  marginSeconds: number,
  winnerSpeed: number,
  boatClass: BoatClass | string
): string {
  if (marginSeconds <= 0) return 'Dead heat';

  const lengths = secondsToBoatLengths(marginSeconds, winnerSpeed, boatClass);

  // Photo finish / canvas
  if (lengths < 0.25) return 'Canvas';
  if (lengths < 0.5) return '1/4 length';

  // Open water
  if (lengths >= 10) return 'Open water';

  // Format as fractions: "1 1/4 lengths", "2 1/2 lengths"
  const whole = Math.floor(lengths);
  const fraction = lengths - whole;

  let fractionStr = '';
  if (fraction >= 0.625) fractionStr = ' 3/4';
  else if (fraction >= 0.375) fractionStr = ' 1/2';
  else if (fraction >= 0.125) fractionStr = ' 1/4';

  if (whole === 0) {
    return `${fractionStr.trim()} length`;
  }
  if (fractionStr) {
    const totalApprox = whole + (fraction >= 0.5 ? 1 : 0);
    return `${whole}${fractionStr} length${totalApprox > 1 ? 's' : ''}`;
  }
  return `${whole} length${whole > 1 ? 's' : ''}`;
}

/**
 * Format margin as exact seconds
 */
export function formatMarginExact(marginSeconds: number): string {
  if (marginSeconds <= 0) return '0.00s';
  return `${marginSeconds.toFixed(2)}s`;
}

/**
 * Get complete margin info for display
 */
export function getMarginInfo(
  marginSeconds: number,
  distanceMeters: number,
  winnerTimeSeconds: number,
  boatClass: BoatClass | string
): MarginInfo {
  const speed = calculateSpeed(distanceMeters, winnerTimeSeconds);
  const boatLengths = secondsToBoatLengths(marginSeconds, speed, boatClass);
  const terminology = formatMarginTerminology(marginSeconds, speed, boatClass);

  return {
    seconds: marginSeconds,
    boatLengths,
    terminology,
  };
}

/**
 * Calculate margins for all results in a race
 * @param results - Array of results sorted by place
 * @param distanceMeters - Race distance
 * @param boatClass - Boat class
 */
export function calculateRaceMargins(
  results: Array<{ finishTimeSeconds: number | null; place: number | null }>,
  distanceMeters: number,
  boatClass: BoatClass | string
): Map<number, MarginInfo | null> {
  const margins = new Map<number, MarginInfo | null>();

  // Sort by place, filter out entries without times
  const sorted = [...results]
    .filter((r) => r.finishTimeSeconds !== null && r.place !== null)
    .sort((a, b) => (a.place || 0) - (b.place || 0));

  if (sorted.length === 0) return margins;

  const firstResult = sorted[0];
  if (!firstResult || firstResult.finishTimeSeconds === null) return margins;

  const winnerTime = firstResult.finishTimeSeconds;

  sorted.forEach((result, index) => {
    if (index === 0) {
      margins.set(result.place!, null); // Winner has no margin
    } else {
      const marginSecondsVal = (result.finishTimeSeconds || 0) - winnerTime;
      margins.set(
        result.place!,
        getMarginInfo(marginSecondsVal, distanceMeters, winnerTime, boatClass)
      );
    }
  });

  return margins;
}

/**
 * Get available boat classes
 */
export function getBoatClasses(): Array<{ value: string; label: string }> {
  return [
    { value: '8+', label: 'Eight (8+)' },
    { value: '4+', label: 'Coxed Four (4+)' },
    { value: '4-', label: 'Straight Four (4-)' },
    { value: '4x', label: 'Quad (4x)' },
    { value: '2+', label: 'Coxed Pair (2+)' },
    { value: '2-', label: 'Pair (2-)' },
    { value: '2x', label: 'Double (2x)' },
    { value: '1x', label: 'Single (1x)' },
  ];
}

/**
 * Get boat length in meters for a given boat class (feet-based calculation)
 */
export function getBoatLengthMeters(boatClass: BoatClass | string): number {
  const lengthFeet = BOAT_LENGTHS_FEET[boatClass] || BOAT_LENGTHS_FEET['8+'] || 60; // Default to 8+ (60 feet)
  return lengthFeet * FEET_TO_METERS;
}

/**
 * Parse a time string (MM:SS.s or HH:MM:SS.s) to seconds
 */
export function parseTimeToSeconds(timeString: string): number | null {
  if (!timeString) return null;

  // Handle numeric seconds directly
  const numericValue = parseFloat(timeString);
  if (!isNaN(numericValue) && !timeString.includes(':')) {
    return numericValue;
  }

  // Handle MM:SS.s or HH:MM:SS.s format
  const parts = timeString.split(':');
  if (parts.length === 2) {
    // MM:SS.s
    const minutesPart = parts[0];
    const secondsPart = parts[1];
    if (!minutesPart || !secondsPart) return null;
    const minutes = parseInt(minutesPart, 10);
    const seconds = parseFloat(secondsPart);
    if (!isNaN(minutes) && !isNaN(seconds)) {
      return minutes * 60 + seconds;
    }
  } else if (parts.length === 3) {
    // HH:MM:SS.s
    const hoursPart = parts[0];
    const minutesPart = parts[1];
    const secondsPart = parts[2];
    if (!hoursPart || !minutesPart || !secondsPart) return null;
    const hours = parseInt(hoursPart, 10);
    const minutes = parseInt(minutesPart, 10);
    const seconds = parseFloat(secondsPart);
    if (!isNaN(hours) && !isNaN(minutes) && !isNaN(seconds)) {
      return hours * 3600 + minutes * 60 + seconds;
    }
  }

  return null;
}

/**
 * Format seconds as MM:SS.s
 */
export function formatSecondsToTime(totalSeconds: number): string {
  if (totalSeconds <= 0) return '0:00.0';

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toFixed(1).padStart(4, '0')}`;
}
