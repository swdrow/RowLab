import { describe, it, expect } from 'vitest';

// Test helpers for the calculation functions
// These are extracted from ErgTestForm.tsx for testing

function wattsToSplit(watts: number): number {
  // pace = (2.80 / watts)^(1/3) seconds per meter
  // split per 500m = pace * 500
  const pacePerMeter = Math.pow(2.80 / watts, 1/3);
  return pacePerMeter * 500;
}

function splitToWatts(splitSeconds: number): number {
  // Convert split per 500m to pace per meter
  const pacePerMeter = splitSeconds / 500;
  return 2.80 / Math.pow(pacePerMeter, 3);
}

function timeToSplit(timeSeconds: number, distanceM: number): number {
  if (distanceM <= 0) return 0;
  return (timeSeconds / distanceM) * 500;
}

function parseTimeInput(value: string): number {
  // If already a number, return it
  if (!isNaN(Number(value))) {
    return Number(value);
  }

  // Parse MM:SS.s format
  const parts = value.split(':');
  if (parts.length === 2) {
    const minutes = parseInt(parts[0], 10);
    const seconds = parseFloat(parts[1]);
    return minutes * 60 + seconds;
  }

  return parseFloat(value) || 0;
}

function formatTimeDisplay(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(1);
  return `${minutes}:${secs.padStart(4, '0')}`;
}

function getTodayDate(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

describe('ErgTestForm Calculations', () => {
  describe('parseTimeInput', () => {
    it('should parse MM:SS.s format', () => {
      expect(parseTimeInput('6:30.0')).toBe(390);
      expect(parseTimeInput('1:45.5')).toBe(105.5);
      expect(parseTimeInput('0:50.0')).toBe(50);
    });

    it('should handle plain seconds', () => {
      expect(parseTimeInput('390')).toBe(390);
      expect(parseTimeInput('105.5')).toBe(105.5);
    });

    it('should handle invalid input', () => {
      expect(parseTimeInput('')).toBe(0);
      expect(parseTimeInput('invalid')).toBe(0);
    });
  });

  describe('formatTimeDisplay', () => {
    it('should format seconds to MM:SS.s', () => {
      expect(formatTimeDisplay(390)).toBe('6:30.0');
      expect(formatTimeDisplay(105.5)).toBe('1:45.5');
      expect(formatTimeDisplay(50)).toBe('0:50.0');
    });
  });

  describe('wattsToSplit', () => {
    it('should calculate split from watts', () => {
      const split = wattsToSplit(250);
      expect(split).toBeGreaterThan(0);
      expect(split).toBeCloseTo(111.87, 1); // ~1:51.9 split
    });

    it('should handle high watts (fast split)', () => {
      const split = wattsToSplit(400);
      expect(split).toBeGreaterThan(0);
      expect(split).toBeLessThan(100); // < 1:40 split
    });
  });

  describe('splitToWatts', () => {
    it('should calculate watts from split', () => {
      const watts = splitToWatts(105.5); // 1:45.5 split
      expect(watts).toBeGreaterThan(0);
      expect(watts).toBeCloseTo(298.06, 1);
    });

    it('should be inverse of wattsToSplit', () => {
      const originalWatts = 250;
      const split = wattsToSplit(originalWatts);
      const calculatedWatts = splitToWatts(split);
      expect(calculatedWatts).toBeCloseTo(originalWatts, 1);
    });
  });

  describe('timeToSplit', () => {
    it('should calculate split/500m from time and distance', () => {
      // 2K in 6:30 = 390 seconds
      // Split should be (390 / 2000) * 500 = 97.5 seconds = 1:37.5
      const split = timeToSplit(390, 2000);
      expect(split).toBe(97.5);
      expect(formatTimeDisplay(split)).toBe('1:37.5');
    });

    it('should handle 6K test', () => {
      // 6K in 20:00 = 1200 seconds
      // Split should be (1200 / 6000) * 500 = 100 seconds = 1:40.0
      const split = timeToSplit(1200, 6000);
      expect(split).toBe(100);
      expect(formatTimeDisplay(split)).toBe('1:40.0');
    });

    it('should handle 500m test', () => {
      // 500m in 1:30 = 90 seconds
      // Split should be (90 / 500) * 500 = 90 seconds
      const split = timeToSplit(90, 500);
      expect(split).toBe(90);
    });

    it('should return 0 for invalid distance', () => {
      expect(timeToSplit(100, 0)).toBe(0);
      expect(timeToSplit(100, -500)).toBe(0);
    });
  });

  describe('getTodayDate', () => {
    it('should return date in YYYY-MM-DD format', () => {
      const date = getTodayDate();
      expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it("should return today's date", () => {
      const today = new Date();
      const expectedYear = today.getFullYear();
      const date = getTodayDate();
      expect(date).toContain(String(expectedYear));
    });
  });

  describe('Full workflow: time → split → watts', () => {
    it('should auto-calculate split and watts from 2K time', () => {
      // User enters 2K time of 6:30 (390 seconds)
      const time = parseTimeInput('6:30.0');
      expect(time).toBe(390);

      // Calculate split/500m
      const split = timeToSplit(time, 2000);
      expect(split).toBe(97.5); // 1:37.5

      // Calculate watts from split
      const watts = splitToWatts(split);
      expect(watts).toBeGreaterThan(0);
      expect(watts).toBeCloseTo(377.62, 1); // ~378 watts
    });

    it('should auto-calculate from split entered directly', () => {
      // User enters split of 1:45.0
      const split = parseTimeInput('1:45.0');
      expect(split).toBe(105);

      // Calculate watts
      const watts = splitToWatts(split);
      expect(watts).toBeGreaterThan(0);
      expect(watts).toBeCloseTo(302.34, 1); // ~302 watts
    });

    it('should auto-calculate from watts entered directly', () => {
      // User enters 250 watts
      const watts = 250;

      // Calculate split
      const split = wattsToSplit(watts);
      expect(formatTimeDisplay(split)).toBe('1:51.9'); // ~1:51.9 split
    });
  });
});
