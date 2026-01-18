# Phase 2: Data Core Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build erg data management, CSV import, Concept2 OAuth integration, workout sync, and athlete dashboard functionality.

**Architecture:** Follow Phase 1 patterns - service layer, v1 routes with auth/team isolation, Zustand stores, React Query integration.

**Reference Files:**
- Service pattern: `server/services/athleteService.js`
- Route pattern: `server/routes/athletes.js`
- Auth middleware: `server/middleware/auth.js`
- Store pattern: `src/store/authStore.js`

---

## Phase 2A: Erg Test Backend

### Task 1: Create Erg Test Service

**Files:**
- Create: `server/services/ergTestService.js`

**Step 1: Create erg test service with CRUD operations**

Create `server/services/ergTestService.js`:

```javascript
import { prisma } from '../db/connection.js';

/**
 * Create a new erg test
 */
export async function createErgTest(teamId, data) {
  const test = await prisma.ergTest.create({
    data: {
      teamId,
      athleteId: data.athleteId,
      testType: data.testType,
      testDate: new Date(data.testDate),
      distanceM: data.distanceM || null,
      timeSeconds: data.timeSeconds,
      splitSeconds: data.splitSeconds || null,
      watts: data.watts || null,
      strokeRate: data.strokeRate || null,
      weightKg: data.weightKg || null,
      notes: data.notes || null,
    },
    include: {
      athlete: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
  });

  return formatErgTest(test);
}

/**
 * Get all erg tests for a team with optional filters
 */
export async function getErgTests(teamId, filters = {}) {
  const where = { teamId };

  if (filters.athleteId) {
    where.athleteId = filters.athleteId;
  }
  if (filters.testType) {
    where.testType = filters.testType;
  }
  if (filters.fromDate) {
    where.testDate = { ...where.testDate, gte: new Date(filters.fromDate) };
  }
  if (filters.toDate) {
    where.testDate = { ...where.testDate, lte: new Date(filters.toDate) };
  }

  const tests = await prisma.ergTest.findMany({
    where,
    include: {
      athlete: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
    orderBy: { testDate: 'desc' },
  });

  return tests.map(formatErgTest);
}

/**
 * Get a single erg test by ID
 */
export async function getErgTestById(teamId, testId) {
  const test = await prisma.ergTest.findFirst({
    where: { id: testId, teamId },
    include: {
      athlete: {
        select: { id: true, firstName: true, lastName: true, side: true },
      },
    },
  });

  if (!test) {
    throw new Error('Erg test not found');
  }

  return formatErgTest(test);
}

/**
 * Update an erg test
 */
export async function updateErgTest(teamId, testId, data) {
  // Verify test exists and belongs to team
  const existing = await prisma.ergTest.findFirst({
    where: { id: testId, teamId },
  });

  if (!existing) {
    throw new Error('Erg test not found');
  }

  const updateData = {};
  const allowedFields = [
    'testType', 'testDate', 'distanceM', 'timeSeconds',
    'splitSeconds', 'watts', 'strokeRate', 'weightKg', 'notes'
  ];

  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      updateData[field] = field === 'testDate' ? new Date(data[field]) : data[field];
    }
  }

  const test = await prisma.ergTest.update({
    where: { id: testId },
    data: updateData,
    include: {
      athlete: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
  });

  return formatErgTest(test);
}

/**
 * Delete an erg test
 */
export async function deleteErgTest(teamId, testId) {
  const existing = await prisma.ergTest.findFirst({
    where: { id: testId, teamId },
  });

  if (!existing) {
    throw new Error('Erg test not found');
  }

  await prisma.ergTest.delete({
    where: { id: testId },
  });

  return { deleted: true };
}

/**
 * Get athlete's test history with personal bests
 */
export async function getAthleteTestHistory(teamId, athleteId) {
  const tests = await prisma.ergTest.findMany({
    where: { teamId, athleteId },
    orderBy: { testDate: 'desc' },
  });

  // Calculate personal bests by test type
  const personalBests = {};
  for (const test of tests) {
    const type = test.testType;
    if (!personalBests[type] || test.timeSeconds < personalBests[type].timeSeconds) {
      personalBests[type] = {
        timeSeconds: test.timeSeconds,
        splitSeconds: test.splitSeconds,
        watts: test.watts,
        date: test.testDate,
      };
    }
  }

  return {
    tests: tests.map(formatErgTest),
    personalBests,
    totalTests: tests.length,
  };
}

/**
 * Get team leaderboard for a specific test type
 */
export async function getTeamLeaderboard(teamId, testType, options = {}) {
  const { limit = 20, gender } = options;

  // Get best test per athlete for the given type
  const tests = await prisma.ergTest.findMany({
    where: { teamId, testType },
    include: {
      athlete: {
        select: { id: true, firstName: true, lastName: true, side: true },
      },
    },
    orderBy: { timeSeconds: 'asc' },
  });

  // Group by athlete, keep best
  const bestByAthlete = new Map();
  for (const test of tests) {
    const existing = bestByAthlete.get(test.athleteId);
    if (!existing || test.timeSeconds < existing.timeSeconds) {
      bestByAthlete.set(test.athleteId, test);
    }
  }

  const leaderboard = Array.from(bestByAthlete.values())
    .sort((a, b) => Number(a.timeSeconds) - Number(b.timeSeconds))
    .slice(0, limit)
    .map((test, index) => ({
      rank: index + 1,
      ...formatErgTest(test),
    }));

  return leaderboard;
}

/**
 * Bulk import erg tests
 */
export async function bulkImportErgTests(teamId, tests) {
  const results = { created: 0, errors: [] };

  for (let i = 0; i < tests.length; i++) {
    const test = tests[i];
    try {
      await createErgTest(teamId, test);
      results.created++;
    } catch (error) {
      results.errors.push({ row: i + 1, error: error.message });
    }
  }

  return results;
}

/**
 * Format erg test for API response
 */
function formatErgTest(test) {
  return {
    id: test.id,
    athleteId: test.athleteId,
    athlete: test.athlete ? {
      id: test.athlete.id,
      name: `${test.athlete.firstName} ${test.athlete.lastName}`,
      firstName: test.athlete.firstName,
      lastName: test.athlete.lastName,
      side: test.athlete.side,
    } : null,
    testType: test.testType,
    testDate: test.testDate,
    distanceM: test.distanceM,
    timeSeconds: Number(test.timeSeconds),
    splitSeconds: test.splitSeconds ? Number(test.splitSeconds) : null,
    watts: test.watts,
    strokeRate: test.strokeRate,
    weightKg: test.weightKg ? Number(test.weightKg) : null,
    notes: test.notes,
    createdAt: test.createdAt,
  };
}
```

**Step 2: Update services index**

Add to `server/services/index.js`:
```javascript
export * from './ergTestService.js';
```

**Step 3: Verify syntax**

```bash
node --check server/services/ergTestService.js
```

Expected: No output (success)

**Step 4: Commit**

```bash
git add server/services/ergTestService.js server/services/index.js
git commit -m "feat: add erg test service with CRUD, leaderboard, bulk import"
```

---

### Task 2: Create Erg Test Routes

**Files:**
- Create: `server/routes/ergTests.js`

