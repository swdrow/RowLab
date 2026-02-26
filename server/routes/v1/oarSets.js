import express from 'express';
import logger from '../../utils/logger.js';
import { body, param, query, validationResult } from 'express-validator';
import {
  createOarSet,
  getOarSets,
  getOarSetById,
  updateOarSet,
  deleteOarSet,
} from '../../services/oarSetService.js';
import { authenticateToken, requireRole, teamIsolation } from '../../middleware/auth.js';

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
 * GET /api/v1/oar-sets
 * List all oar sets for the team
 */
router.get(
  '/',
  authenticateToken,
  teamIsolation,
  [
    query('type').optional().isIn(['SWEEP', 'SCULL']),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const oarSets = await getOarSets(req.user.activeTeamId, req.query);
      res.json({
        success: true,
        data: { oarSets },
      });
    } catch (error) {
      logger.error('Get oar sets error', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to get oar sets' },
      });
    }
  }
);

/**
 * GET /api/v1/oar-sets/:id
 * Get single oar set
 */
router.get(
  '/:id',
  authenticateToken,
  teamIsolation,
  [param('id').isUUID()],
  validateRequest,
  async (req, res) => {
    try {
      const oarSet = await getOarSetById(req.user.activeTeamId, req.params.id);
      res.json({
        success: true,
        data: { oarSet },
      });
    } catch (error) {
      if (error.message === 'Oar set not found') {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: error.message },
        });
      }
      logger.error('Get oar set error', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to get oar set' },
      });
    }
  }
);

/**
 * POST /api/v1/oar-sets
 * Create new oar set
 */
router.post(
  '/',
  authenticateToken,
  teamIsolation,
  requireRole('OWNER', 'COACH'),
  [
    body('name').trim().isLength({ min: 1, max: 100 }),
    body('type').isIn(['SWEEP', 'SCULL']),
    body('count').isInt({ min: 1, max: 100 }),
    body('status').optional().isIn(['AVAILABLE', 'IN_USE', 'MAINTENANCE', 'RETIRED']),
    body('notes').optional().trim().isLength({ max: 500 }),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const oarSet = await createOarSet(req.user.activeTeamId, req.body);
      res.status(201).json({
        success: true,
        data: { oarSet },
      });
    } catch (error) {
      if (error.message.includes('already exists')) {
        return res.status(409).json({
          success: false,
          error: { code: 'DUPLICATE', message: error.message },
        });
      }
      logger.error('Create oar set error', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to create oar set' },
      });
    }
  }
);

/**
 * PATCH /api/v1/oar-sets/:id
 * Update oar set
 */
router.patch(
  '/:id',
  authenticateToken,
  teamIsolation,
  requireRole('OWNER', 'COACH'),
  [
    param('id').isUUID(),
    body('name').optional().trim().isLength({ min: 1, max: 100 }),
    body('type').optional().isIn(['SWEEP', 'SCULL']),
    body('count').optional().isInt({ min: 1, max: 100 }),
    body('status').optional().isIn(['AVAILABLE', 'IN_USE', 'MAINTENANCE', 'RETIRED']),
    body('notes').optional().trim().isLength({ max: 500 }),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const oarSet = await updateOarSet(req.user.activeTeamId, req.params.id, req.body);
      res.json({
        success: true,
        data: { oarSet },
      });
    } catch (error) {
      if (error.message === 'Oar set not found') {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: error.message },
        });
      }
      if (error.message.includes('already exists')) {
        return res.status(409).json({
          success: false,
          error: { code: 'DUPLICATE', message: error.message },
        });
      }
      logger.error('Update oar set error', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to update oar set' },
      });
    }
  }
);

/**
 * DELETE /api/v1/oar-sets/:id
 * Delete oar set
 */
router.delete(
  '/:id',
  authenticateToken,
  teamIsolation,
  requireRole('OWNER', 'COACH'),
  [param('id').isUUID()],
  validateRequest,
  async (req, res) => {
    try {
      await deleteOarSet(req.user.activeTeamId, req.params.id);
      res.json({
        success: true,
        data: { message: 'Oar set deleted' },
      });
    } catch (error) {
      if (error.message === 'Oar set not found') {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: error.message },
        });
      }
      logger.error('Delete oar set error', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to delete oar set' },
      });
    }
  }
);

export default router;
