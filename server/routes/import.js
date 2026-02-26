import express from 'express';
import logger from '../utils/logger.js';
import multer from 'multer';
import { body, validationResult } from 'express-validator';
import {
  parseCSV,
  detectColumnMapping,
  previewCSVImport,
  executeCSVImport,
} from '../services/csvImportService.js';
import { authenticateToken, requireRole, teamIsolation } from '../middleware/auth.js';

const router = express.Router();

// Configure multer for file uploads (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
});

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

// All routes require authentication and team context
router.use(authenticateToken, teamIsolation);

/**
 * POST /api/v1/import/csv/preview
 * Preview CSV import (validate without saving)
 */
router.post(
  '/csv/preview',
  requireRole('OWNER', 'COACH'),
  upload.single('file'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: { code: 'NO_FILE', message: 'CSV file is required' },
        });
      }

      const content = req.file.buffer.toString('utf-8');
      const options = {
        delimiter: req.body.delimiter || ',',
        hasHeaders: req.body.hasHeaders !== 'false',
        mapping: req.body.mapping ? JSON.parse(req.body.mapping) : undefined,
      };

      const preview = await previewCSVImport(req.user.activeTeamId, content, options);

      res.json({
        success: true,
        data: {
          ...preview,
          filename: req.file.originalname,
        },
      });
    } catch (error) {
      logger.error('CSV preview error', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: error.message || 'Failed to preview CSV' },
      });
    }
  }
);

/**
 * POST /api/v1/import/csv/execute
 * Execute CSV import (save validated rows)
 */
router.post(
  '/csv/execute',
  requireRole('OWNER', 'COACH'),
  [
    body('validRows').isArray({ min: 1 }),
    body('validRows.*.row').isInt({ min: 1 }),
    body('validRows.*.data').isObject(),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const result = await executeCSVImport(req.user.activeTeamId, req.body.validRows);

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('CSV execute error', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to import CSV' },
      });
    }
  }
);

/**
 * POST /api/v1/import/csv/detect-mapping
 * Detect column mapping from CSV headers
 */
router.post(
  '/csv/detect-mapping',
  requireRole('OWNER', 'COACH'),
  upload.single('file'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: { code: 'NO_FILE', message: 'CSV file is required' },
        });
      }

      const content = req.file.buffer.toString('utf-8');
      const rows = parseCSV(content, {
        delimiter: req.body.delimiter || ',',
        hasHeaders: true,
      });

      if (rows.length === 0) {
        return res.status(400).json({
          success: false,
          error: { code: 'EMPTY_FILE', message: 'CSV file is empty' },
        });
      }

      const headers = Object.keys(rows[0]);
      const mapping = detectColumnMapping(headers);

      res.json({
        success: true,
        data: {
          headers,
          mapping,
          sampleRow: rows[0],
          totalRows: rows.length,
        },
      });
    } catch (error) {
      logger.error('Detect mapping error', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: error.message || 'Failed to detect mapping' },
      });
    }
  }
);

export default router;