**Step 1: Create v1 erg test routes**

Create `server/routes/ergTests.js`:

```javascript
import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import {
  createErgTest,
  getErgTests,
  getErgTestById,
  updateErgTest,
  deleteErgTest,
  getAthleteTestHistory,
  getTeamLeaderboard,
  bulkImportErgTests,
} from '../services/ergTestService.js';
import { authenticateToken, requireRole, teamIsolation } from '../middleware/auth.js';

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
 * GET /api/v1/erg-tests
 * List all erg tests for the team
 */
router.get(
  '/',
  authenticateToken,
  teamIsolation,
  [
    query('athleteId').optional().isUUID(),
    query('testType').optional().isIn(['2k', '6k', '30min', '500m']),
    query('fromDate').optional().isISO8601(),
    query('toDate').optional().isISO8601(),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const tests = await getErgTests(req.user.activeTeamId, req.query);
      res.json({
        success: true,
        data: { tests },
      });
    } catch (error) {
      console.error('Get erg tests error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to get erg tests' },
      });
    }
  }
);

/**
 * GET /api/v1/erg-tests/leaderboard
 * Get team leaderboard for a test type
 */
router.get(
  '/leaderboard',
  authenticateToken,
  teamIsolation,
  [
    query('testType').isIn(['2k', '6k', '30min', '500m']),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { testType, limit } = req.query;
      const leaderboard = await getTeamLeaderboard(
        req.user.activeTeamId,
        testType,
        { limit: limit ? parseInt(limit) : 20 }
      );
      res.json({
        success: true,
        data: { leaderboard },
      });
    } catch (error) {
      console.error('Get leaderboard error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to get leaderboard' },
      });
    }
  }
);

/**
 * GET /api/v1/erg-tests/athlete/:athleteId/history
 * Get test history for an athlete
 */
router.get(
  '/athlete/:athleteId/history',
  authenticateToken,
  teamIsolation,
  [param('athleteId').isUUID()],
  validateRequest,
  async (req, res) => {
    try {
      const history = await getAthleteTestHistory(
        req.user.activeTeamId,
        req.params.athleteId
      );
      res.json({
        success: true,
        data: history,
      });
    } catch (error) {
      console.error('Get athlete history error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to get athlete history' },
      });
    }
  }
);

/**
 * GET /api/v1/erg-tests/:id
 * Get single erg test
 */
router.get(
  '/:id',
  authenticateToken,
  teamIsolation,
  [param('id').isUUID()],
  validateRequest,
  async (req, res) => {
    try {
      const test = await getErgTestById(req.user.activeTeamId, req.params.id);
      res.json({
        success: true,
        data: { test },
      });
    } catch (error) {
      if (error.message === 'Erg test not found') {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: error.message },
        });
      }
      console.error('Get erg test error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to get erg test' },
      });
    }
  }
);

/**
 * POST /api/v1/erg-tests
 * Create new erg test
 */
router.post(
  '/',
  authenticateToken,
  teamIsolation,
  requireRole('OWNER', 'COACH'),
  [
    body('athleteId').isUUID(),
    body('testType').isIn(['2k', '6k', '30min', '500m']),
    body('testDate').isISO8601(),
    body('timeSeconds').isFloat({ min: 0 }),
    body('distanceM').optional().isInt({ min: 0 }),
    body('splitSeconds').optional().isFloat({ min: 0 }),
    body('watts').optional().isInt({ min: 0 }),
    body('strokeRate').optional().isInt({ min: 10, max: 60 }),
    body('weightKg').optional().isFloat({ min: 30, max: 150 }),
    body('notes').optional().trim().isLength({ max: 500 }),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const test = await createErgTest(req.user.activeTeamId, req.body);
      res.status(201).json({
        success: true,
        data: { test },
      });
    } catch (error) {
      console.error('Create erg test error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to create erg test' },
      });
    }
  }
);

/**
 * POST /api/v1/erg-tests/bulk-import
 * Bulk import erg tests
 */
router.post(
  '/bulk-import',
  authenticateToken,
  teamIsolation,
  requireRole('OWNER', 'COACH'),
  [
    body('tests').isArray({ min: 1, max: 500 }),
    body('tests.*.athleteId').isUUID(),
    body('tests.*.testType').isIn(['2k', '6k', '30min', '500m']),
    body('tests.*.testDate').isISO8601(),
    body('tests.*.timeSeconds').isFloat({ min: 0 }),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const result = await bulkImportErgTests(req.user.activeTeamId, req.body.tests);
      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('Bulk import error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to import erg tests' },
      });
    }
  }
);

/**
 * PATCH /api/v1/erg-tests/:id
 * Update erg test
 */
router.patch(
  '/:id',
  authenticateToken,
  teamIsolation,
  requireRole('OWNER', 'COACH'),
  [
    param('id').isUUID(),
    body('testType').optional().isIn(['2k', '6k', '30min', '500m']),
    body('testDate').optional().isISO8601(),
    body('timeSeconds').optional().isFloat({ min: 0 }),
    body('distanceM').optional().isInt({ min: 0 }),
    body('splitSeconds').optional().isFloat({ min: 0 }),
    body('watts').optional().isInt({ min: 0 }),
    body('strokeRate').optional().isInt({ min: 10, max: 60 }),
    body('weightKg').optional().isFloat({ min: 30, max: 150 }),
    body('notes').optional().trim().isLength({ max: 500 }),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const test = await updateErgTest(req.user.activeTeamId, req.params.id, req.body);
      res.json({
        success: true,
        data: { test },
      });
    } catch (error) {
      if (error.message === 'Erg test not found') {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: error.message },
        });
      }
      console.error('Update erg test error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to update erg test' },
      });
    }
  }
);

/**
 * DELETE /api/v1/erg-tests/:id
 * Delete erg test
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
      await deleteErgTest(req.user.activeTeamId, req.params.id);
      res.json({
        success: true,
        data: { message: 'Erg test deleted' },
      });
    } catch (error) {
      if (error.message === 'Erg test not found') {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: error.message },
        });
      }
      console.error('Delete erg test error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to delete erg test' },
      });
    }
  }
);

export default router;
```

**Step 2: Register routes in server/index.js**

Add import near other route imports:
```javascript
import ergTestRoutes from './routes/ergTests.js';
```

Add route mounting after other v1 routes:
```javascript
app.use('/api/v1/erg-tests', ergTestRoutes);
```

**Step 3: Verify syntax**

```bash
node --check server/routes/ergTests.js
```

**Step 4: Commit**

```bash
git add server/routes/ergTests.js server/index.js
git commit -m "feat: add v1 erg test routes with CRUD, leaderboard, bulk import"
```

---

### Task 3: Create Workout Service

**Files:**
- Create: `server/services/workoutService.js`

**Step 1: Create workout service**

Create `server/services/workoutService.js`:

