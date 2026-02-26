import express from 'express';
import logger from '../../utils/logger.js';
import { body, param, query, validationResult } from 'express-validator';
import {
  createShell,
  getShells,
  getShellById,
  updateShell,
  deleteShell,
  getShellsByBoatClass,
  bulkImportShells,
} from '../../services/shellService.js';
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
 * GET /api/v1/shells
 * List all shells for the team
 */
router.get(
  '/',
  authenticateToken,
  teamIsolation,
  [
    query('boatClass').optional().trim(),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const shells = await getShells(req.user.activeTeamId, req.query);
      res.json({
        success: true,
        data: { shells },
      });
    } catch (error) {
      logger.error('Get shells error', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to get shells' },
      });
    }
  }
);

/**
 * GET /api/v1/shells/grouped
 * Get shells grouped by boat class
 */
router.get(
  '/grouped',
  authenticateToken,
  teamIsolation,
  async (req, res) => {
    try {
      const grouped = await getShellsByBoatClass(req.user.activeTeamId);
      res.json({
        success: true,
        data: { grouped },
      });
    } catch (error) {
      logger.error('Get grouped shells error', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to get shells' },
      });
    }
  }
);

/**
 * GET /api/v1/shells/:id
 * Get single shell
 */
router.get(
  '/:id',
  authenticateToken,
  teamIsolation,
  [param('id').isUUID()],
  validateRequest,
  async (req, res) => {
    try {
      const shell = await getShellById(req.user.activeTeamId, req.params.id);
      res.json({
        success: true,
        data: { shell },
      });
    } catch (error) {
      if (error.message === 'Shell not found') {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: error.message },
        });
      }
      logger.error('Get shell error', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to get shell' },
      });
    }
  }
);

/**
 * POST /api/v1/shells
 * Create new shell
 */
router.post(
  '/',
  authenticateToken,
  teamIsolation,
  requireRole('OWNER', 'COACH'),
  [
    body('name').trim().isLength({ min: 1, max: 100 }),
    body('boatClass').trim().isLength({ min: 1, max: 20 }),
    body('notes').optional().trim().isLength({ max: 500 }),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const shell = await createShell(req.user.activeTeamId, req.body);
      res.status(201).json({
        success: true,
        data: { shell },
      });
    } catch (error) {
      if (error.message.includes('already exists')) {
        return res.status(409).json({
          success: false,
          error: { code: 'DUPLICATE', message: error.message },
        });
      }
      logger.error('Create shell error', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to create shell' },
      });
    }
  }
);

/**
 * POST /api/v1/shells/bulk-import
 * Bulk import shells
 */
router.post(
  '/bulk-import',
  authenticateToken,
  teamIsolation,
  requireRole('OWNER', 'COACH'),
  [
    body('shells').isArray({ min: 1, max: 100 }),
    body('shells.*.name').trim().isLength({ min: 1, max: 100 }),
    body('shells.*.boatClass').trim().isLength({ min: 1, max: 20 }),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const result = await bulkImportShells(req.user.activeTeamId, req.body.shells);
      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Bulk import shells error', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to import shells' },
      });
    }
  }
);

/**
 * PATCH /api/v1/shells/:id
 * Update shell
 */
router.patch(
  '/:id',
  authenticateToken,
  teamIsolation,
  requireRole('OWNER', 'COACH'),
  [
    param('id').isUUID(),
    body('name').optional().trim().isLength({ min: 1, max: 100 }),
    body('boatClass').optional().trim().isLength({ min: 1, max: 20 }),
    body('notes').optional().trim().isLength({ max: 500 }),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const shell = await updateShell(req.user.activeTeamId, req.params.id, req.body);
      res.json({
        success: true,
        data: { shell },
      });
    } catch (error) {
      if (error.message === 'Shell not found') {
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
      logger.error('Update shell error', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to update shell' },
      });
    }
  }
);

/**
 * DELETE /api/v1/shells/:id
 * Delete shell
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
      await deleteShell(req.user.activeTeamId, req.params.id);
      res.json({
        success: true,
        data: { message: 'Shell deleted' },
      });
    } catch (error) {
      if (error.message === 'Shell not found') {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: error.message },
        });
      }
      logger.error('Delete shell error', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to delete shell' },
      });
    }
  }
);

export default router;
