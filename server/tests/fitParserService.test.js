/**
 * FIT Parser Service Tests
 *
 * Tests for FIT file parsing, validation, and conversion.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Create hoisted mock for logger
const mockLogger = vi.hoisted(() => ({
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
}));

vi.mock('../utils/logger.js', () => ({
  default: mockLogger,
}));

// Import the module
const { validateFitFile, toRowLabWorkout } = await import('../services/fitParserService.js');

describe('FitParserService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('validateFitFile', () => {
    it('should validate a properly formatted FIT file header', () => {
      // Create a buffer with valid FIT file header
      // Header size: 12, then some padding, then '.FIT' signature at bytes 8-11
      const validHeader = Buffer.alloc(100);
      validHeader[0] = 12; // Header size
      validHeader.write('.FIT', 8, 'ascii'); // Signature

      const result = validateFitFile(validHeader);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should validate FIT file with 14-byte header', () => {
      const validHeader = Buffer.alloc(100);
      validHeader[0] = 14; // Header size 14 is also valid
      validHeader.write('.FIT', 8, 'ascii');

      const result = validateFitFile(validHeader);

      expect(result.valid).toBe(true);
    });

    it('should reject file that is too small', () => {
      const tooSmall = Buffer.alloc(8); // Less than 12 bytes

      const result = validateFitFile(tooSmall);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('too small');
    });

    it('should reject file with invalid header size', () => {
      const invalidHeader = Buffer.alloc(100);
      invalidHeader[0] = 10; // Invalid header size (not 12 or 14)
      invalidHeader.write('.FIT', 8, 'ascii');

      const result = validateFitFile(invalidHeader);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid FIT file header');
    });

    it('should reject file without .FIT signature', () => {
      const noSignature = Buffer.alloc(100);
      noSignature[0] = 12;
      noSignature.write('NOTF', 8, 'ascii'); // Wrong signature

      const result = validateFitFile(noSignature);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid FIT file signature');
    });

    it('should reject empty buffer', () => {
      const empty = Buffer.alloc(0);

      const result = validateFitFile(empty);

      expect(result.valid).toBe(false);
    });
  });

  describe('toRowLabWorkout', () => {
    it('should convert parsed FIT data to RowLab workout format', () => {
      const parsedData = {
        type: 'row',
        date: '2024-01-15T10:00:00Z',
        duration: 1800, // 30 minutes
        distance: 6000, // 6km
        calories: 250,
        avgHeartRate: 145,
        maxHeartRate: 165,
        avgPower: 180,
        maxPower: 250,
        avgStrokeRate: 24,
        splitTime: 150.0, // 2:30/500m
        sport: 'rowing',
        subSport: 'indoor_rowing',
        totalAscent: null,
        totalDescent: null,
        laps: [],
      };

      const result = toRowLabWorkout(parsedData, 'user123', 'team456', 'athlete789');

      expect(result.userId).toBe('user123');
      expect(result.teamId).toBe('team456');
      expect(result.athleteId).toBe('athlete789');
      expect(result.type).toBe('row');
      expect(result.date).toBeInstanceOf(Date);
      expect(result.duration).toBe(1800);
      expect(result.distance).toBe(6000);
      expect(result.calories).toBe(250);
      expect(result.avgHeartRate).toBe(145);
      expect(result.maxHeartRate).toBe(165);
      expect(result.avgPower).toBe(180);
      expect(result.maxPower).toBe(250);
      expect(result.avgStrokeRate).toBe(24);
      expect(result.splitTime).toBe(150.0);
      expect(result.source).toBe('garmin_fit');
      expect(result.notes).toContain('Imported from Garmin .FIT file');
      expect(result.metadata.sport).toBe('rowing');
    });

    it('should handle null athlete ID', () => {
      const parsedData = {
        type: 'erg',
        date: new Date(),
        duration: 600,
        distance: 2000,
        sport: 'indoor_rowing',
      };

      const result = toRowLabWorkout(parsedData, 'user123', 'team456');

      expect(result.athleteId).toBeNull();
    });

    it('should round duration and distance to integers', () => {
      const parsedData = {
        type: 'row',
        date: new Date(),
        duration: 1800.7,
        distance: 6000.3,
        sport: 'rowing',
      };

      const result = toRowLabWorkout(parsedData, 'user123', 'team456');

      expect(result.duration).toBe(1801);
      expect(result.distance).toBe(6000);
    });

    it('should handle missing optional fields gracefully', () => {
      const parsedData = {
        type: 'cross_train',
        date: new Date(),
        duration: 3600,
        distance: 0,
        // All other fields missing
      };

      const result = toRowLabWorkout(parsedData, 'user123', 'team456');

      expect(result.calories).toBeNull();
      expect(result.avgHeartRate).toBeNull();
      expect(result.maxHeartRate).toBeNull();
      expect(result.avgPower).toBeNull();
      expect(result.maxPower).toBeNull();
      expect(result.avgStrokeRate).toBeNull();
      expect(result.splitTime).toBeNull();
    });

    it('should use avgCadence as fallback for avgStrokeRate', () => {
      const parsedData = {
        type: 'bike',
        date: new Date(),
        duration: 3600,
        distance: 25000,
        avgCadence: 90, // Cadence instead of stroke rate
        sport: 'cycling',
      };

      const result = toRowLabWorkout(parsedData, 'user123', 'team456');

      expect(result.avgStrokeRate).toBe(90);
    });

    it('should include lap count in metadata', () => {
      const parsedData = {
        type: 'row',
        date: new Date(),
        duration: 1800,
        distance: 6000,
        sport: 'rowing',
        laps: [
          { duration: 600, distance: 2000 },
          { duration: 600, distance: 2000 },
          { duration: 600, distance: 2000 },
        ],
      };

      const result = toRowLabWorkout(parsedData, 'user123', 'team456');

      expect(result.metadata.lapCount).toBe(3);
    });

    it('should round splitTime to one decimal place', () => {
      const parsedData = {
        type: 'row',
        date: new Date(),
        duration: 1800,
        distance: 6000,
        splitTime: 149.99999,
        sport: 'rowing',
      };

      const result = toRowLabWorkout(parsedData, 'user123', 'team456');

      expect(result.splitTime).toBe(150.0);
    });
  });
});