```javascript
import { prisma } from '../db/connection.js';

/**
 * Create a new workout
 */
export async function createWorkout(teamId, data) {
  const workout = await prisma.workout.create({
    data: {
      teamId,
      athleteId: data.athleteId,
      source: data.source || 'manual',
      c2LogbookId: data.c2LogbookId || null,
      date: new Date(data.date),
      distanceM: data.distanceM || null,
      durationSeconds: data.durationSeconds || null,
      strokeRate: data.strokeRate || null,
      calories: data.calories || null,
      dragFactor: data.dragFactor || null,
      deviceInfo: data.deviceInfo || null,
      rawData: data.rawData || null,
    },
    include: {
      athlete: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
  });

  return formatWorkout(workout);
}

/**
 * Get all workouts for a team with filters
 */
export async function getWorkouts(teamId, filters = {}) {
  const where = { teamId };

  if (filters.athleteId) {
    where.athleteId = filters.athleteId;
  }
  if (filters.source) {
    where.source = filters.source;
  }
  if (filters.fromDate) {
    where.date = { ...where.date, gte: new Date(filters.fromDate) };
  }
  if (filters.toDate) {
    where.date = { ...where.date, lte: new Date(filters.toDate) };
  }

  const workouts = await prisma.workout.findMany({
    where,
    include: {
      athlete: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
    orderBy: { date: 'desc' },
    take: filters.limit ? parseInt(filters.limit) : 100,
  });

  return workouts.map(formatWorkout);
}

/**
 * Get a single workout by ID
 */
export async function getWorkoutById(teamId, workoutId) {
  const workout = await prisma.workout.findFirst({
    where: { id: workoutId, teamId },
    include: {
      athlete: {
        select: { id: true, firstName: true, lastName: true },
      },
      telemetry: true,
    },
  });

  if (!workout) {
    throw new Error('Workout not found');
  }

  return formatWorkout(workout);
}

/**
 * Update a workout
 */
export async function updateWorkout(teamId, workoutId, data) {
  const existing = await prisma.workout.findFirst({
    where: { id: workoutId, teamId },
  });

  if (!existing) {
    throw new Error('Workout not found');
  }

  const updateData = {};
  const allowedFields = [
    'date', 'distanceM', 'durationSeconds', 'strokeRate',
    'calories', 'dragFactor', 'deviceInfo'
  ];

  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      updateData[field] = field === 'date' ? new Date(data[field]) : data[field];
    }
  }

  const workout = await prisma.workout.update({
    where: { id: workoutId },
    data: updateData,
    include: {
      athlete: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
  });

  return formatWorkout(workout);
}

/**
 * Delete a workout
 */
export async function deleteWorkout(teamId, workoutId) {
  const existing = await prisma.workout.findFirst({
    where: { id: workoutId, teamId },
  });

  if (!existing) {
    throw new Error('Workout not found');
  }

  await prisma.workout.delete({
    where: { id: workoutId },
  });

  return { deleted: true };
}

/**
 * Get athlete's workout summary
 */
export async function getAthleteWorkoutSummary(teamId, athleteId, days = 30) {
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - days);

  const workouts = await prisma.workout.findMany({
    where: {
      teamId,
      athleteId,
      date: { gte: fromDate },
    },
    orderBy: { date: 'desc' },
  });

  const summary = {
    totalWorkouts: workouts.length,
    totalDistance: workouts.reduce((sum, w) => sum + (w.distanceM || 0), 0),
    totalDuration: workouts.reduce((sum, w) => sum + (Number(w.durationSeconds) || 0), 0),
    averageStrokeRate: 0,
    bySource: {},
  };

  const strokeRates = workouts.filter(w => w.strokeRate).map(w => w.strokeRate);
  if (strokeRates.length > 0) {
    summary.averageStrokeRate = Math.round(
      strokeRates.reduce((a, b) => a + b, 0) / strokeRates.length
    );
  }

  for (const workout of workouts) {
    summary.bySource[workout.source] = (summary.bySource[workout.source] || 0) + 1;
  }

  return summary;
}

/**
 * Check if C2 logbook ID already exists (prevent duplicates)
 */
export async function c2LogbookIdExists(teamId, c2LogbookId) {
  const existing = await prisma.workout.findFirst({
    where: { teamId, c2LogbookId },
  });
  return !!existing;
}

/**
 * Bulk create workouts (for C2 sync)
 */
export async function bulkCreateWorkouts(teamId, workouts) {
  const results = { created: 0, skipped: 0, errors: [] };

  for (const workout of workouts) {
    try {
      // Skip if C2 logbook ID already exists
      if (workout.c2LogbookId) {
        const exists = await c2LogbookIdExists(teamId, workout.c2LogbookId);
        if (exists) {
          results.skipped++;
          continue;
        }
      }

      await createWorkout(teamId, workout);
      results.created++;
    } catch (error) {
      results.errors.push({ c2LogbookId: workout.c2LogbookId, error: error.message });
    }
  }

  return results;
}

/**
 * Format workout for API response
 */
function formatWorkout(workout) {
  return {
    id: workout.id,
    athleteId: workout.athleteId,
    athlete: workout.athlete ? {
      id: workout.athlete.id,
      name: `${workout.athlete.firstName} ${workout.athlete.lastName}`,
    } : null,
    source: workout.source,
    c2LogbookId: workout.c2LogbookId,
    date: workout.date,
    distanceM: workout.distanceM,
    durationSeconds: workout.durationSeconds ? Number(workout.durationSeconds) : null,
    strokeRate: workout.strokeRate,
    calories: workout.calories,
    dragFactor: workout.dragFactor,
    deviceInfo: workout.deviceInfo,
    telemetry: workout.telemetry || null,
    createdAt: workout.createdAt,
  };
}
```

**Step 2: Update services index**

Add to `server/services/index.js`:
```javascript
export * from './workoutService.js';
```

**Step 3: Verify syntax**

```bash
node --check server/services/workoutService.js
```

**Step 4: Commit**

```bash
git add server/services/workoutService.js server/services/index.js
git commit -m "feat: add workout service with CRUD, summary, bulk create"
```

---

## Phase 2B: Workout Routes & CSV Import

### Task 4: Create Workout Routes

**Files:**
- Create: `server/routes/workouts.js`

**Step 1: Create v1 workout routes**

Create `server/routes/workouts.js`:

