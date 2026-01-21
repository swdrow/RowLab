/**
 * Background Sync Service
 *
 * Handles scheduled background synchronization of external integrations.
 * Runs periodic syncs for Concept2 Logbook and Strava activities.
 */

import cron from 'node-cron';
import { prisma } from '../db/connection.js';
import logger from '../utils/logger.js';
import * as concept2Service from './concept2Service.js';
import * as stravaService from './stravaService.js';

// Store sync status
let syncStatus = {
  concept2: { running: false, lastRun: null, nextRun: null, lastError: null },
  strava: { running: false, lastRun: null, nextRun: null, lastError: null },
};

// Track scheduled jobs
const scheduledJobs = {};

/**
 * Sync all Concept2 users with sync enabled
 */
async function syncAllConcept2() {
  if (syncStatus.concept2.running) {
    logger.info('Concept2 sync already running, skipping');
    return;
  }

  syncStatus.concept2.running = true;
  syncStatus.concept2.lastRun = new Date();

  try {
    // Find all users with Concept2 connected and sync enabled
    const users = await prisma.concept2Auth.findMany({
      where: {
        syncEnabled: true,
      },
      select: {
        userId: true,
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    logger.info(`Starting Concept2 background sync for ${users.length} users`);

    let successCount = 0;
    let errorCount = 0;

    for (const auth of users) {
      try {
        // Get user's team
        const teamMember = await prisma.teamMember.findFirst({
          where: { userId: auth.userId },
          select: { teamId: true },
        });

        if (!teamMember) {
          logger.warn('Concept2 sync: User has no team', { userId: auth.userId });
          continue;
        }

        // Sync results (last 30 days by default)
        const results = await concept2Service.syncResults(
          auth.userId,
          teamMember.teamId,
          { days: 30 }
        );

        if (results.imported > 0) {
          logger.info('Concept2 sync completed', {
            userId: auth.userId,
            imported: results.imported,
            skipped: results.skipped,
          });
        }

        successCount++;
      } catch (err) {
        errorCount++;
        logger.error('Concept2 sync error for user', {
          userId: auth.userId,
          error: err.message,
        });
      }
    }

    logger.info('Concept2 background sync completed', {
      total: users.length,
      success: successCount,
      errors: errorCount,
    });

    syncStatus.concept2.lastError = null;
  } catch (err) {
    logger.error('Concept2 background sync failed', { error: err.message });
    syncStatus.concept2.lastError = err.message;
  } finally {
    syncStatus.concept2.running = false;
  }
}

/**
 * Sync all Strava users with sync enabled
 */
async function syncAllStrava() {
  if (syncStatus.strava.running) {
    logger.info('Strava sync already running, skipping');
    return;
  }

  syncStatus.strava.running = true;
  syncStatus.strava.lastRun = new Date();

  try {
    // Find all users with Strava connected and sync enabled
    const users = await prisma.stravaAuth.findMany({
      where: {
        syncEnabled: true,
      },
      select: {
        userId: true,
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    logger.info(`Starting Strava background sync for ${users.length} users`);

    let successCount = 0;
    let errorCount = 0;

    for (const auth of users) {
      try {
        // Get user's team
        const teamMember = await prisma.teamMember.findFirst({
          where: { userId: auth.userId },
          select: { teamId: true },
        });

        if (!teamMember) {
          logger.warn('Strava sync: User has no team', { userId: auth.userId });
          continue;
        }

        // Sync activities (last 14 days by default)
        const results = await stravaService.syncActivities(
          auth.userId,
          teamMember.teamId,
          { days: 14 }
        );

        if (results.imported > 0) {
          logger.info('Strava sync completed', {
            userId: auth.userId,
            imported: results.imported,
            skipped: results.skipped,
          });
        }

        successCount++;
      } catch (err) {
        errorCount++;
        logger.error('Strava sync error for user', {
          userId: auth.userId,
          error: err.message,
        });
      }
    }

    logger.info('Strava background sync completed', {
      total: users.length,
      success: successCount,
      errors: errorCount,
    });

    syncStatus.strava.lastError = null;
  } catch (err) {
    logger.error('Strava background sync failed', { error: err.message });
    syncStatus.strava.lastError = err.message;
  } finally {
    syncStatus.strava.running = false;
  }
}

/**
 * Start background sync jobs
 * @param {Object} options - Configuration options
 * @param {string} options.concept2Cron - Cron expression for Concept2 sync (default: every 6 hours)
 * @param {string} options.stravaCron - Cron expression for Strava sync (default: every 4 hours)
 */
export function startBackgroundSync(options = {}) {
  const {
    concept2Cron = '0 */6 * * *', // Every 6 hours
    stravaCron = '0 */4 * * *',   // Every 4 hours
  } = options;

  // Schedule Concept2 sync
  if (scheduledJobs.concept2) {
    scheduledJobs.concept2.stop();
  }

  scheduledJobs.concept2 = cron.schedule(concept2Cron, async () => {
    logger.info('Running scheduled Concept2 sync');
    await syncAllConcept2();
  });

  // Schedule Strava sync
  if (scheduledJobs.strava) {
    scheduledJobs.strava.stop();
  }

  scheduledJobs.strava = cron.schedule(stravaCron, async () => {
    logger.info('Running scheduled Strava sync');
    await syncAllStrava();
  });

  // Calculate next run times
  syncStatus.concept2.nextRun = getNextCronRun(concept2Cron);
  syncStatus.strava.nextRun = getNextCronRun(stravaCron);

  logger.info('Background sync jobs started', {
    concept2: concept2Cron,
    strava: stravaCron,
    nextConcept2Run: syncStatus.concept2.nextRun,
    nextStravaRun: syncStatus.strava.nextRun,
  });
}

/**
 * Stop background sync jobs
 */
export function stopBackgroundSync() {
  if (scheduledJobs.concept2) {
    scheduledJobs.concept2.stop();
    scheduledJobs.concept2 = null;
  }

  if (scheduledJobs.strava) {
    scheduledJobs.strava.stop();
    scheduledJobs.strava = null;
  }

  logger.info('Background sync jobs stopped');
}

/**
 * Get current sync status
 */
export function getSyncStatus() {
  return {
    ...syncStatus,
    jobs: {
      concept2: scheduledJobs.concept2 ? 'running' : 'stopped',
      strava: scheduledJobs.strava ? 'running' : 'stopped',
    },
  };
}

/**
 * Manually trigger a sync
 * @param {string} integration - 'concept2' or 'strava'
 */
export async function triggerSync(integration) {
  switch (integration) {
    case 'concept2':
      await syncAllConcept2();
      break;
    case 'strava':
      await syncAllStrava();
      break;
    default:
      throw new Error(`Unknown integration: ${integration}`);
  }
}

/**
 * Get approximate next run time for a cron expression
 */
function getNextCronRun(cronExpression) {
  // Simple approximation - node-cron doesn't provide this directly
  // For a proper implementation, use a library like cron-parser
  const now = new Date();
  const parts = cronExpression.split(' ');

  // Handle common patterns
  if (parts[1] && parts[1].startsWith('*/')) {
    const hours = parseInt(parts[1].substring(2));
    const nextHour = Math.ceil(now.getHours() / hours) * hours;
    const next = new Date(now);
    next.setHours(nextHour, 0, 0, 0);
    if (next <= now) {
      next.setHours(next.getHours() + hours);
    }
    return next;
  }

  // Default: assume next occurrence is in ~1 hour
  return new Date(now.getTime() + 60 * 60 * 1000);
}

export default {
  startBackgroundSync,
  stopBackgroundSync,
  getSyncStatus,
  triggerSync,
};
