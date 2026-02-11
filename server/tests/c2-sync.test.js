/**
 * C2 Sync Pipeline Integration Tests
 *
 * Tests for Concept2 workout sync data transformation logic.
 * These tests verify pure functions that don't require database access.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import c2Fixtures from './fixtures/c2Workouts.json' assert { type: 'json' };

// Import sync service functions
// These may not exist yet - TDD style
let mapC2MachineType, extractSplits, convertC2Workout;

try {
  const syncService = await import('../services/c2SyncService.js');
  mapC2MachineType = syncService.mapC2MachineType;
  extractSplits = syncService.extractSplits;
  convertC2Workout = syncService.convertC2Workout;
} catch {
  // Functions not implemented yet - tests will fail RED (expected for TDD)
  mapC2MachineType = () => {
    throw new Error('Not implemented');
  };
  extractSplits = () => {
    throw new Error('Not implemented');
  };
  convertC2Workout = () => {
    throw new Error('Not implemented');
  };
}

describe('mapC2MachineType', () => {
  it('maps 0 to rower', () => {
    expect(mapC2MachineType(0)).toBe('rower');
  });

  it('maps 1 to skierg', () => {
    expect(mapC2MachineType(1)).toBe('skierg');
  });

  it('maps 2 to bikerg', () => {
    expect(mapC2MachineType(2)).toBe('bikerg');
  });

  it('defaults to rower for unknown types', () => {
    expect(mapC2MachineType(999)).toBe('rower');
    expect(mapC2MachineType(-1)).toBe('rower');
    expect(mapC2MachineType(null)).toBe('rower');
    expect(mapC2MachineType(undefined)).toBe('rower');
  });

  it('handles string type values', () => {
    expect(mapC2MachineType('rower')).toBe('rower');
    expect(mapC2MachineType('skierg')).toBe('skierg');
    expect(mapC2MachineType('bikerg')).toBe('bikerg');
    expect(mapC2MachineType('unknown')).toBe('rower');
  });
});

describe('extractSplits', () => {
  it('extracts splits from C2 result with intervals', () => {
    const result = c2Fixtures.results[0]; // 2k with 4 splits
    const splits = extractSplits(result);

    expect(splits).toHaveLength(4);
    expect(splits[0]).toMatchObject({
      splitNumber: 1,
      distance: 500,
      time: 1050,
      pace: 1050,
      watts: 285,
      strokeRate: 28,
      heartRate: 158,
      dragFactor: 120,
      calories: 46,
    });

    // Verify splits are numbered sequentially
    expect(splits.map((s) => s.splitNumber)).toEqual([1, 2, 3, 4]);
  });

  it('returns empty array when no intervals', () => {
    const resultWithoutIntervals = {
      id: 999,
      type: 0,
      date: '2024-01-01',
      distance: 1000,
      time: 2000,
    };

    const splits = extractSplits(resultWithoutIntervals);
    expect(splits).toEqual([]);
  });

  it('numbers splits sequentially starting at 1', () => {
    const result = c2Fixtures.results[1]; // 6k with 6 splits
    const splits = extractSplits(result);

    expect(splits).toHaveLength(6);
    expect(splits[0].splitNumber).toBe(1);
    expect(splits[5].splitNumber).toBe(6);
  });

  it('handles missing heart rate in splits', () => {
    const result = c2Fixtures.results[5]; // 10k workout without HR
    const splits = extractSplits(result);

    expect(splits).toHaveLength(10);
    splits.forEach((split) => {
      expect(split.heartRate).toBeNull();
    });
  });

  it('extracts all split data fields correctly', () => {
    const result = c2Fixtures.results[2]; // BikeErg 30min
    const splits = extractSplits(result);

    const firstSplit = splits[0];
    expect(firstSplit).toHaveProperty('splitNumber');
    expect(firstSplit).toHaveProperty('distance');
    expect(firstSplit).toHaveProperty('time');
    expect(firstSplit).toHaveProperty('pace');
    expect(firstSplit).toHaveProperty('watts');
    expect(firstSplit).toHaveProperty('strokeRate');
    expect(firstSplit).toHaveProperty('heartRate');
    expect(firstSplit).toHaveProperty('dragFactor');
    expect(firstSplit).toHaveProperty('calories');
  });
});

describe('convertC2Workout enhanced', () => {
  const mockAthleteId = 'athlete_123';

  it('includes machineType from result type', () => {
    const rowerResult = c2Fixtures.results[0]; // type: 0
    const skiergResult = c2Fixtures.results[3]; // type: 1
    const bikeergResult = c2Fixtures.results[2]; // type: 2

    const rowerWorkout = convertC2Workout(rowerResult, mockAthleteId);
    expect(rowerWorkout.machineType).toBe('rower');

    const skiergWorkout = convertC2Workout(skiergResult, mockAthleteId);
    expect(skiergWorkout.machineType).toBe('skierg');

    const bikeergWorkout = convertC2Workout(bikeergResult, mockAthleteId);
    expect(bikeergWorkout.machineType).toBe('bikerg');
  });

  it('includes avgPace from stroke_data', () => {
    const result = c2Fixtures.results[0]; // Has stroke_data with avg_pace
    const workout = convertC2Workout(result, mockAthleteId);

    expect(workout.avgPace).toBe(1050); // From stroke_data.avg_pace
  });

  it('includes avgWatts from stroke_data', () => {
    const result = c2Fixtures.results[0]; // Has stroke_data with avg_watts
    const workout = convertC2Workout(result, mockAthleteId);

    expect(workout.avgWatts).toBe(285); // From stroke_data.avg_watts
  });

  it('includes avgHeartRate from heart_rate', () => {
    const result = c2Fixtures.results[0]; // Has heart_rate.average
    const workout = convertC2Workout(result, mockAthleteId);

    expect(workout.avgHeartRate).toBe(165); // From heart_rate.average
  });

  it('handles missing stroke_data gracefully', () => {
    const resultWithoutStrokeData = {
      id: 999,
      type: 0,
      date: '2024-01-01',
      distance: 1000,
      time: 2000,
      stroke_rate: 24,
      calories_total: 50,
      drag_factor: 120,
    };

    const workout = convertC2Workout(resultWithoutStrokeData, mockAthleteId);

    expect(workout.avgPace).toBeNull();
    expect(workout.avgWatts).toBeNull();
  });

  it('handles missing heart_rate gracefully', () => {
    const result = c2Fixtures.results[5]; // No heart rate data
    const workout = convertC2Workout(result, mockAthleteId);

    expect(workout.avgHeartRate).toBeNull();
  });

  it('includes all expected workout fields', () => {
    const result = c2Fixtures.results[0];
    const workout = convertC2Workout(result, mockAthleteId);

    expect(workout).toHaveProperty('athleteId', mockAthleteId);
    expect(workout).toHaveProperty('source', 'concept2');
    expect(workout).toHaveProperty('c2LogbookId', String(result.id));
    expect(workout).toHaveProperty('date');
    expect(workout).toHaveProperty('distanceM', result.distance);
    expect(workout).toHaveProperty('durationSeconds');
    expect(workout).toHaveProperty('strokeRate', result.stroke_rate);
    expect(workout).toHaveProperty('calories', result.calories_total);
    expect(workout).toHaveProperty('dragFactor', result.drag_factor);
    expect(workout).toHaveProperty('machineType');
    expect(workout).toHaveProperty('avgPace');
    expect(workout).toHaveProperty('avgWatts');
    expect(workout).toHaveProperty('avgHeartRate');
  });

  it('converts C2 time from tenths to seconds', () => {
    const result = c2Fixtures.results[0]; // time: 4200 tenths = 420 seconds
    const workout = convertC2Workout(result, mockAthleteId);

    expect(workout.durationSeconds).toBe(420); // 7:00.0
  });

  it('preserves rawData for future reference', () => {
    const result = c2Fixtures.results[0];
    const workout = convertC2Workout(result, mockAthleteId);

    expect(workout.rawData).toEqual(result);
  });
});

describe('deduplication logic', () => {
  it('identifies workouts by c2LogbookId', () => {
    const result = c2Fixtures.results[0];
    const workout = convertC2Workout(result, 'athlete_123');

    // c2LogbookId should be the string version of the C2 result ID
    expect(workout.c2LogbookId).toBe(String(result.id));
    expect(workout.c2LogbookId).toBe('100001');
  });

  it('all fixture workouts have unique c2LogbookIds', () => {
    const logbookIds = c2Fixtures.results.map((r) => String(r.id));
    const uniqueIds = new Set(logbookIds);

    // No duplicates in fixture data
    expect(logbookIds.length).toBe(uniqueIds.size);
  });

  it('c2LogbookId is always a string', () => {
    // Even if C2 API returns integer IDs, we store as strings
    const workout1 = convertC2Workout(
      { id: 123, type: 0, distance: 1000, time: 2000 },
      'athlete_123'
    );
    const workout2 = convertC2Workout(
      { id: '456', type: 0, distance: 1000, time: 2000 },
      'athlete_123'
    );

    expect(typeof workout1.c2LogbookId).toBe('string');
    expect(typeof workout2.c2LogbookId).toBe('string');
  });
});

describe('C2 API fixture data validation', () => {
  it('has expected number of results', () => {
    expect(c2Fixtures.results).toHaveLength(8);
  });

  it('includes multiple machine types', () => {
    const types = c2Fixtures.results.map((r) => r.type);
    expect(types).toContain(0); // rower
    expect(types).toContain(1); // skierg
    expect(types).toContain(2); // bikerg
  });

  it('includes workouts with splits', () => {
    const withSplits = c2Fixtures.results.filter((r) => r.intervals && r.intervals.length > 0);
    expect(withSplits.length).toBeGreaterThan(0);
  });

  it('includes workout without heart rate', () => {
    const withoutHR = c2Fixtures.results.filter((r) => r.heart_rate === null);
    expect(withoutHR.length).toBeGreaterThan(0);
  });

  it('includes various standard test distances', () => {
    const distances = c2Fixtures.results.map((r) => r.distance);
    expect(distances).toContain(500); // Sprint
    expect(distances).toContain(2000); // 2k test
    expect(distances).toContain(5000); // 5k
    expect(distances).toContain(6000); // 6k
  });
});