```javascript
import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import {
  createWorkout,
  getWorkouts,
  getWorkoutById,
  updateWorkout,
  deleteWorkout,
  getAthleteWorkoutSummary,
} from '../services/workoutService.js';
import { authenticateToken, requireRole, teamIsolation } from '../middleware/auth.js';

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
 * GET /api/v1/workouts
 * List workouts with filters
 */
router.get(
  '/',
  authenticateToken,
  teamIsolation,
  [
    query('athleteId').optional().isUUID(),
    query('source').optional().isIn(['manual', 'concept2_sync', 'csv_import', 'bluetooth']),
    query('fromDate').optional().isISO8601(),
    query('toDate').optional().isISO8601(),
    query('limit').optional().isInt({ min: 1, max: 500 }),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const workouts = await getWorkouts(req.user.activeTeamId, req.query);
      res.json({
        success: true,
        data: { workouts },
      });
    } catch (error) {
      console.error('Get workouts error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to get workouts' },
      });
    }
  }
);

/**
 * GET /api/v1/workouts/athlete/:athleteId/summary
 * Get athlete workout summary
 */
router.get(
  '/athlete/:athleteId/summary',
  authenticateToken,
  teamIsolation,
  [
    param('athleteId').isUUID(),
    query('days').optional().isInt({ min: 1, max: 365 }),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const summary = await getAthleteWorkoutSummary(
        req.user.activeTeamId,
        req.params.athleteId,
        req.query.days ? parseInt(req.query.days) : 30
      );
      res.json({
        success: true,
        data: { summary },
      });
    } catch (error) {
      console.error('Get workout summary error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to get workout summary' },
      });
    }
  }
);

/**
 * GET /api/v1/workouts/:id
 * Get single workout
 */
router.get(
  '/:id',
  authenticateToken,
  teamIsolation,
  [param('id').isUUID()],
  validateRequest,
  async (req, res) => {
    try {
      const workout = await getWorkoutById(req.user.activeTeamId, req.params.id);
      res.json({
        success: true,
        data: { workout },
      });
    } catch (error) {
      if (error.message === 'Workout not found') {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: error.message },
        });
      }
      console.error('Get workout error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to get workout' },
      });
    }
  }
);

/**
 * POST /api/v1/workouts
 * Create manual workout
 */
router.post(
  '/',
  authenticateToken,
  teamIsolation,
  requireRole('OWNER', 'COACH'),
  [
    body('athleteId').isUUID(),
    body('date').isISO8601(),
    body('distanceM').optional().isInt({ min: 0 }),
    body('durationSeconds').optional().isFloat({ min: 0 }),
    body('strokeRate').optional().isInt({ min: 10, max: 60 }),
    body('calories').optional().isInt({ min: 0 }),
    body('dragFactor').optional().isInt({ min: 50, max: 250 }),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const workout = await createWorkout(req.user.activeTeamId, {
        ...req.body,
        source: 'manual',
      });
      res.status(201).json({
        success: true,
        data: { workout },
      });
    } catch (error) {
      console.error('Create workout error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to create workout' },
      });
    }
  }
);

/**
 * PATCH /api/v1/workouts/:id
 * Update workout
 */
router.patch(
  '/:id',
  authenticateToken,
  teamIsolation,
  requireRole('OWNER', 'COACH'),
  [
    param('id').isUUID(),
    body('date').optional().isISO8601(),
    body('distanceM').optional().isInt({ min: 0 }),
    body('durationSeconds').optional().isFloat({ min: 0 }),
    body('strokeRate').optional().isInt({ min: 10, max: 60 }),
    body('calories').optional().isInt({ min: 0 }),
    body('dragFactor').optional().isInt({ min: 50, max: 250 }),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const workout = await updateWorkout(req.user.activeTeamId, req.params.id, req.body);
      res.json({
        success: true,
        data: { workout },
      });
    } catch (error) {
      if (error.message === 'Workout not found') {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: error.message },
        });
      }
      console.error('Update workout error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to update workout' },
      });
    }
  }
);

/**
 * DELETE /api/v1/workouts/:id
 * Delete workout
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
      await deleteWorkout(req.user.activeTeamId, req.params.id);
      res.json({
        success: true,
        data: { message: 'Workout deleted' },
      });
    } catch (error) {
      if (error.message === 'Workout not found') {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: error.message },
        });
      }
      console.error('Delete workout error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to delete workout' },
      });
    }
  }
);

export default router;
```

**Step 2: Register routes in server/index.js**

Add import:
```javascript
import workoutRoutes from './routes/workouts.js';
```

Add route mounting:
```javascript
app.use('/api/v1/workouts', workoutRoutes);
```

**Step 3: Verify and commit**

```bash
node --check server/routes/workouts.js
git add server/routes/workouts.js server/index.js
git commit -m "feat: add v1 workout routes with CRUD and athlete summary"
```

---

### Task 5: Create CSV Import Service

**Files:**
- Create: `server/services/csvImportService.js`

**Step 1: Create CSV import service**

Create `server/services/csvImportService.js`:

