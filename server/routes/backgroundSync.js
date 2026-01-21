/**
 * Background Sync Admin Routes
 *
 * Admin endpoints for managing background sync jobs
 */

import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { getSyncStatus, triggerSync, startBackgroundSync, stopBackgroundSync } from '../services/backgroundSyncService.js';
import logger from '../utils/logger.js';

const router = Router();

/**
 * Middleware to check if user is admin
 */
const requireAdmin = (req, res, next) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({
      error: { message: 'Admin access required' },
    });
  }
  next();
};

/**
 * GET /api/v1/admin/sync/status
 * Get current sync status
 */
router.get('/status', authenticateToken, requireAdmin, (req, res) => {
  const status = getSyncStatus();
  res.json({
    data: status,
  });
});

/**
 * POST /api/v1/admin/sync/trigger
 * Manually trigger a sync
 */
router.post('/trigger', authenticateToken, requireAdmin, async (req, res) => {
  const { integration } = req.body;

  if (!integration || !['concept2', 'strava', 'all'].includes(integration)) {
    return res.status(400).json({
      error: { message: 'Invalid integration. Must be: concept2, strava, or all' },
    });
  }

  try {
    if (integration === 'all') {
      await Promise.all([
        triggerSync('concept2'),
        triggerSync('strava'),
      ]);
    } else {
      await triggerSync(integration);
    }

    logger.info('Manual sync triggered', { integration, triggeredBy: req.user.id });

    res.json({
      data: {
        message: `Sync triggered for ${integration}`,
        status: getSyncStatus(),
      },
    });
  } catch (err) {
    logger.error('Manual sync trigger failed', { error: err.message });
    res.status(500).json({
      error: { message: err.message },
    });
  }
});

/**
 * POST /api/v1/admin/sync/start
 * Start background sync jobs
 */
router.post('/start', authenticateToken, requireAdmin, (req, res) => {
  const { concept2Cron, stravaCron } = req.body;

  try {
    startBackgroundSync({ concept2Cron, stravaCron });

    logger.info('Background sync started', { startedBy: req.user.id });

    res.json({
      data: {
        message: 'Background sync jobs started',
        status: getSyncStatus(),
      },
    });
  } catch (err) {
    logger.error('Failed to start background sync', { error: err.message });
    res.status(500).json({
      error: { message: err.message },
    });
  }
});

/**
 * POST /api/v1/admin/sync/stop
 * Stop background sync jobs
 */
router.post('/stop', authenticateToken, requireAdmin, (req, res) => {
  try {
    stopBackgroundSync();

    logger.info('Background sync stopped', { stoppedBy: req.user.id });

    res.json({
      data: {
        message: 'Background sync jobs stopped',
        status: getSyncStatus(),
      },
    });
  } catch (err) {
    logger.error('Failed to stop background sync', { error: err.message });
    res.status(500).json({
      error: { message: err.message },
    });
  }
});

export default router;
