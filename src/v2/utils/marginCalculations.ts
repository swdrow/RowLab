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
export function calculateBoatLengths(
  distanceMeters: number,
  boatClass: string
): number {
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
