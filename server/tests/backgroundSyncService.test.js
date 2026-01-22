/**
 * Background Sync Service Tests
 *
 * Tests for scheduled background synchronization.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Create hoisted mocks
const mockLogger = vi.hoisted(() => ({
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
}));

const mockPrisma = vi.hoisted(() => ({
  concept2Auth: {
    findMany: vi.fn(),
  },
  stravaAuth: {
    findMany: vi.fn(),
  },
  teamMember: {
    findFirst: vi.fn(),
  },
}));

const mockCronSchedule = vi.hoisted(() => vi.fn());
const mockCronStop = vi.hoisted(() => vi.fn());

// Mock modules
vi.mock('../utils/logger.js', () => ({
  default: mockLogger,
}));

vi.mock('../db/connection.js', () => ({
  prisma: mockPrisma,
}));

vi.mock('node-cron', () => ({
  default: {
    schedule: mockCronSchedule.mockReturnValue({
      stop: mockCronStop,
    }),
  },
}));

vi.mock('./concept2Service.js', () => ({
  syncResults: vi.fn().mockResolvedValue({ imported: 5, skipped: 2 }),
}));

vi.mock('./stravaService.js', () => ({
  syncActivities: vi.fn().mockResolvedValue({ imported: 3, skipped: 1 }),
}));

// Import the module
const {
  startBackgroundSync,
  stopBackgroundSync,
  getSyncStatus,
  triggerSync,
} = await import('../services/backgroundSyncService.js');

describe('BackgroundSyncService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset sync status by stopping any running jobs
    stopBackgroundSync();
  });

  afterEach(() => {
    stopBackgroundSync();
  });

  describe('startBackgroundSync', () => {
    it('should schedule Concept2 and Strava sync jobs with default cron', () => {
      startBackgroundSync();

      // Should have scheduled two jobs
      expect(mockCronSchedule).toHaveBeenCalledTimes(2);

      // Check Concept2 cron (every 6 hours by default)
      expect(mockCronSchedule).toHaveBeenCalledWith(
        '0 */6 * * *',
        expect.any(Function)
      );

      // Check Strava cron (every 4 hours by default)
      expect(mockCronSchedule).toHaveBeenCalledWith(
        '0 */4 * * *',
        expect.any(Function)
      );

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Background sync jobs started',
        expect.any(Object)
      );
    });

    it('should accept custom cron expressions', () => {
      startBackgroundSync({
        concept2Cron: '0 */12 * * *', // Every 12 hours
        stravaCron: '0 */8 * * *',    // Every 8 hours
      });

      expect(mockCronSchedule).toHaveBeenCalledWith(
        '0 */12 * * *',
        expect.any(Function)
      );
      expect(mockCronSchedule).toHaveBeenCalledWith(
        '0 */8 * * *',
        expect.any(Function)
      );
    });

    it('should stop existing jobs before starting new ones', () => {
      startBackgroundSync();
      mockCronStop.mockClear();
      mockCronSchedule.mockClear();

      startBackgroundSync({ concept2Cron: '0 0 * * *' });

      // Should have stopped the old jobs
      expect(mockCronStop).toHaveBeenCalled();
      // Should have scheduled new jobs
      expect(mockCronSchedule).toHaveBeenCalledTimes(2);
    });
  });

  describe('stopBackgroundSync', () => {
    it('should stop all scheduled jobs', () => {
      startBackgroundSync();
      mockCronStop.mockClear();

      stopBackgroundSync();

      expect(mockCronStop).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith('Background sync jobs stopped');
    });

    it('should handle being called when no jobs are running', () => {
      // Should not throw
      expect(() => stopBackgroundSync()).not.toThrow();
    });
  });

  describe('getSyncStatus', () => {
    it('should return current sync status', () => {
      const status = getSyncStatus();

      expect(status).toHaveProperty('concept2');
      expect(status).toHaveProperty('strava');
      expect(status).toHaveProperty('jobs');
      expect(status.concept2).toHaveProperty('running');
      expect(status.concept2).toHaveProperty('lastRun');
      expect(status.concept2).toHaveProperty('nextRun');
      expect(status.concept2).toHaveProperty('lastError');
    });

    it('should show jobs as stopped when not started', () => {
      stopBackgroundSync();
      const status = getSyncStatus();

      expect(status.jobs.concept2).toBe('stopped');
      expect(status.jobs.strava).toBe('stopped');
    });

    it('should show jobs as running when started', () => {
      startBackgroundSync();
      const status = getSyncStatus();

      expect(status.jobs.concept2).toBe('running');
      expect(status.jobs.strava).toBe('running');
    });
  });

  describe('triggerSync', () => {
    it('should trigger Concept2 sync manually', async () => {
      mockPrisma.concept2Auth.findMany.mockResolvedValueOnce([]);

      await triggerSync('concept2');

      expect(mockPrisma.concept2Auth.findMany).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Concept2'),
        expect.any(Object)
      );
    });

    it('should trigger Strava sync manually', async () => {
      mockPrisma.stravaAuth.findMany.mockResolvedValueOnce([]);

      await triggerSync('strava');

      expect(mockPrisma.stravaAuth.findMany).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Strava'),
        expect.any(Object)
      );
    });

    it('should throw error for unknown integration', async () => {
      await expect(triggerSync('unknown'))
        .rejects.toThrow('Unknown integration: unknown');
    });
  });
});