```javascript
import { parse } from 'csv-parse/sync';
import { prisma } from '../db/connection.js';
import { createErgTest } from './ergTestService.js';

/**
 * Parse CSV content and return rows
 */
export function parseCSV(content, options = {}) {
  const { delimiter = ',', hasHeaders = true } = options;

  const records = parse(content, {
    delimiter,
    columns: hasHeaders,
    skip_empty_lines: true,
    trim: true,
  });

  return records;
}

/**
 * Detect column mapping from CSV headers
 */
export function detectColumnMapping(headers) {
  const mapping = {};
  const patterns = {
    athlete: /^(athlete|name|rower|first\s*name)$/i,
    lastName: /^(last\s*name|surname|family\s*name)$/i,
    firstName: /^(first\s*name|given\s*name)$/i,
    testType: /^(test\s*type|type|event|distance)$/i,
    date: /^(date|test\s*date|when)$/i,
    time: /^(time|result|finish|total\s*time)$/i,
    split: /^(split|pace|500m|avg\s*split)$/i,
    watts: /^(watts|power|avg\s*watts|average\s*watts)$/i,
    strokeRate: /^(stroke\s*rate|spm|rate|s\/m)$/i,
    weight: /^(weight|body\s*weight|kg|mass)$/i,
    notes: /^(notes|comments|memo)$/i,
  };

  for (const header of headers) {
    for (const [field, pattern] of Object.entries(patterns)) {
      if (pattern.test(header)) {
        mapping[field] = header;
        break;
      }
    }
  }

  return mapping;
}

/**
 * Parse time string to seconds (handles MM:SS.s, H:MM:SS.s, SS.s)
 */
export function parseTimeToSeconds(timeStr) {
  if (!timeStr) return null;

  const str = String(timeStr).trim();

  // Already a number (seconds)
  if (/^\d+\.?\d*$/.test(str)) {
    return parseFloat(str);
  }

  // MM:SS.s or H:MM:SS.s
  const parts = str.split(':');
  if (parts.length === 2) {
    // MM:SS.s
    const [minutes, seconds] = parts;
    return parseInt(minutes) * 60 + parseFloat(seconds);
  } else if (parts.length === 3) {
    // H:MM:SS.s
    const [hours, minutes, seconds] = parts;
    return parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseFloat(seconds);
  }

  return null;
}

/**
 * Parse test type from various formats
 */
export function parseTestType(value) {
  if (!value) return null;

  const str = String(value).toLowerCase().trim();

  if (str.includes('2k') || str.includes('2000')) return '2k';
  if (str.includes('6k') || str.includes('6000')) return '6k';
  if (str.includes('30') && str.includes('min')) return '30min';
  if (str.includes('500') || str.includes('0.5k')) return '500m';

  return null;
}

/**
 * Match athlete name to team athletes
 */
export async function matchAthlete(teamId, name, firstName, lastName) {
  // If we have separate first/last names
  if (firstName && lastName) {
    const athlete = await prisma.athlete.findFirst({
      where: {
        teamId,
        firstName: { equals: firstName, mode: 'insensitive' },
        lastName: { equals: lastName, mode: 'insensitive' },
      },
    });
    if (athlete) return athlete;
  }

  // Try to parse full name
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      const first = parts[0];
      const last = parts.slice(1).join(' ');

      const athlete = await prisma.athlete.findFirst({
        where: {
          teamId,
          firstName: { equals: first, mode: 'insensitive' },
          lastName: { equals: last, mode: 'insensitive' },
        },
      });
      if (athlete) return athlete;

      // Try last name first
      const lastFirst = parts[parts.length - 1];
      const firstLast = parts.slice(0, -1).join(' ');

      const athlete2 = await prisma.athlete.findFirst({
        where: {
          teamId,
          firstName: { equals: firstLast, mode: 'insensitive' },
          lastName: { equals: lastFirst, mode: 'insensitive' },
        },
      });
      if (athlete2) return athlete2;
    }
  }

  return null;
}

/**
 * Validate and transform CSV row to erg test data
 */
export async function validateRow(teamId, row, mapping) {
  const errors = [];
  const data = {};

  // Find athlete
  const athleteName = row[mapping.athlete] || '';
  const firstName = row[mapping.firstName] || '';
  const lastName = row[mapping.lastName] || '';

  const athlete = await matchAthlete(teamId, athleteName, firstName, lastName);
  if (!athlete) {
    errors.push(`Athlete not found: ${athleteName || `${firstName} ${lastName}`}`);
  } else {
    data.athleteId = athlete.id;
  }

  // Parse test type
  const testType = parseTestType(row[mapping.testType]);
  if (!testType) {
    errors.push(`Invalid test type: ${row[mapping.testType]}`);
  } else {
    data.testType = testType;
  }

  // Parse date
  const dateStr = row[mapping.date];
  if (dateStr) {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      errors.push(`Invalid date: ${dateStr}`);
    } else {
      data.testDate = date.toISOString();
    }
  } else {
    errors.push('Missing date');
  }

  // Parse time
  const timeSeconds = parseTimeToSeconds(row[mapping.time]);
  if (timeSeconds === null) {
    errors.push(`Invalid time: ${row[mapping.time]}`);
  } else {
    data.timeSeconds = timeSeconds;
  }

  // Optional fields
  if (mapping.split && row[mapping.split]) {
    data.splitSeconds = parseTimeToSeconds(row[mapping.split]);
  }
  if (mapping.watts && row[mapping.watts]) {
    data.watts = parseInt(row[mapping.watts]) || null;
  }
  if (mapping.strokeRate && row[mapping.strokeRate]) {
    data.strokeRate = parseInt(row[mapping.strokeRate]) || null;
  }
  if (mapping.weight && row[mapping.weight]) {
    data.weightKg = parseFloat(row[mapping.weight]) || null;
  }
  if (mapping.notes && row[mapping.notes]) {
    data.notes = row[mapping.notes];
  }

  return { data, errors };
}

/**
 * Preview CSV import (validate without saving)
 */
export async function previewCSVImport(teamId, content, options = {}) {
  const rows = parseCSV(content, options);
  if (rows.length === 0) {
    return { valid: [], invalid: [], headers: [] };
  }

  const headers = Object.keys(rows[0]);
  const mapping = options.mapping || detectColumnMapping(headers);

  const valid = [];
  const invalid = [];

  for (let i = 0; i < rows.length; i++) {
    const { data, errors } = await validateRow(teamId, rows[i], mapping);

    if (errors.length === 0) {
      valid.push({ row: i + 1, data });
    } else {
      invalid.push({ row: i + 1, errors, original: rows[i] });
    }
  }

  return { valid, invalid, headers, mapping, totalRows: rows.length };
}

/**
 * Execute CSV import (save valid rows)
 */
export async function executeCSVImport(teamId, validRows) {
  const results = { created: 0, errors: [] };

  for (const item of validRows) {
    try {
      await createErgTest(teamId, item.data);
      results.created++;
    } catch (error) {
      results.errors.push({ row: item.row, error: error.message });
    }
  }

  return results;
}
```

**Step 2: Install csv-parse if not present**

```bash
npm install csv-parse
```

**Step 3: Update services index**

Add to `server/services/index.js`:
```javascript
export * from './csvImportService.js';
```

**Step 4: Verify and commit**

```bash
node --check server/services/csvImportService.js
git add server/services/csvImportService.js server/services/index.js package.json package-lock.json
git commit -m "feat: add CSV import service with parsing, validation, athlete matching"
```

---

### Task 6: Create CSV Import Routes

**Files:**
- Create: `server/routes/import.js`

**Step 1: Create import routes**

Create `server/routes/import.js`:

```javascript
import express from 'express';
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
      error: { code: 'VALIDATION_ERROR', details: errors.array() },
    });
  }
  next();
};

/**
 * POST /api/v1/import/csv/preview
 * Preview CSV import (validate without saving)
 */
router.post(
  '/csv/preview',
  authenticateToken,
  teamIsolation,
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
      console.error('CSV preview error:', error);
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
  authenticateToken,
  teamIsolation,
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
      console.error('CSV execute error:', error);
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
  authenticateToken,
  teamIsolation,
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
      console.error('Detect mapping error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: error.message || 'Failed to detect mapping' },
      });
    }
  }
);

export default router;
```

**Step 2: Install multer if not present**

```bash
npm install multer
```

**Step 3: Register routes in server/index.js**

Add import:
```javascript
import importRoutes from './routes/import.js';
```

Add route mounting:
```javascript
app.use('/api/v1/import', importRoutes);
```

**Step 4: Verify and commit**

```bash
node --check server/routes/import.js
git add server/routes/import.js server/index.js package.json package-lock.json
git commit -m "feat: add CSV import routes with preview and execute endpoints"
```

---

## Phase 2C: Concept2 OAuth Integration

### Task 7: Create Concept2 Service

**Files:**
- Create: `server/services/concept2Service.js`

**Step 1: Create Concept2 OAuth service**

Create `server/services/concept2Service.js`:

```javascript
import crypto from 'crypto';
import { prisma } from '../db/connection.js';
import { bulkCreateWorkouts } from './workoutService.js';

const C2_AUTH_URL = 'https://log.concept2.com/oauth/authorize';
const C2_TOKEN_URL = 'https://log.concept2.com/oauth/access_token';
const C2_API_URL = 'https://log.concept2.com/api';

/**
 * Generate OAuth authorization URL
 */
export function getAuthorizationUrl(athleteId, redirectUri) {
  const state = crypto.randomBytes(16).toString('hex');

  // Store state temporarily (in production, use Redis or DB)
  // For now, encode athleteId in state
  const stateData = Buffer.from(JSON.stringify({ athleteId, nonce: state })).toString('base64url');

  const params = new URLSearchParams({
    client_id: process.env.CONCEPT2_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'user:read results:read',
    state: stateData,
  });

  return `${C2_AUTH_URL}?${params.toString()}`;
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(code, redirectUri) {
  const response = await fetch(C2_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: process.env.CONCEPT2_CLIENT_ID,
      client_secret: process.env.CONCEPT2_CLIENT_SECRET,
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed: ${error}`);
  }

  const data = await response.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
  };
}

/**
 * Refresh access token
 */
export async function refreshAccessToken(refreshToken) {
  const response = await fetch(C2_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: process.env.CONCEPT2_CLIENT_ID,
      client_secret: process.env.CONCEPT2_CLIENT_SECRET,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    throw new Error('Token refresh failed');
  }

  const data = await response.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || refreshToken,
    expiresIn: data.expires_in,
  };
}

