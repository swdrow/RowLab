/**
 * Rigging Profile Routes - Phase 18 BOAT-02
 *
 * Endpoints:
 * GET    /api/v1/rigging/defaults           - Get all default rigging values
 * GET    /api/v1/rigging/shell/:shellId     - Get rigging for a shell
 * GET    /api/v1/rigging                    - Get all team rigging profiles
 * PUT    /api/v1/rigging/shell/:shellId     - Create/update rigging for a shell
 * DELETE /api/v1/rigging/shell/:shellId     - Delete custom rigging (revert to default)
 */

import express from 'express';
import { param, body, validationResult } from 'express-validator';
import { authenticateToken, requireTeam } from '../middleware/auth.js';
import * as riggingService from '../services/riggingService.js';
import logger from '../utils/logger.js';

const router = express.Router();

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', details: errors.array() },
    });
  }
  next();
};

/**
 * GET /api/v1/rigging/defaults
 * Get all default rigging values by boat class
 */
router.get('/defaults', authenticateToken, requireTeam, async (req, res) => {
  try {
    const defaults = riggingService.getAllDefaultRigging();
    res.json({ success: true, data: { defaults } });
  } catch (error) {
    logger.error('Error fetching default rigging:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message },
    });
  }
});

/**
 * GET /api/v1/rigging
 * Get all rigging profiles for the team
 */
router.get('/', authenticateToken, requireTeam, async (req, res) => {
  try {
    const profiles = await riggingService.getTeamRiggingProfiles(
      req.user.activeTeamId
    );
    res.json({ success: true, data: { profiles } });
  } catch (error) {
    logger.error('Error fetching team rigging profiles:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message },
    });
  }
});

/**
 * GET /api/v1/rigging/shell/:shellId
 * Get rigging profile for a specific shell
 */
router.get(
  '/shell/:shellId',
  authenticateToken,
  requireTeam,
  [param('shellId').isString().notEmpty()],
  validateRequest,
  async (req, res) => {
    try {
      const profile = await riggingService.getRiggingProfile(
        req.params.shellId,
        req.user.activeTeamId
      );
      res.json({ success: true, data: { profile } });
    } catch (error) {
      logger.error('Error fetching rigging profile:', error);
      if (error.message === 'Shell not found') {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Shell not found' },
        });
      }
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: error.message },
      });
    }
  }
);

/**
 * PUT /api/v1/rigging/shell/:shellId
 * Create or update rigging profile for a shell
 */
router.put(
  '/shell/:shellId',
  authenticateToken,
  requireTeam,
  [
    param('shellId').isString().notEmpty(),
    body('defaults').isObject().withMessage('defaults must be an object'),
    body('defaults.spread')
      .optional()
      .isNumeric()
      .withMessage('spread must be a number'),
    body('defaults.span')
      .optional()
      .isNumeric()
      .withMessage('span must be a number'),
    body('defaults.catchAngle')
      .optional()
      .isNumeric()
      .withMessage('catchAngle must be a number'),
    body('defaults.finishAngle')
      .optional()
      .isNumeric()
      .withMessage('finishAngle must be a number'),
    body('defaults.oarLength')
      .optional()
      .isNumeric()
      .withMessage('oarLength must be a number'),
    body('defaults.inboard')
      .optional()
      .isNumeric()
      .withMessage('inboard must be a number'),
    body('defaults.pitch')
      .optional()
      .isNumeric()
      .withMessage('pitch must be a number'),
    body('defaults.gateHeight')
      .optional()
      .isNumeric()
      .withMessage('gateHeight must be a number'),
    body('perSeat').optional().isObject(),
    body('notes').optional().isString(),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const profile = await riggingService.upsertRiggingProfile(
        req.params.shellId,
        req.user.activeTeamId,
        req.body
      );
      res.json({ success: true, data: { profile } });
    } catch (error) {
      logger.error('Error saving rigging profile:', error);
      if (error.message === 'Shell not found') {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Shell not found' },
        });
      }
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: error.message },
      });
    }
  }
);

/**
 * DELETE /api/v1/rigging/shell/:shellId
 * Delete custom rigging profile (reverts shell to default)
 */
router.delete(
  '/shell/:shellId',
  authenticateToken,
  requireTeam,
  [param('shellId').isString().notEmpty()],
  validateRequest,
  async (req, res) => {
    try {
      await riggingService.deleteRiggingProfile(
        req.params.shellId,
        req.user.activeTeamId
      );
      res.json({ success: true, data: { message: 'Rigging profile deleted' } });
    } catch (error) {
      logger.error('Error deleting rigging profile:', error);
      if (
        error.message === 'Shell not found' ||
        error.message === 'Rigging profile not found'
      ) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: error.message },
        });
      }
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: error.message },
      });
    }
  }
);

export default router;
