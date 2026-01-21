/**
 * FIT File Import Routes
 *
 * Handles uploading and parsing of Garmin .FIT files
 */

import { Router } from 'express';
import multer from 'multer';
import { authenticateToken } from '../middleware/auth.js';
import { prisma } from '../db/connection.js';
import { parseFitFile, validateFitFile, toRowLabWorkout } from '../services/fitParserService.js';
import logger from '../utils/logger.js';

const router = Router();

// Configure multer for file uploads
// Store in memory for processing (files are typically <10MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max
    files: 10, // Max 10 files per request
  },
  fileFilter: (req, file, cb) => {
    // Accept .fit files
    if (file.originalname.toLowerCase().endsWith('.fit')) {
      cb(null, true);
    } else {
      cb(new Error('Only .FIT files are allowed'), false);
    }
  },
});

/**
 * POST /api/v1/fit/import
 * Import one or more FIT files as workouts
 */
router.post('/import', authenticateToken, upload.array('files', 10), async (req, res) => {
  try {
    const userId = req.user.id;
    const { athleteId } = req.body;

    // Get user's current team
    const teamMember = await prisma.teamMember.findFirst({
      where: { userId },
      select: { teamId: true },
    });

    if (!teamMember) {
      return res.status(400).json({
        error: { message: 'You must be part of a team to import workouts' },
      });
    }

    const teamId = teamMember.teamId;

    // Validate athleteId if provided
    if (athleteId) {
      const athlete = await prisma.athlete.findFirst({
        where: { id: athleteId, teamId },
      });

      if (!athlete) {
        return res.status(400).json({
          error: { message: 'Athlete not found or not in your team' },
        });
      }
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        error: { message: 'No files uploaded' },
      });
    }

    const results = {
      imported: [],
      failed: [],
    };

    // Process each file
    for (const file of req.files) {
      try {
        // Validate FIT file format
        const validation = validateFitFile(file.buffer);
        if (!validation.valid) {
          results.failed.push({
            filename: file.originalname,
            error: validation.error,
          });
          continue;
        }

        // Parse the FIT file
        const parsedData = await parseFitFile(file.buffer);

        // Convert to RowLab workout format
        const workoutData = toRowLabWorkout(parsedData, userId, teamId, athleteId);

        // Check for duplicate (same date, type, duration within 5 seconds)
        const existingWorkout = await prisma.workout.findFirst({
          where: {
            teamId,
            source: 'garmin_fit',
            date: {
              gte: new Date(workoutData.date.getTime() - 60000), // 1 minute tolerance
              lte: new Date(workoutData.date.getTime() + 60000),
            },
            duration: {
              gte: workoutData.duration - 5,
              lte: workoutData.duration + 5,
            },
          },
        });

        if (existingWorkout) {
          results.failed.push({
            filename: file.originalname,
            error: 'Workout already exists (duplicate detected)',
          });
          continue;
        }

        // Create the workout
        const workout = await prisma.workout.create({
          data: workoutData,
        });

        // Store telemetry data if available
        if (parsedData.telemetry && parsedData.telemetry.length > 0) {
          await prisma.workoutTelemetry.create({
            data: {
              workoutId: workout.id,
              data: parsedData.telemetry,
            },
          });
        }

        logger.info('FIT file imported', {
          workoutId: workout.id,
          filename: file.originalname,
          type: workout.type,
          duration: workout.duration,
        });

        results.imported.push({
          filename: file.originalname,
          workoutId: workout.id,
          type: workout.type,
          date: workout.date,
          duration: workout.duration,
          distance: workout.distance,
        });
      } catch (fileError) {
        logger.error('FIT file import error', {
          filename: file.originalname,
          error: fileError.message,
        });

        results.failed.push({
          filename: file.originalname,
          error: fileError.message,
        });
      }
    }

    res.json({
      data: {
        imported: results.imported.length,
        failed: results.failed.length,
        results,
      },
    });
  } catch (error) {
    logger.error('FIT import error', { error: error.message, stack: error.stack });
    res.status(500).json({
      error: { message: 'Failed to import FIT files' },
    });
  }
});

/**
 * POST /api/v1/fit/preview
 * Preview a FIT file without importing
 */
router.post('/preview', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: { message: 'No file uploaded' },
      });
    }

    // Validate FIT file format
    const validation = validateFitFile(req.file.buffer);
    if (!validation.valid) {
      return res.status(400).json({
        error: { message: validation.error },
      });
    }

    // Parse the FIT file
    const parsedData = await parseFitFile(req.file.buffer);

    // Return preview data (without telemetry to reduce response size)
    const { telemetry, ...previewData } = parsedData;

    res.json({
      data: {
        filename: req.file.originalname,
        ...previewData,
        hasTelemetry: !!telemetry && telemetry.length > 0,
        telemetryPoints: telemetry?.length || 0,
      },
    });
  } catch (error) {
    logger.error('FIT preview error', { error: error.message, stack: error.stack });
    res.status(400).json({
      error: { message: `Failed to parse FIT file: ${error.message}` },
    });
  }
});

/**
 * GET /api/v1/fit/supported-types
 * Get list of supported workout types that can be imported
 */
router.get('/supported-types', authenticateToken, (req, res) => {
  res.json({
    data: {
      types: [
        { id: 'row', name: 'Rowing (On Water)', fitSports: ['rowing'] },
        { id: 'erg', name: 'Ergometer', fitSports: ['indoor_rowing'] },
        { id: 'run', name: 'Running', fitSports: ['running'] },
        { id: 'bike', name: 'Cycling', fitSports: ['cycling'] },
        { id: 'swim', name: 'Swimming', fitSports: ['swimming'] },
        { id: 'walk', name: 'Walking', fitSports: ['walking'] },
        { id: 'hike', name: 'Hiking', fitSports: ['hiking'] },
        { id: 'strength', name: 'Strength Training', fitSports: ['strength_training'] },
        { id: 'cross_train', name: 'Cross Training', fitSports: ['fitness_equipment', 'training'] },
        { id: 'paddle', name: 'Paddling', fitSports: ['paddling', 'kayaking'] },
      ],
      supportedDevices: [
        'Garmin (all models)',
        'Polar (with FIT export)',
        'Suunto (with FIT export)',
        'Wahoo',
        'Coros',
        'Concept2 PM5 (with FIT export)',
      ],
    },
  });
});

export default router;