/**
 * Store OAuth tokens for an athlete
 */
export async function storeTokens(athleteId, c2UserId, tokens) {
  const expiresAt = new Date();
  expiresAt.setSeconds(expiresAt.getSeconds() + tokens.expiresIn);

  await prisma.concept2Auth.upsert({
    where: { athleteId },
    update: {
      c2UserId,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      tokenExpiresAt: expiresAt,
    },
    create: {
      athleteId,
      c2UserId,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      tokenExpiresAt: expiresAt,
    },
  });
}

/**
 * Get valid access token (refresh if needed)
 */
export async function getValidToken(athleteId) {
  const auth = await prisma.concept2Auth.findUnique({
    where: { athleteId },
  });

  if (!auth) {
    throw new Error('No Concept2 connection');
  }

  // Check if token is expired (with 5 min buffer)
  const now = new Date();
  const expiresAt = new Date(auth.tokenExpiresAt);
  expiresAt.setMinutes(expiresAt.getMinutes() - 5);

  if (now > expiresAt) {
    // Refresh the token
    const newTokens = await refreshAccessToken(auth.refreshToken);
    await storeTokens(athleteId, auth.c2UserId, newTokens);
    return newTokens.accessToken;
  }

  return auth.accessToken;
}

/**
 * Get Concept2 user profile
 */
export async function getC2UserProfile(accessToken) {
  const response = await fetch(`${C2_API_URL}/users/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to get C2 user profile');
  }

  const data = await response.json();
  return data.data;
}

/**
 * Fetch workouts from Concept2 API
 */
export async function fetchC2Workouts(accessToken, fromDate = null) {
  const params = new URLSearchParams({
    type: 'rower',
  });

  if (fromDate) {
    params.append('from', fromDate.toISOString().split('T')[0]);
  }

  const response = await fetch(`${C2_API_URL}/users/me/results?${params}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch C2 workouts');
  }

  const data = await response.json();
  return data.data || [];
}

/**
 * Convert C2 workout to our format
 */
function convertC2Workout(c2Workout, athleteId) {
  return {
    athleteId,
    source: 'concept2_sync',
    c2LogbookId: String(c2Workout.id),
    date: c2Workout.date,
    distanceM: c2Workout.distance,
    durationSeconds: c2Workout.time ? c2Workout.time / 10 : null, // C2 stores in 0.1s
    strokeRate: c2Workout.stroke_rate,
    calories: c2Workout.calories_total,
    dragFactor: c2Workout.drag_factor,
    rawData: c2Workout,
  };
}

/**
 * Sync workouts for an athlete
 */
export async function syncAthleteWorkouts(athleteId, teamId) {
  const auth = await prisma.concept2Auth.findUnique({
    where: { athleteId },
    include: { athlete: true },
  });

  if (!auth) {
    throw new Error('No Concept2 connection');
  }

  // Verify athlete belongs to team
  if (auth.athlete.teamId !== teamId) {
    throw new Error('Athlete not in team');
  }

  const accessToken = await getValidToken(athleteId);

  // Fetch workouts since last sync (or last 30 days)
  const fromDate = auth.lastSyncedAt || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const c2Workouts = await fetchC2Workouts(accessToken, fromDate);

  // Convert and import
  const workouts = c2Workouts.map(w => convertC2Workout(w, athleteId));
  const result = await bulkCreateWorkouts(teamId, workouts);

  // Update last synced timestamp
  await prisma.concept2Auth.update({
    where: { athleteId },
    data: { lastSyncedAt: new Date() },
  });

  return {
    ...result,
    totalFetched: c2Workouts.length,
  };
}

/**
 * Disconnect Concept2 account
 */
export async function disconnectC2(athleteId, teamId) {
  const auth = await prisma.concept2Auth.findUnique({
    where: { athleteId },
    include: { athlete: true },
  });

  if (!auth) {
    throw new Error('No Concept2 connection');
  }

  if (auth.athlete.teamId !== teamId) {
    throw new Error('Athlete not in team');
  }

  await prisma.concept2Auth.delete({
    where: { athleteId },
  });

  return { disconnected: true };
}

/**
 * Get Concept2 connection status for an athlete
 */
export async function getC2Status(athleteId) {
  const auth = await prisma.concept2Auth.findUnique({
    where: { athleteId },
  });

  if (!auth) {
    return { connected: false };
  }

  return {
    connected: true,
    c2UserId: auth.c2UserId,
    lastSyncedAt: auth.lastSyncedAt,
  };
}

/**
 * Parse OAuth state parameter
 */
export function parseState(state) {
  try {
    const decoded = Buffer.from(state, 'base64url').toString();
    return JSON.parse(decoded);
  } catch {
    throw new Error('Invalid state parameter');
  }
}
```

**Step 2: Add environment variables to .env.example**

Add to `.env.example`:
```
# Concept2 OAuth
CONCEPT2_CLIENT_ID=your_client_id
CONCEPT2_CLIENT_SECRET=your_client_secret
CONCEPT2_REDIRECT_URI=http://localhost:3001/api/v1/concept2/callback
```

**Step 3: Update services index**

Add to `server/services/index.js`:
```javascript
export * from './concept2Service.js';
```

**Step 4: Verify and commit**

```bash
node --check server/services/concept2Service.js
git add server/services/concept2Service.js server/services/index.js .env.example
git commit -m "feat: add Concept2 OAuth service with token management and sync"
```

---

### Task 8: Create Concept2 Routes

**Files:**
- Create: `server/routes/concept2.js`

**Step 1: Create Concept2 OAuth routes**

Create `server/routes/concept2.js`:

```javascript
import express from 'express';
import { param, validationResult } from 'express-validator';
import {
  getAuthorizationUrl,
  exchangeCodeForTokens,
  storeTokens,
  getC2UserProfile,
  syncAthleteWorkouts,
  disconnectC2,
  getC2Status,
  parseState,
} from '../services/concept2Service.js';
import { authenticateToken, requireRole, teamIsolation } from '../middleware/auth.js';

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
 * GET /api/v1/concept2/auth-url/:athleteId
 * Get OAuth authorization URL for an athlete
 */
router.get(
  '/auth-url/:athleteId',
  authenticateToken,
  teamIsolation,
  [param('athleteId').isUUID()],
  validateRequest,
  async (req, res) => {
    try {
      const redirectUri = process.env.CONCEPT2_REDIRECT_URI ||
        `${req.protocol}://${req.get('host')}/api/v1/concept2/callback`;

      const url = getAuthorizationUrl(req.params.athleteId, redirectUri);

      res.json({
        success: true,
        data: { url },
      });
    } catch (error) {
      console.error('Get auth URL error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to generate auth URL' },
      });
    }
  }
);

/**
 * GET /api/v1/concept2/callback
 * OAuth callback handler
 */
