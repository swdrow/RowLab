import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import {
  createBoatConfig,
  getBoatConfigs,
  getBoatConfigById,
  updateBoatConfig,
  deleteBoatConfig,
  getStandardConfigs,
} from '../services/boatConfigService.js';
import { authenticateToken, requireRole, teamIsolation } from '../middleware/auth.js';
import logger from '../utils/logger.js';

const router = express.Router();

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_FAILED', message: 'Validation failed', details: errors.array() },
    });
  }
  next();
};

/**
 * GET /api/v1/boat-configs
 * List all boat configs (standard + custom)
 */
router.get(
  '/',
  authenticateToken,
  teamIsolation,
  [
    query('includeStandard').optional().isBoolean(),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const configs = await getBoatConfigs(req.user.activeTeamId, {
        includeStandard: req.query.includeStandard !== 'false',
      });
      res.json({
        success: true,
        data: { configs },
      });
    } catch (error) {
      logger.error('Get boat configs error', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to get boat configs' },
      });
    }
  }
);

/**
 * GET /api/v1/boat-configs/standard
 * Get only standard boat configs
 */
router.get(
  '/standard',
  authenticateToken,
  async (req, res) => {
    try {
      const configs = getStandardConfigs();
      res.json({
        success: true,
        data: { configs },
      });
    } catch (error) {
      logger.error('Get standard configs error', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to get standard configs' },
      });
    }
  }
);

/**
 * GET /api/v1/boat-configs/:id
 * Get single boat config
 */
router.get(
  '/:id',
  authenticateToken,
  teamIsolation,
  async (req, res) => {
    try {
      const config = await getBoatConfigById(req.user.activeTeamId, req.params.id);
      res.json({
        success: true,
        data: { config },
      });
    } catch (error) {
      if (error.message === 'Boat config not found') {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: error.message },
        });
      }
      logger.error('Get boat config error', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to get boat config' },
      });
    }
  }
);

/**
 * POST /api/v1/boat-configs
 * Create new custom boat config
 */
router.post(
  '/',
  authenticateToken,
  teamIsolation,
  requireRole('OWNER', 'COACH'),
  [
    body('name').trim().isLength({ min: 1, max: 50 }),
    body('numSeats').isInt({ min: 1, max: 8 }),
    body('hasCoxswain').optional().isBoolean(),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const config = await createBoatConfig(req.user.activeTeamId, req.body);
      res.status(201).json({
        success: true,
        data: { config },
      });
    } catch (error) {
      if (error.message.includes('already exists')) {
        return res.status(409).json({
          success: false,
          error: { code: 'DUPLICATE', message: error.message },
        });
      }
      logger.error('Create boat config error', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to create boat config' },
      });
    }
  }
);

/**
 * PATCH /api/v1/boat-configs/:id
 * Update custom boat config
 */
router.patch(
  '/:id',
  authenticateToken,
  teamIsolation,
  requireRole('OWNER', 'COACH'),
  [
    body('name').optional().trim().isLength({ min: 1, max: 50 }),
    body('numSeats').optional().isInt({ min: 1, max: 8 }),
    body('hasCoxswain').optional().isBoolean(),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const config = await updateBoatConfig(req.user.activeTeamId, req.params.id, req.body);
      res.json({
        success: true,
        data: { config },
      });
    } catch (error) {
      if (error.message === 'Boat config not found') {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: error.message },
        });
      }
      if (error.message.includes('Cannot modify') || error.message.includes('Cannot use')) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_OPERATION', message: error.message },
        });
      }
      if (error.message.includes('already exists')) {
        return res.status(409).json({
          success: false,
          error: { code: 'DUPLICATE', message: error.message },
        });
      }
      logger.error('Update boat config error', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to update boat config' },
      });
    }
  }
);

/**
 * DELETE /api/v1/boat-configs/:id
 * Delete custom boat config
 */
router.delete(
  '/:id',
  authenticateToken,
  teamIsolation,
  requireRole('OWNER', 'COACH'),
  async (req, res) => {
    try {
      await deleteBoatConfig(req.user.activeTeamId, req.params.id);
      res.json({
        success: true,
        data: { message: 'Boat config deleted' },
      });
    } catch (error) {
      if (error.message === 'Boat config not found') {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: error.message },
        });
      }
      if (error.message.includes('Cannot delete')) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_OPERATION', message: error.message },
        });
      }
      logger.error('Delete boat config error', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to delete boat config' },
      });
    }
  }
);

export default router;
