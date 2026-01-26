import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  findSwappedAthletes,
  detectSwapsFromSession,
  recordPassiveObservation,
  applyPendingObservations,
  DEFAULT_PASSIVE_WEIGHT,
  MIN_SPLIT_DIFFERENCE_SECONDS
} from '../passiveEloService.js';

// Mock prisma
vi.mock('../../db/connection.js', () => ({
  default: {
    session: {
      findUnique: vi.fn()
    },
    passiveObservation: {
      create: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      count: vi.fn()
    },
    piece: {
      findUnique: vi.fn()
    }
  }
}));

// Mock ELO service
vi.mock('../eloRatingService.js', () => ({
  updateRatingsFromSeatRace: vi.fn()
}));

describe('passiveEloService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('findSwappedAthletes', () => {
    it('finds single swapped athlete between lineups', () => {
      const lineup1 = ['a', 'b', 'c'];
      const lineup2 = ['a', 'b', 'd'];

      const result = findSwappedAthletes(lineup1, lineup2);

      expect(result).toHaveLength(2);
      expect(result).toContain('c');
      expect(result).toContain('d');
    });

    it('returns empty array when multiple athletes differ', () => {
      const lineup1 = ['a', 'b', 'c'];
      const lineup2 = ['a', 'd', 'e'];

      const result = findSwappedAthletes(lineup1, lineup2);

      expect(result).toHaveLength(0);
    });

    it('returns empty array when lineups are identical', () => {
      const lineup1 = ['a', 'b', 'c'];
      const lineup2 = ['a', 'b', 'c'];

      const result = findSwappedAthletes(lineup1, lineup2);

      expect(result).toHaveLength(0);
    });

    it('handles 2-person lineups (pairs)', () => {
      const lineup1 = ['a', 'b'];
      const lineup2 = ['a', 'c'];

      const result = findSwappedAthletes(lineup1, lineup2);

      expect(result).toEqual(['b', 'c']);
    });
  });

  describe('recordPassiveObservation', () => {
    it('records observation with default weight', async () => {
      const prisma = (await import('../../db/connection.js')).default;
      prisma.passiveObservation.create.mockResolvedValue({
        id: 'obs-1',
        teamId: 'team-1',
        swappedAthlete1Id: 'athlete-c',
        swappedAthlete2Id: 'athlete-d',
        splitDifferenceSeconds: 2.5,
        weight: DEFAULT_PASSIVE_WEIGHT
      });

      const result = await recordPassiveObservation({
        teamId: 'team-1',
        boat1Athletes: ['athlete-a', 'athlete-b', 'athlete-c'],
        boat2Athletes: ['athlete-a', 'athlete-b', 'athlete-d'],
        splitDifferenceSeconds: 2.5
      });

      expect(result).toBeDefined();
      expect(result.weight).toBe(DEFAULT_PASSIVE_WEIGHT);
      expect(prisma.passiveObservation.create).toHaveBeenCalledWith({
        data: {
          teamId: 'team-1',
          sessionId: null,
          pieceId: null,
          boat1Athletes: ['athlete-a', 'athlete-b', 'athlete-c'],
          boat2Athletes: ['athlete-a', 'athlete-b', 'athlete-d'],
          swappedAthlete1Id: 'athlete-c',
          swappedAthlete2Id: 'athlete-d',
          splitDifferenceSeconds: 2.5,
          weight: DEFAULT_PASSIVE_WEIGHT,
          source: 'manual',
          appliedToRatings: false
        }
      });
    });

    it('ignores split differences below minimum threshold', async () => {
      const result = await recordPassiveObservation({
        teamId: 'team-1',
        boat1Athletes: ['a', 'b', 'c'],
        boat2Athletes: ['a', 'b', 'd'],
        splitDifferenceSeconds: 0.1 // Below MIN_SPLIT_DIFFERENCE_SECONDS
      });

      expect(result).toBeNull();
    });

    it('throws error when swap cannot be determined', async () => {
      await expect(recordPassiveObservation({
        teamId: 'team-1',
        boat1Athletes: ['a', 'b', 'c'],
        boat2Athletes: ['d', 'e', 'f'], // More than 1 athlete differs
        splitDifferenceSeconds: 2.0
      })).rejects.toThrow('Cannot determine swapped athletes');
    });

    it('allows custom weight override', async () => {
      const prisma = (await import('../../db/connection.js')).default;
      prisma.passiveObservation.create.mockResolvedValue({
        id: 'obs-1',
        weight: 0.3
      });

      await recordPassiveObservation({
        teamId: 'team-1',
        boat1Athletes: ['a', 'b', 'c'],
        boat2Athletes: ['a', 'b', 'd'],
        splitDifferenceSeconds: 2.0,
        weight: 0.3
      });

      expect(prisma.passiveObservation.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            weight: 0.3
          })
        })
      );
    });
  });

  describe('applyPendingObservations', () => {
    it('processes pending observations and updates ELO', async () => {
      const prisma = (await import('../../db/connection.js')).default;
      const { updateRatingsFromSeatRace } = await import('../eloRatingService.js');

      prisma.passiveObservation.findMany.mockResolvedValue([
        {
          id: 'obs-1',
          swappedAthlete1Id: 'athlete-a',
          swappedAthlete2Id: 'athlete-b',
          splitDifferenceSeconds: 2.0, // Positive = athlete-a was faster
          weight: 0.5
        }
      ]);
      prisma.passiveObservation.update.mockResolvedValue({});

      const result = await applyPendingObservations('team-1');

      expect(result.processed).toBe(1);
      expect(result.skipped).toBe(0);
      expect(updateRatingsFromSeatRace).toHaveBeenCalledWith(
        'team-1',
        'athlete-a', // winner (faster boat)
        'athlete-b',
        2.0,
        { weight: 0.5 }
      );
    });

    it('respects dryRun option', async () => {
      const prisma = (await import('../../db/connection.js')).default;
      const { updateRatingsFromSeatRace } = await import('../eloRatingService.js');

      prisma.passiveObservation.findMany.mockResolvedValue([
        {
          id: 'obs-1',
          swappedAthlete1Id: 'athlete-a',
          swappedAthlete2Id: 'athlete-b',
          splitDifferenceSeconds: 2.0,
          weight: 0.5
        }
      ]);

      const result = await applyPendingObservations('team-1', { dryRun: true });

      expect(result.processed).toBe(1);
      expect(updateRatingsFromSeatRace).not.toHaveBeenCalled();
      expect(prisma.passiveObservation.update).not.toHaveBeenCalled();
    });

    it('determines winner based on split difference sign', async () => {
      const prisma = (await import('../../db/connection.js')).default;
      const { updateRatingsFromSeatRace } = await import('../eloRatingService.js');

      prisma.passiveObservation.findMany.mockResolvedValue([
        {
          id: 'obs-1',
          swappedAthlete1Id: 'athlete-a',
          swappedAthlete2Id: 'athlete-b',
          splitDifferenceSeconds: -3.0, // Negative = athlete-b was faster
          weight: 0.5
        }
      ]);
      prisma.passiveObservation.update.mockResolvedValue({});

      await applyPendingObservations('team-1');

      expect(updateRatingsFromSeatRace).toHaveBeenCalledWith(
        'team-1',
        'athlete-b', // winner (negative means boat2/athlete2 faster)
        'athlete-a',
        3.0,
        expect.any(Object)
      );
    });
  });

  describe('DEFAULT_PASSIVE_WEIGHT', () => {
    it('is 0.5 (half of formal seat race weight)', () => {
      expect(DEFAULT_PASSIVE_WEIGHT).toBe(0.5);
    });
  });

  describe('MIN_SPLIT_DIFFERENCE_SECONDS', () => {
    it('is 0.5 seconds', () => {
      expect(MIN_SPLIT_DIFFERENCE_SECONDS).toBe(0.5);
    });
  });
});
