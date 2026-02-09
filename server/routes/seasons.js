import express from 'express';
import { z } from 'zod';
import { authenticateToken, requireTeam } from '../middleware/auth.js';
import { validateQuery } from '../middleware/validation.js';
import * as seasonService from '../services/seasonService.js';
import logger from '../utils/logger.js';

const router = express.Router();

router.use(authenticateToken);
router.use(requireTeam);

// ============================================
// Validation Schemas
// ============================================

const seasonQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

// ============================================
// Season Routes
// ============================================

/**
 * GET /api/v1/seasons/milestones
 * Get season milestones timeline
 */
router.get('/milestones', validateQuery(seasonQuerySchema), async (req, res) => {
  try {
    const { activeTeamId } = req.user;
    const { startDate, endDate } = req.query;

    const result = await seasonService.getSeasonMilestones(activeTeamId, startDate, endDate);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Failed to fetch season milestones', { error: error.message });
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to fetch season milestones' },
    });
  }
});

export default router;