router.get('/callback', async (req, res) => {
  try {
    const { code, state, error } = req.query;

    if (error) {
      // Redirect to frontend with error
      return res.redirect(`/settings/integrations?error=${encodeURIComponent(error)}`);
    }

    if (!code || !state) {
      return res.redirect('/settings/integrations?error=missing_params');
    }

    // Parse state to get athleteId
    const { athleteId } = parseState(state);

    const redirectUri = process.env.CONCEPT2_REDIRECT_URI ||
      `${req.protocol}://${req.get('host')}/api/v1/concept2/callback`;

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code, redirectUri);

    // Get C2 user profile
    const profile = await getC2UserProfile(tokens.accessToken);

    // Store tokens
    await storeTokens(athleteId, String(profile.id), tokens);

    // Redirect to frontend with success
    res.redirect(`/settings/integrations?c2_connected=true`);
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.redirect(`/settings/integrations?error=${encodeURIComponent(error.message)}`);
  }
});

/**
 * GET /api/v1/concept2/status/:athleteId
 * Get connection status for an athlete
 */
router.get(
  '/status/:athleteId',
  authenticateToken,
  teamIsolation,
  [param('athleteId').isUUID()],
  validateRequest,
  async (req, res) => {
    try {
      const status = await getC2Status(req.params.athleteId);
      res.json({
        success: true,
        data: status,
      });
    } catch (error) {
      console.error('Get status error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to get status' },
      });
    }
  }
);

/**
 * POST /api/v1/concept2/sync/:athleteId
 * Sync workouts for an athlete
 */
router.post(
  '/sync/:athleteId',
  authenticateToken,
  teamIsolation,
  requireRole('OWNER', 'COACH'),
  [param('athleteId').isUUID()],
  validateRequest,
  async (req, res) => {
    try {
      const result = await syncAthleteWorkouts(
        req.params.athleteId,
        req.user.activeTeamId
      );
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error.message === 'No Concept2 connection') {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_CONNECTED', message: error.message },
        });
      }
      console.error('Sync error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to sync workouts' },
      });
    }
  }
);

/**
 * DELETE /api/v1/concept2/disconnect/:athleteId
 * Disconnect Concept2 account
 */
router.delete(
  '/disconnect/:athleteId',
  authenticateToken,
  teamIsolation,
  requireRole('OWNER', 'COACH'),
  [param('athleteId').isUUID()],
  validateRequest,
  async (req, res) => {
    try {
      await disconnectC2(req.params.athleteId, req.user.activeTeamId);
      res.json({
        success: true,
        data: { message: 'Concept2 disconnected' },
      });
    } catch (error) {
      if (error.message === 'No Concept2 connection') {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_CONNECTED', message: error.message },
        });
      }
      console.error('Disconnect error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to disconnect' },
      });
    }
  }
);

export default router;
```

**Step 2: Register routes in server/index.js**

Add import:
```javascript
import concept2Routes from './routes/concept2.js';
```

Add route mounting:
```javascript
app.use('/api/v1/concept2', concept2Routes);
```

**Step 3: Verify and commit**

```bash
node --check server/routes/concept2.js
git add server/routes/concept2.js server/index.js
git commit -m "feat: add Concept2 OAuth routes with callback, sync, disconnect"
```

---

## Phase 2D: Frontend Integration

### Task 9: Create Erg Data Store

**Files:**
- Create: `src/store/ergDataStore.js`

**Step 1: Create Zustand store for erg data**

Create `src/store/ergDataStore.js`:

```javascript
import { create } from 'zustand';
import { useAuthStore } from './authStore';

