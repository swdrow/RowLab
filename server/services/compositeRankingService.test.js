import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  calculateCompositeRankings,
  normalizeScores,
  getWeightProfile,
  DEFAULT_WEIGHT_PROFILES,
} from './compositeRankingService.js';

// Mock database connection - must be inline factory to avoid hoisting issues
vi.mock('../db/connection.js', () => ({
  default: {
    athlete: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    ergScore: {
      findMany: vi.fn(),
    },
    attendanceRecord: {
      findMany: vi.fn(),
    },
    team: {
      findUnique: vi.fn(),
    },
  },
}));

// Mock eloRatingService
vi.mock('./eloRatingService.js', () => ({
  getTeamRankings: vi.fn(),
}));

describe('compositeRankingService', () => {
  let mockPrisma;
  let getTeamRankings;

  beforeEach(async () => {
    // Reset all mocks
    vi.clearAllMocks();

    // Get the mocked modules
    const prismaModule = await import('../db/connection.js');
    mockPrisma = prismaModule.default;

    const eloModule = await import('./eloRatingService.js');
    getTeamRankings = eloModule.getTeamRankings;

    // Setup default return values
    getTeamRankings.mockResolvedValue([]);
  });

  describe('Edge Cases', () => {
    it('should return empty rankings when no athletes have any data', async () => {
      const teamId = 'team-1';

      // Mock: No athletes with data
      mockPrisma.athlete.findMany.mockResolvedValue([
        { id: 'athlete-1', firstName: 'John', lastName: 'Doe', side: 'Port' },
      ]);
      mockPrisma.ergScore.findMany.mockResolvedValue([]);
      mockPrisma.attendanceRecord.findMany.mockResolvedValue([]);
      getTeamRankings.mockResolvedValue([]);

      const result = await calculateCompositeRankings(teamId);

      expect(result.rankings).toEqual([]);
      expect(result.message).toContain('No ranking data available');
      expect(result.teamId).toBe(teamId);
      expect(result.profile).toBeDefined();
    });

    it('should handle single athlete without crashing', async () => {
      const teamId = 'team-1';

      // Mock: One athlete with data
      mockPrisma.athlete.findMany.mockResolvedValue([
        { id: 'athlete-1', firstName: 'John', lastName: 'Doe', side: 'Port' },
      ]);
      mockPrisma.ergScore.findMany.mockResolvedValue([
        {
          athlete: { id: 'athlete-1' },
          testType: '2k',
          time: 420, // 7:00
          date: new Date(),
        },
      ]);
      mockPrisma.attendanceRecord.findMany.mockResolvedValue([]);
      getTeamRankings.mockResolvedValue([
        {
          athleteId: 'athlete-1',
          ratingValue: 1500,
          racesCount: 5,
        },
      ]);

      const result = await calculateCompositeRankings(teamId);

      expect(result.rankings).toHaveLength(1);
      expect(result.rankings[0].rank).toBe(1);
      expect(result.rankings[0].athleteId).toBe('athlete-1');
      expect(result.rankings[0].note).toContain('Single athlete');
      expect(result.message).toContain('Single athlete');
    });

    it('should handle two athletes with complete data (normal z-score normalization)', async () => {
      const teamId = 'team-1';

      // Mock: Two athletes with data
      mockPrisma.athlete.findMany.mockResolvedValue([
        { id: 'athlete-1', firstName: 'John', lastName: 'Doe', side: 'Port' },
        { id: 'athlete-2', firstName: 'Jane', lastName: 'Smith', side: 'Starboard' },
      ]);
      mockPrisma.ergScore.findMany.mockResolvedValue([
        {
          athlete: { id: 'athlete-1' },
          testType: '2k',
          time: 420, // 7:00 (faster)
          date: new Date(),
        },
        {
          athlete: { id: 'athlete-2' },
          testType: '2k',
          time: 450, // 7:30 (slower)
          date: new Date(),
        },
      ]);
      mockPrisma.attendanceRecord.findMany.mockResolvedValue([
        {
          athlete: { id: 'athlete-1' },
          status: 'present',
          date: new Date(),
        },
        {
          athlete: { id: 'athlete-2' },
          status: 'present',
          date: new Date(),
        },
      ]);
      getTeamRankings.mockResolvedValue([
        { athleteId: 'athlete-1', ratingValue: 1600, racesCount: 10 },
        { athleteId: 'athlete-2', ratingValue: 1400, racesCount: 8 },
      ]);

      const result = await calculateCompositeRankings(teamId);

      expect(result.rankings).toHaveLength(2);
      expect(result.rankings[0].rank).toBe(1);
      expect(result.rankings[1].rank).toBe(2);
      // athlete-1 should rank higher (better erg, better ELO)
      expect(result.rankings[0].athleteId).toBe('athlete-1');
    });

    it('should handle sparse data (athletes with partial components)', async () => {
      const teamId = 'team-1';

      // Mock: Two athletes, one with erg only, one with ELO only
      mockPrisma.athlete.findMany.mockResolvedValue([
        { id: 'athlete-1', firstName: 'John', lastName: 'Doe', side: 'Port' },
        { id: 'athlete-2', firstName: 'Jane', lastName: 'Smith', side: 'Starboard' },
      ]);
      mockPrisma.ergScore.findMany.mockResolvedValue([
        {
          athlete: { id: 'athlete-1' },
          testType: '2k',
          time: 420,
          date: new Date(),
        },
      ]);
      mockPrisma.attendanceRecord.findMany.mockResolvedValue([]);
      getTeamRankings.mockResolvedValue([
        { athleteId: 'athlete-2', ratingValue: 1500, racesCount: 5 },
      ]);

      const result = await calculateCompositeRankings(teamId);

      expect(result.rankings).toHaveLength(2);
      // Both athletes should have rankings with partial data
      expect(result.rankings[0].breakdown).toBeDefined();
      expect(result.rankings[1].breakdown).toBeDefined();
    });

    it('should handle all athletes missing one component', async () => {
      const teamId = 'team-1';

      // Mock: Two athletes with erg + ELO, but no attendance
      mockPrisma.athlete.findMany.mockResolvedValue([
        { id: 'athlete-1', firstName: 'John', lastName: 'Doe', side: 'Port' },
        { id: 'athlete-2', firstName: 'Jane', lastName: 'Smith', side: 'Starboard' },
      ]);
      mockPrisma.ergScore.findMany.mockResolvedValue([
        {
          athlete: { id: 'athlete-1' },
          testType: '2k',
          time: 420,
          date: new Date(),
        },
        {
          athlete: { id: 'athlete-2' },
          testType: '2k',
          time: 450,
          date: new Date(),
        },
      ]);
      mockPrisma.attendanceRecord.findMany.mockResolvedValue([]); // No attendance
      getTeamRankings.mockResolvedValue([
        { athleteId: 'athlete-1', ratingValue: 1600, racesCount: 10 },
        { athleteId: 'athlete-2', ratingValue: 1400, racesCount: 8 },
      ]);

      const result = await calculateCompositeRankings(teamId);

      expect(result.rankings).toHaveLength(2);
      // Remaining components should still rank correctly
      const attendanceContribution = result.rankings[0].breakdown.find(
        (c) => c.source === 'attendance'
      )?.contribution;
      expect(attendanceContribution).toBe(0); // No attendance data
    });
  });

  describe('Regression Tests', () => {
    it('should correctly coerce Prisma Decimal values to Number', async () => {
      const teamId = 'team-1';

      // Mock: Prisma Decimal object (has toNumber method)
      const decimalMock = {
        toNumber: () => 1500,
        toString: () => '1500',
      };

      mockPrisma.athlete.findMany.mockResolvedValue([
        { id: 'athlete-1', firstName: 'John', lastName: 'Doe', side: 'Port' },
      ]);
      mockPrisma.ergScore.findMany.mockResolvedValue([]);
      mockPrisma.attendanceRecord.findMany.mockResolvedValue([]);
      getTeamRankings.mockResolvedValue([
        {
          athleteId: 'athlete-1',
          ratingValue: decimalMock, // Prisma Decimal
          racesCount: 5,
        },
      ]);

      // Should not crash
      const result = await calculateCompositeRankings(teamId);

      expect(result.rankings).toHaveLength(1);
      // Verify the value was correctly coerced
      const onWaterBreakdown = result.rankings[0].breakdown.find((c) => c.source === 'onWater');
      expect(typeof onWaterBreakdown.rawScore).toBe('number');
    });

    it('should handle single-value standardDeviation without crash', async () => {
      const teamId = 'team-1';

      // This is implicitly tested by the single athlete test
      // But we test normalizeScores directly for clarity
      const dataMap = new Map([['athlete-1', { value: 100, dataPoints: 1 }]]);

      const result = normalizeScores(dataMap, 'asc');

      expect(result.size).toBe(1);
      const normalized = result.get('athlete-1');
      expect(normalized.score).toBeDefined();
      expect(normalized.note).toContain('insufficient data');
      // Should not throw error
    });
  });

  describe('getWeightProfile', () => {
    it('should return the default profile when no profileId provided', () => {
      const profile = getWeightProfile();
      expect(profile.isDefault).toBe(true);
      expect(profile.id).toBe('balanced');
    });

    it('should return custom profile when profileId is "custom"', () => {
      const customWeights = { onWater: 0.5, erg: 0.3, attendance: 0.2 };
      const profile = getWeightProfile('custom', customWeights);
      expect(profile.id).toBe('custom');
      expect(profile.isCustom).toBe(true);
      expect(profile.weights).toEqual(customWeights);
    });

    it('should return matching profile by ID', () => {
      const profile = getWeightProfile('performance-first');
      expect(profile.id).toBe('performance-first');
      expect(profile.weights.onWater).toBe(0.85);
    });

    it('should fall back to default for unknown profileId', () => {
      const profile = getWeightProfile('unknown-profile');
      expect(profile.isDefault).toBe(true);
    });
  });

  describe('normalizeScores', () => {
    it('should return empty map for empty input', () => {
      const result = normalizeScores(new Map(), 'asc');
      expect(result.size).toBe(0);
    });

    it('should normalize scores with direction="asc" (higher is better)', () => {
      const dataMap = new Map([
        ['athlete-1', { value: 100, dataPoints: 5 }],
        ['athlete-2', { value: 200, dataPoints: 5 }],
      ]);

      const result = normalizeScores(dataMap, 'asc');

      expect(result.size).toBe(2);
      const score1 = result.get('athlete-1').score;
      const score2 = result.get('athlete-2').score;
      // athlete-2 should have higher normalized score (200 > 100)
      expect(score2).toBeGreaterThan(score1);
    });

    it('should normalize scores with direction="desc" (lower is better)', () => {
      const dataMap = new Map([
        ['athlete-1', { value: 100, dataPoints: 5 }],
        ['athlete-2', { value: 200, dataPoints: 5 }],
      ]);

      const result = normalizeScores(dataMap, 'desc');

      expect(result.size).toBe(2);
      const score1 = result.get('athlete-1').score;
      const score2 = result.get('athlete-2').score;
      // athlete-1 should have higher normalized score (100 < 200, lower is better)
      expect(score1).toBeGreaterThan(score2);
    });

    it('should calculate confidence based on data points', () => {
      const dataMap = new Map([
        ['athlete-1', { value: 100, dataPoints: 1 }], // Low confidence
        ['athlete-2', { value: 200, dataPoints: 10 }], // High confidence
      ]);

      const result = normalizeScores(dataMap, 'asc');

      const confidence1 = result.get('athlete-1').confidence;
      const confidence2 = result.get('athlete-2').confidence;
      expect(confidence2).toBeGreaterThan(confidence1);
      expect(confidence2).toBe(1); // Capped at 1 (10 / 5 = 2, min(1, 2) = 1)
    });
  });
});
