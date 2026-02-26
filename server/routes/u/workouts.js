import express from 'express';
import {
  getUserWorkouts,
  getUserWorkoutById,
  createUserWorkout,
  updateUserWorkout,
  deleteUserWorkout,
} from '../../services/userScopedService.js';
import { ApiError } from '../../middleware/rfc7807.js';

const router = express.Router();

const VALID_SOURCES = ['manual', 'concept2', 'strava', 'garmin'];
const VALID_SORT_BY = ['date', 'distance', 'duration'];
const VALID_SORT_ORDER = ['asc', 'desc'];

router.get('/', async (req, res, next) => {
  try {
    const { source, type, machineType, dateFrom, dateTo, sortBy, sortOrder, cursor, limit, q } =
      req.query;

    // Validate source
    if (source && !VALID_SOURCES.includes(source)) {
      throw new ApiError(
        400,
        'invalid-source',
        `Invalid source: ${source}. Must be one of: ${VALID_SOURCES.join(', ')}`
      );
    }

    // Validate sortBy
    if (sortBy && !VALID_SORT_BY.includes(sortBy)) {
      throw new ApiError(
        400,
        'invalid-sort',
        `Invalid sortBy: ${sortBy}. Must be one of: ${VALID_SORT_BY.join(', ')}`
      );
    }

    // Validate sortOrder
    if (sortOrder && !VALID_SORT_ORDER.includes(sortOrder)) {
      throw new ApiError(
        400,
        'invalid-sort-order',
        `Invalid sortOrder: ${sortOrder}. Must be asc or desc`
      );
    }

    // Validate limit
    const parsedLimit = limit ? parseInt(limit, 10) : 20;
    if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
      throw new ApiError(400, 'invalid-limit', 'Limit must be between 1 and 100');
    }

    // Validate dates
    if (dateFrom && isNaN(Date.parse(dateFrom))) {
      throw new ApiError(400, 'invalid-date', `Invalid dateFrom: ${dateFrom}`);
    }
    if (dateTo && isNaN(Date.parse(dateTo))) {
      throw new ApiError(400, 'invalid-date', `Invalid dateTo: ${dateTo}`);
    }

    const data = await getUserWorkouts(req.user.id, {
      source,
      type,
      machineType,
      dateFrom,
      dateTo,
      sortBy: sortBy || 'date',
      sortOrder: sortOrder || 'desc',
      cursor,
      limit: parsedLimit,
      q,
    });

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// GET /api/u/workouts/:id — Single workout with splits, telemetry, and prev/next IDs
router.get('/:id', async (req, res, next) => {
  try {
    const data = await getUserWorkoutById(req.user.id, req.params.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// POST /api/u/workouts — Create a manual workout
router.post('/', async (req, res, next) => {
  try {
    const data = await createUserWorkout(req.user.id, req.body);
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/u/workouts/:id — Update a user-owned workout
router.patch('/:id', async (req, res, next) => {
  try {
    const data = await updateUserWorkout(req.user.id, req.params.id, req.body);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/u/workouts/:id — Delete a manual-source workout
router.delete('/:id', async (req, res, next) => {
  try {
    const data = await deleteUserWorkout(req.user.id, req.params.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

export default router;
