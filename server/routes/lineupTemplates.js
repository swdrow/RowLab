/**
 * Lineup Template Routes - Phase 18 Plan 04
 *
 * Endpoints:
 * GET    /api/v1/lineup-templates              - List all templates
 * GET    /api/v1/lineup-templates/:id          - Get single template
 * POST   /api/v1/lineup-templates              - Create new template
 * POST   /api/v1/lineup-templates/from-lineup  - Create template from existing lineup
 * PUT    /api/v1/lineup-templates/:id          - Update template
 * DELETE /api/v1/lineup-templates/:id          - Delete template
 * POST   /api/v1/lineup-templates/:id/apply    - Apply template to get assignments
 */

import express from 'express';
import { param, body, query, validationResult } from 'express-validator';
import { authenticateToken, requireTeam } from '../middleware/auth.js';
import * as templateService from '../services/lineupTemplateService.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Validation middleware
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
 * GET /api/v1/lineup-templates
 * List all templates, optionally filtered by boat class
 */
router.get(
  '/',
  authenticateToken,
  requireTeam,
  [query('boatClass').optional().isString()],
  validateRequest,
  async (req, res) => {
    try {
      const templates = await templateService.getTemplates(
        req.user.activeTeamId,
        req.query.boatClass || null
      );
      res.json({ success: true, data: { templates } });
    } catch (error) {
      logger.error('Error fetching templates:', error);
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: error.message },
      });
    }
  }
);

/**
 * GET /api/v1/lineup-templates/:id
 * Get a single template
 */
router.get(
  '/:id',
  authenticateToken,
  requireTeam,
  [param('id').isString().notEmpty()],
  validateRequest,
  async (req, res) => {
    try {
      const template = await templateService.getTemplateById(
        req.params.id,
        req.user.activeTeamId
      );
      res.json({ success: true, data: { template } });
    } catch (error) {
      logger.error('Error fetching template:', error);
      if (error.message === 'Template not found') {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Template not found' },
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
 * POST /api/v1/lineup-templates
 * Create a new template
 */
router.post(
  '/',
  authenticateToken,
  requireTeam,
  [
    body('name').isString().notEmpty().trim(),
    body('description').optional().isString().trim(),
    body('boatClass').isString().notEmpty(),
    body('assignments').isArray().notEmpty(),
    body('assignments.*.seatNumber').isInt({ min: 0 }),
    body('assignments.*.side').isIn(['Port', 'Starboard']),
    body('assignments.*.preferredAthleteId').optional().isString(),
    body('rigging').optional().isObject(),
    body('isDefault').optional().isBoolean(),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const template = await templateService.createTemplate(
        req.user.activeTeamId,
        req.body
      );
      res.status(201).json({ success: true, data: { template } });
    } catch (error) {
      logger.error('Error creating template:', error);
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: error.message },
      });
    }
  }
);

/**
 * POST /api/v1/lineup-templates/from-lineup
 * Create template from existing lineup
 */
router.post(
  '/from-lineup',
  authenticateToken,
  requireTeam,
  [
    body('lineupId').isString().notEmpty(),
    body('name').isString().notEmpty().trim(),
    body('isDefault').optional().isBoolean(),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const template = await templateService.createTemplateFromLineup(
        req.user.activeTeamId,
        req.body.lineupId,
        req.body.name,
        req.body.isDefault || false
      );
      res.status(201).json({ success: true, data: { template } });
    } catch (error) {
      logger.error('Error creating template from lineup:', error);
      if (error.message === 'Lineup not found') {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Lineup not found' },
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
 * PUT /api/v1/lineup-templates/:id
 * Update a template
 */
router.put(
  '/:id',
  authenticateToken,
  requireTeam,
  [
    param('id').isString().notEmpty(),
    body('name').optional().isString().trim(),
    body('description').optional().isString().trim(),
    body('assignments').optional().isArray(),
    body('rigging').optional().isObject(),
    body('isDefault').optional().isBoolean(),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const template = await templateService.updateTemplate(
        req.params.id,
        req.user.activeTeamId,
        req.body
      );
      res.json({ success: true, data: { template } });
    } catch (error) {
      logger.error('Error updating template:', error);
      if (error.message === 'Template not found') {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Template not found' },
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
 * DELETE /api/v1/lineup-templates/:id
 * Delete a template
 */
router.delete(
  '/:id',
  authenticateToken,
  requireTeam,
  [param('id').isString().notEmpty()],
  validateRequest,
  async (req, res) => {
    try {
      await templateService.deleteTemplate(
        req.params.id,
        req.user.activeTeamId
      );
      res.json({ success: true, data: { message: 'Template deleted' } });
    } catch (error) {
      logger.error('Error deleting template:', error);
      if (error.message === 'Template not found') {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Template not found' },
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
 * POST /api/v1/lineup-templates/:id/apply
 * Apply template to get assignments
 */
router.post(
  '/:id/apply',
  authenticateToken,
  requireTeam,
  [param('id').isString().notEmpty()],
  validateRequest,
  async (req, res) => {
    try {
      const result = await templateService.applyTemplate(
        req.params.id,
        req.user.activeTeamId
      );
      res.json({ success: true, data: result });
    } catch (error) {
      logger.error('Error applying template:', error);
      if (error.message === 'Template not found') {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Template not found' },
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