export const useErgDataStore = create((set, get) => ({
  // State
  ergTests: [],
  workouts: [],
  leaderboard: [],
  loading: false,
  error: null,
  filters: {
    testType: null,
    athleteId: null,
    fromDate: null,
    toDate: null,
  },

  // Actions
  setFilters: (filters) => set((state) => ({
    filters: { ...state.filters, ...filters },
  })),

  clearFilters: () => set({
    filters: { testType: null, athleteId: null, fromDate: null, toDate: null },
  }),

  // Fetch erg tests
  fetchErgTests: async (filters = {}) => {
    set({ loading: true, error: null });
    try {
      const { authenticatedFetch } = useAuthStore.getState();
      const params = new URLSearchParams();

      const mergedFilters = { ...get().filters, ...filters };
      Object.entries(mergedFilters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const response = await authenticatedFetch(
        `/api/v1/erg-tests?${params.toString()}`
      );
      const data = await response.json();

      if (data.success) {
        set({ ergTests: data.data.tests, loading: false });
        return data.data.tests;
      } else {
        throw new Error(data.error?.message || 'Failed to fetch erg tests');
      }
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Fetch leaderboard
  fetchLeaderboard: async (testType, limit = 20) => {
    set({ loading: true, error: null });
    try {
      const { authenticatedFetch } = useAuthStore.getState();
      const response = await authenticatedFetch(
        `/api/v1/erg-tests/leaderboard?testType=${testType}&limit=${limit}`
      );
      const data = await response.json();

      if (data.success) {
        set({ leaderboard: data.data.leaderboard, loading: false });
        return data.data.leaderboard;
      } else {
        throw new Error(data.error?.message || 'Failed to fetch leaderboard');
      }
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Create erg test
  createErgTest: async (testData) => {
    set({ loading: true, error: null });
    try {
      const { authenticatedFetch } = useAuthStore.getState();
      const response = await authenticatedFetch('/api/v1/erg-tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testData),
      });
      const data = await response.json();

      if (data.success) {
        set((state) => ({
          ergTests: [data.data.test, ...state.ergTests],
          loading: false,
        }));
        return data.data.test;
      } else {
        throw new Error(data.error?.message || 'Failed to create erg test');
      }
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Update erg test
  updateErgTest: async (testId, updates) => {
    set({ loading: true, error: null });
    try {
      const { authenticatedFetch } = useAuthStore.getState();
      const response = await authenticatedFetch(`/api/v1/erg-tests/${testId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const data = await response.json();

      if (data.success) {
        set((state) => ({
          ergTests: state.ergTests.map((t) =>
            t.id === testId ? data.data.test : t
          ),
          loading: false,
        }));
        return data.data.test;
      } else {
        throw new Error(data.error?.message || 'Failed to update erg test');
      }
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Delete erg test
  deleteErgTest: async (testId) => {
    set({ loading: true, error: null });
    try {
      const { authenticatedFetch } = useAuthStore.getState();
      const response = await authenticatedFetch(`/api/v1/erg-tests/${testId}`, {
        method: 'DELETE',
      });
      const data = await response.json();

      if (data.success) {
        set((state) => ({
          ergTests: state.ergTests.filter((t) => t.id !== testId),
          loading: false,
        }));
        return true;
      } else {
        throw new Error(data.error?.message || 'Failed to delete erg test');
      }
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Fetch workouts
  fetchWorkouts: async (filters = {}) => {
    set({ loading: true, error: null });
    try {
      const { authenticatedFetch } = useAuthStore.getState();
      const params = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const response = await authenticatedFetch(
        `/api/v1/workouts?${params.toString()}`
      );
      const data = await response.json();

      if (data.success) {
        set({ workouts: data.data.workouts, loading: false });
        return data.data.workouts;
      } else {
        throw new Error(data.error?.message || 'Failed to fetch workouts');
      }
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Clear error
  clearError: () => set({ error: null }),
}));
```

**Step 2: Commit**

```bash
git add src/store/ergDataStore.js
git commit -m "feat: add erg data Zustand store with CRUD and leaderboard"
```

---

### Task 10: Create CSV Import Store

**Files:**
- Create: `src/store/csvImportStore.js`

**Step 1: Create CSV import store**

Create `src/store/csvImportStore.js`:

```javascript
import { create } from 'zustand';
import { useAuthStore } from './authStore';

export const useCSVImportStore = create((set, get) => ({
  // State
  file: null,
  headers: [],
  mapping: {},
  preview: null,
  importing: false,
  error: null,
  result: null,

  // Actions
  setFile: (file) => set({ file, preview: null, result: null, error: null }),

  // Detect column mapping
  detectMapping: async (file) => {
    set({ importing: true, error: null });
    try {
      const { authenticatedFetch } = useAuthStore.getState();
      const formData = new FormData();
      formData.append('file', file);

      const response = await authenticatedFetch('/api/v1/import/csv/detect-mapping', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();

      if (data.success) {
        set({
          file,
          headers: data.data.headers,
          mapping: data.data.mapping,
          importing: false,
        });
        return data.data;
      } else {
        throw new Error(data.error?.message || 'Failed to detect mapping');
      }
    } catch (error) {
      set({ error: error.message, importing: false });
      throw error;
    }
  },

  // Update mapping
  updateMapping: (field, header) => set((state) => ({
    mapping: { ...state.mapping, [field]: header },
  })),

  // Preview import
  previewImport: async () => {
    const { file, mapping } = get();
    if (!file) throw new Error('No file selected');

    set({ importing: true, error: null });
    try {
      const { authenticatedFetch } = useAuthStore.getState();
      const formData = new FormData();
      formData.append('file', file);
      formData.append('mapping', JSON.stringify(mapping));

      const response = await authenticatedFetch('/api/v1/import/csv/preview', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();

      if (data.success) {
        set({ preview: data.data, importing: false });
        return data.data;
      } else {
        throw new Error(data.error?.message || 'Failed to preview import');
      }
    } catch (error) {
      set({ error: error.message, importing: false });
      throw error;
    }
  },

  // Execute import
  executeImport: async () => {
    const { preview } = get();
    if (!preview || preview.valid.length === 0) {
      throw new Error('No valid rows to import');
    }

    set({ importing: true, error: null });
    try {
      const { authenticatedFetch } = useAuthStore.getState();
      const response = await authenticatedFetch('/api/v1/import/csv/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ validRows: preview.valid }),
      });
      const data = await response.json();

      if (data.success) {
        set({ result: data.data, importing: false });
        return data.data;
      } else {
        throw new Error(data.error?.message || 'Failed to execute import');
      }
    } catch (error) {
      set({ error: error.message, importing: false });
      throw error;
    }
  },

  // Reset state
  reset: () => set({
    file: null,
    headers: [],
    mapping: {},
    preview: null,
    importing: false,
    error: null,
    result: null,
  }),

  // Clear error
  clearError: () => set({ error: null }),
}));
```

**Step 2: Commit**

```bash
git add src/store/csvImportStore.js
git commit -m "feat: add CSV import store with preview and execute"
```

---

### Task 11: Update ErgDataPage with API Integration

**Files:**
- Modify: `src/pages/ErgDataPage.jsx`

**Step 1: Read current ErgDataPage**

Read the file to understand the current structure before modifying.

**Step 2: Update with API integration**

Replace mock data with real API calls, integrate with ergDataStore, and update AddTestModal to save data.

**Step 3: Commit**

```bash
git add src/pages/ErgDataPage.jsx
git commit -m "feat: integrate ErgDataPage with API, add test CRUD functionality"
```

---

### Task 12: Create CSV Import Modal Component

**Files:**
- Create: `src/components/erg/CSVImportModal.jsx`

**Step 1: Create CSV import modal**

Create component with:
- File upload dropzone
- Column mapping interface
- Preview table showing valid/invalid rows
- Import execution with progress
- Success/error summary

**Step 2: Commit**

```bash
git add src/components/erg/CSVImportModal.jsx
git commit -m "feat: add CSV import modal with mapping and preview"
```

---

## Phase 2E: Testing & Integration

### Task 13: Test Backend Endpoints

**Verification:**

```bash
# Start server
npm run dev:server

# Test erg test CRUD
curl -X POST http://localhost:3002/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Use token from login response
export TOKEN="your_access_token"

# Create erg test
curl -X POST http://localhost:3002/api/v1/erg-tests \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "athleteId": "athlete-uuid",
    "testType": "2k",
    "testDate": "2025-01-18",
    "timeSeconds": 420.5
  }'

# Get leaderboard
curl http://localhost:3002/api/v1/erg-tests/leaderboard?testType=2k \
  -H "Authorization: Bearer $TOKEN"
```

---

### Task 14: Test Frontend Integration

**Verification:**

```bash
# Start both servers
npm run dev

# Navigate to http://localhost:3001
# - Log in with test account
# - Go to Erg Data page
# - Verify tests load from API
# - Add new test via modal
# - Verify test appears in list
# - Test CSV import flow
```

---

## Execution Checklist

- [ ] Task 1: Erg test service
- [ ] Task 2: Erg test routes
- [ ] Task 3: Workout service
- [ ] Task 4: Workout routes
- [ ] Task 5: CSV import service
- [ ] Task 6: CSV import routes
- [ ] Task 7: Concept2 service
- [ ] Task 8: Concept2 routes
- [ ] Task 9: Erg data store
- [ ] Task 10: CSV import store
- [ ] Task 11: ErgDataPage integration
- [ ] Task 12: CSV import modal
- [ ] Task 13: Backend testing
- [ ] Task 14: Frontend testing

---

## API Endpoints Summary (Phase 2)

### Erg Tests
- `GET /api/v1/erg-tests` - List tests
- `GET /api/v1/erg-tests/:id` - Get test
- `GET /api/v1/erg-tests/leaderboard` - Team leaderboard
- `GET /api/v1/erg-tests/athlete/:id/history` - Athlete history
- `POST /api/v1/erg-tests` - Create test
- `POST /api/v1/erg-tests/bulk-import` - Bulk import
- `PATCH /api/v1/erg-tests/:id` - Update test
- `DELETE /api/v1/erg-tests/:id` - Delete test

### Workouts
- `GET /api/v1/workouts` - List workouts
- `GET /api/v1/workouts/:id` - Get workout
- `GET /api/v1/workouts/athlete/:id/summary` - Athlete summary
- `POST /api/v1/workouts` - Create workout
- `PATCH /api/v1/workouts/:id` - Update workout
- `DELETE /api/v1/workouts/:id` - Delete workout

### Import
- `POST /api/v1/import/csv/detect-mapping` - Detect columns
- `POST /api/v1/import/csv/preview` - Preview import
- `POST /api/v1/import/csv/execute` - Execute import

### Concept2
- `GET /api/v1/concept2/auth-url/:athleteId` - Get OAuth URL
- `GET /api/v1/concept2/callback` - OAuth callback
- `GET /api/v1/concept2/status/:athleteId` - Connection status
- `POST /api/v1/concept2/sync/:athleteId` - Sync workouts
- `DELETE /api/v1/concept2/disconnect/:athleteId` - Disconnect
