# Phase 5: Racing Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build regatta/race tracking system with results entry, speed calculation, CMAX-style rankings, and external team comparison.

**Architecture:** Follow Phase 1-4 patterns - service layer, v1 routes with auth/team isolation, Zustand stores.

**Reference Files:**
- Service pattern: `server/services/seatRaceService.js`
- Route pattern: `server/routes/seatRaces.js`
- Auth middleware: `server/middleware/auth.js`
- Store pattern: `src/store/seatRaceStore.js`

---

## Phase 5A: Racing Backend (Tasks 1-5)

### Task 1: Create Regatta Service

**Files:**
- Create: `server/services/regattaService.js`

**Step 1: Create regatta service with CRUD operations**

```javascript
import { prisma } from '../db/connection.js';

/**
 * Create a new regatta
 */
export async function createRegatta(teamId, data) {
  const { name, location, date, courseType, conditions, description } = data;

  const regatta = await prisma.regatta.create({
    data: {
      teamId,
      name,
      location,
      date: new Date(date),
      courseType,
      conditions: conditions || {},
      description,
    },
  });

  return regatta;
}

/**
 * Get all regattas for a team
 */
export async function getRegattas(teamId, options = {}) {
  const { limit = 20, offset = 0, season } = options;

  const where = { teamId };
  if (season) {
    // Filter by season (e.g., "Spring 2025")
    const [seasonName, year] = season.split(' ');
    const yearNum = parseInt(year);
    if (seasonName === 'Spring') {
      where.date = {
        gte: new Date(`${yearNum}-01-01`),
        lte: new Date(`${yearNum}-06-30`),
      };
    } else if (seasonName === 'Fall') {
      where.date = {
        gte: new Date(`${yearNum}-07-01`),
        lte: new Date(`${yearNum}-12-31`),
      };
    }
  }

  const regattas = await prisma.regatta.findMany({
    where,
    include: {
      _count: { select: { races: true } },
    },
    orderBy: { date: 'desc' },
    take: limit,
    skip: offset,
  });

  return regattas;
}

/**
 * Get regatta with all races and results
 */
export async function getRegattaById(teamId, regattaId) {
  const regatta = await prisma.regatta.findFirst({
    where: { id: regattaId, teamId },
    include: {
      races: {
        orderBy: { scheduledTime: 'asc' },
        include: {
          results: {
            orderBy: { place: 'asc' },
            include: {
              lineup: {
                select: { id: true, name: true },
              },
            },
          },
        },
      },
    },
  });

  if (!regatta) throw new Error('Regatta not found');
  return regatta;
}

/**
 * Update regatta
 */
export async function updateRegatta(teamId, regattaId, data) {
  const existing = await prisma.regatta.findFirst({
    where: { id: regattaId, teamId },
  });
  if (!existing) throw new Error('Regatta not found');

  return prisma.regatta.update({
    where: { id: regattaId },
    data: {
      name: data.name,
      location: data.location,
      date: data.date ? new Date(data.date) : undefined,
      courseType: data.courseType,
      conditions: data.conditions,
      description: data.description,
    },
  });
}

/**
 * Delete regatta and all related data
 */
export async function deleteRegatta(teamId, regattaId) {
  const existing = await prisma.regatta.findFirst({
    where: { id: regattaId, teamId },
  });
  if (!existing) throw new Error('Regatta not found');

  await prisma.regatta.delete({
    where: { id: regattaId },
  });

  return { success: true };
}
```

**Verification:** `node --check server/services/regattaService.js`

---

### Task 2: Add Race and Result Management to Regatta Service

**Files:**
- Modify: `server/services/regattaService.js`

**Step 1: Add race CRUD operations**

```javascript
/**
 * Add a race to a regatta
 */
export async function addRace(teamId, regattaId, data) {
  const regatta = await prisma.regatta.findFirst({
    where: { id: regattaId, teamId },
  });
  if (!regatta) throw new Error('Regatta not found');

  const race = await prisma.race.create({
    data: {
      regattaId,
      eventName: data.eventName,
      boatClass: data.boatClass,
      distanceMeters: data.distanceMeters || 2000,
      isHeadRace: data.isHeadRace || false,
      scheduledTime: data.scheduledTime ? new Date(data.scheduledTime) : null,
    },
  });

  return race;
}

/**
 * Update race
 */
export async function updateRace(teamId, raceId, data) {
  const race = await prisma.race.findFirst({
    where: { id: raceId },
    include: { regatta: true },
  });
  if (!race || race.regatta.teamId !== teamId) {
    throw new Error('Race not found');
  }

  return prisma.race.update({
    where: { id: raceId },
    data: {
      eventName: data.eventName,
      boatClass: data.boatClass,
      distanceMeters: data.distanceMeters,
      isHeadRace: data.isHeadRace,
      scheduledTime: data.scheduledTime ? new Date(data.scheduledTime) : undefined,
    },
  });
}

/**
 * Delete race
 */
export async function deleteRace(teamId, raceId) {
  const race = await prisma.race.findFirst({
    where: { id: raceId },
    include: { regatta: true },
  });
  if (!race || race.regatta.teamId !== teamId) {
    throw new Error('Race not found');
  }

  await prisma.race.delete({
    where: { id: raceId },
  });

  return { success: true };
}

/**
 * Add result to a race
 */
export async function addResult(teamId, raceId, data) {
  const race = await prisma.race.findFirst({
    where: { id: raceId },
    include: { regatta: true },
  });
  if (!race || race.regatta.teamId !== teamId) {
    throw new Error('Race not found');
  }

  // Calculate raw speed if time provided
  let rawSpeed = null;
  if (data.finishTimeSeconds && race.distanceMeters) {
    rawSpeed = race.distanceMeters / data.finishTimeSeconds;
  }

  const result = await prisma.raceResult.create({
    data: {
      raceId,
      teamName: data.teamName,
      isOwnTeam: data.isOwnTeam || false,
      lineupId: data.lineupId,
      finishTimeSeconds: data.finishTimeSeconds,
      place: data.place,
      marginBackSeconds: data.marginBackSeconds,
      rawSpeed,
    },
  });

  return result;
}

/**
 * Update result
 */
export async function updateResult(teamId, resultId, data) {
  const result = await prisma.raceResult.findFirst({
    where: { id: resultId },
    include: { race: { include: { regatta: true } } },
  });
  if (!result || result.race.regatta.teamId !== teamId) {
    throw new Error('Result not found');
  }

  // Recalculate raw speed if time changed
  let rawSpeed = result.rawSpeed;
  if (data.finishTimeSeconds && result.race.distanceMeters) {
    rawSpeed = result.race.distanceMeters / data.finishTimeSeconds;
  }

  return prisma.raceResult.update({
    where: { id: resultId },
    data: {
      teamName: data.teamName,
      isOwnTeam: data.isOwnTeam,
      lineupId: data.lineupId,
      finishTimeSeconds: data.finishTimeSeconds,
      place: data.place,
      marginBackSeconds: data.marginBackSeconds,
      rawSpeed,
    },
  });
}

/**
 * Batch add results (for importing full race results)
 */
export async function batchAddResults(teamId, raceId, results) {
  const race = await prisma.race.findFirst({
    where: { id: raceId },
    include: { regatta: true },
  });
  if (!race || race.regatta.teamId !== teamId) {
    throw new Error('Race not found');
  }

  const createdResults = [];
  for (const data of results) {
    let rawSpeed = null;
    if (data.finishTimeSeconds && race.distanceMeters) {
      rawSpeed = race.distanceMeters / data.finishTimeSeconds;
    }

    const result = await prisma.raceResult.create({
      data: {
        raceId,
        teamName: data.teamName,
        isOwnTeam: data.isOwnTeam || false,
        lineupId: data.lineupId,
        finishTimeSeconds: data.finishTimeSeconds,
        place: data.place,
        marginBackSeconds: data.marginBackSeconds,
        rawSpeed,
      },
    });
    createdResults.push(result);
  }

  return createdResults;
}
```

**Verification:** `node --check server/services/regattaService.js`

---

### Task 3: Create Regatta Routes

**Files:**
- Create: `server/routes/regattas.js`
- Modify: `server/index.js`

**Step 1: Create routes file**

```javascript
import express from 'express';
import { authenticateToken, requireTeam, requireRole } from '../middleware/auth.js';
import * as regattaService from '../services/regattaService.js';

const router = express.Router();

// All routes require authentication and team context
router.use(authenticateToken);
router.use(requireTeam);

// Regattas
router.get('/', async (req, res) => {
  try {
    const regattas = await regattaService.getRegattas(req.teamId, {
      limit: parseInt(req.query.limit) || 20,
      offset: parseInt(req.query.offset) || 0,
      season: req.query.season,
    });
    res.json({ success: true, data: { regattas } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/', requireRole(['OWNER', 'COACH']), async (req, res) => {
  try {
    const regatta = await regattaService.createRegatta(req.teamId, req.body);
    res.status(201).json({ success: true, data: { regatta } });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const regatta = await regattaService.getRegattaById(req.teamId, req.params.id);
    res.json({ success: true, data: { regatta } });
  } catch (error) {
    res.status(404).json({ success: false, error: error.message });
  }
});

router.patch('/:id', requireRole(['OWNER', 'COACH']), async (req, res) => {
  try {
    const regatta = await regattaService.updateRegatta(req.teamId, req.params.id, req.body);
    res.json({ success: true, data: { regatta } });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.delete('/:id', requireRole(['OWNER', 'COACH']), async (req, res) => {
  try {
    await regattaService.deleteRegatta(req.teamId, req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Races
router.post('/:regattaId/races', requireRole(['OWNER', 'COACH']), async (req, res) => {
  try {
    const race = await regattaService.addRace(req.teamId, req.params.regattaId, req.body);
    res.status(201).json({ success: true, data: { race } });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.patch('/races/:raceId', requireRole(['OWNER', 'COACH']), async (req, res) => {
  try {
    const race = await regattaService.updateRace(req.teamId, req.params.raceId, req.body);
    res.json({ success: true, data: { race } });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.delete('/races/:raceId', requireRole(['OWNER', 'COACH']), async (req, res) => {
  try {
    await regattaService.deleteRace(req.teamId, req.params.raceId);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Results
router.post('/races/:raceId/results', requireRole(['OWNER', 'COACH']), async (req, res) => {
  try {
    const result = await regattaService.addResult(req.teamId, req.params.raceId, req.body);
    res.status(201).json({ success: true, data: { result } });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/races/:raceId/results/batch', requireRole(['OWNER', 'COACH']), async (req, res) => {
  try {
    const results = await regattaService.batchAddResults(
      req.teamId,
      req.params.raceId,
      req.body.results || []
    );
    res.status(201).json({ success: true, data: { results } });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.patch('/results/:resultId', requireRole(['OWNER', 'COACH']), async (req, res) => {
  try {
    const result = await regattaService.updateResult(req.teamId, req.params.resultId, req.body);
    res.json({ success: true, data: { result } });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

export default router;
```

**Step 2: Mount routes in server/index.js**

Add import and route mounting:
```javascript
import regattaRoutes from './routes/regattas.js';
// ...
app.use('/api/v1/regattas', regattaRoutes);
```

**Verification:** Start server and test with curl

---

### Task 4: Create Speed Calculation Service

**Files:**
- Create: `server/services/speedCalculationService.js`

**Step 1: Implement speed and ranking calculations**

```javascript
/**
 * Speed Calculation Service
 *
 * Implements CMAX-style speed normalization for comparing
 * race results across different conditions and courses.
 */

import { prisma } from '../db/connection.js';

// Standard 2000m course for normalization
const STANDARD_DISTANCE = 2000;

/**
 * Calculate raw speed (m/s) from distance and time
 */
export function calculateRawSpeed(distanceMeters, timeSeconds) {
  if (!timeSeconds || timeSeconds <= 0) return null;
  return distanceMeters / timeSeconds;
}

/**
 * Convert time to split (per 500m)
 */
export function timeToSplit(timeSeconds, distanceMeters) {
  if (!timeSeconds || !distanceMeters) return null;
  return (timeSeconds / distanceMeters) * 500;
}

/**
 * Convert split to time for distance
 */
export function splitToTime(splitSeconds, distanceMeters) {
  return (splitSeconds / 500) * distanceMeters;
}

/**
 * Convert speed to split
 */
export function speedToSplit(speedMs) {
  if (!speedMs || speedMs <= 0) return null;
  return 500 / speedMs;
}

/**
 * Apply course correction factor
 * Head races typically have slower times due to navigation
 */
export function applyCourseCorrection(timeSeconds, isHeadRace, courseLength) {
  if (!isHeadRace) return timeSeconds;

  // Head race correction: approximately 2-3% slower
  // Longer courses have more navigation overhead
  const baseFactor = 0.97;
  const lengthFactor = courseLength > 3000 ? 0.96 : baseFactor;

  return timeSeconds * lengthFactor;
}

/**
 * Apply conditions adjustment
 * Basic adjustment for wind/water conditions
 */
export function applyConditionsAdjustment(timeSeconds, conditions) {
  if (!conditions) return timeSeconds;

  let factor = 1.0;

  // Wind adjustment
  if (conditions.wind) {
    const windSpeed = conditions.wind.speed || 0;
    const windDirection = conditions.wind.direction || 'headwind';

    if (windDirection === 'headwind') {
      factor -= windSpeed * 0.005; // Headwind slows down
    } else if (windDirection === 'tailwind') {
      factor += windSpeed * 0.003; // Tailwind speeds up (less effect)
    }
  }

  // Water conditions
  if (conditions.water === 'rough') {
    factor -= 0.02; // Rough water slows down
  } else if (conditions.water === 'current') {
    factor -= 0.01; // Current affects times
  }

  return timeSeconds * factor;
}

/**
 * Normalize time to standard 2000m
 */
export function normalizeToStandard(timeSeconds, distanceMeters) {
  if (!timeSeconds || !distanceMeters) return null;
  const split = timeToSplit(timeSeconds, distanceMeters);
  return splitToTime(split, STANDARD_DISTANCE);
}

/**
 * Calculate adjusted speed for ranking
 */
export function calculateAdjustedSpeed(result, race, regatta) {
  let time = result.finishTimeSeconds;

  // Apply course correction
  time = applyCourseCorrection(time, race.isHeadRace, race.distanceMeters);

  // Apply conditions adjustment
  time = applyConditionsAdjustment(time, regatta.conditions);

  // Normalize to standard distance
  const normalizedTime = normalizeToStandard(time, race.distanceMeters);

  // Convert to speed
  return STANDARD_DISTANCE / normalizedTime;
}

/**
 * Analyze race results and calculate adjusted speeds
 */
export async function analyzeRace(teamId, raceId) {
  const race = await prisma.race.findFirst({
    where: { id: raceId },
    include: {
      regatta: true,
      results: {
        orderBy: { place: 'asc' },
      },
    },
  });

  if (!race || race.regatta.teamId !== teamId) {
    throw new Error('Race not found');
  }

  const analyzed = race.results.map(result => {
    const adjustedSpeed = calculateAdjustedSpeed(result, race, race.regatta);
    const split = timeToSplit(result.finishTimeSeconds, race.distanceMeters);

    return {
      ...result,
      split,
      adjustedSpeed,
      adjustedTime: adjustedSpeed ? STANDARD_DISTANCE / adjustedSpeed : null,
    };
  });

  // Update results with adjusted speeds
  for (const result of analyzed) {
    if (result.adjustedSpeed) {
      await prisma.raceResult.update({
        where: { id: result.id },
        data: { adjustedSpeed: result.adjustedSpeed },
      });
    }
  }

  return {
    race,
    results: analyzed,
    winningSpeed: analyzed[0]?.adjustedSpeed,
    spreadSeconds: analyzed.length > 1
      ? (STANDARD_DISTANCE / analyzed[analyzed.length - 1].adjustedSpeed) -
        (STANDARD_DISTANCE / analyzed[0].adjustedSpeed)
      : 0,
  };
}

/**
 * Compare two race results
 */
export function compareResults(result1, result2) {
  const speedDiff = result1.adjustedSpeed - result2.adjustedSpeed;
  const timeDiff = result2.adjustedTime - result1.adjustedTime;

  return {
    faster: speedDiff > 0 ? result1 : result2,
    speedDifference: Math.abs(speedDiff),
    timeDifference: Math.abs(timeDiff),
    percentageFaster: (Math.abs(speedDiff) / Math.min(result1.adjustedSpeed, result2.adjustedSpeed)) * 100,
  };
}
```

**Verification:** `node --check server/services/speedCalculationService.js`

---

### Task 5: Create Team Speed Ranking Service

**Files:**
- Create: `server/services/teamRankingService.js`

**Step 1: Implement CMAX-style team rankings**

```javascript
/**
 * Team Speed Ranking Service
 *
 * Aggregates race results to generate team speed estimates
 * similar to CMAX rankings.
 */

import { prisma } from '../db/connection.js';
import * as speedCalc from './speedCalculationService.js';

/**
 * Get or create external team
 */
export async function getOrCreateExternalTeam(name, metadata = {}) {
  let team = await prisma.externalTeam.findFirst({
    where: { name: { equals: name, mode: 'insensitive' } },
  });

  if (!team) {
    team = await prisma.externalTeam.create({
      data: {
        name,
        conference: metadata.conference,
        division: metadata.division,
      },
    });
  }

  return team;
}

/**
 * Calculate team speed estimate for a boat class
 */
export async function calculateTeamSpeedEstimate(teamId, boatClass, season) {
  // Get all results for this team in the boat class
  const results = await prisma.raceResult.findMany({
    where: {
      isOwnTeam: true,
      race: {
        boatClass,
        regatta: {
          teamId,
          // Filter by season if provided
          ...(season && {
            date: getSeasonDateRange(season),
          }),
        },
      },
    },
    include: {
      race: {
        include: { regatta: true },
      },
    },
  });

  if (results.length === 0) return null;

  // Calculate adjusted speeds for all results
  const speeds = results
    .map(r => speedCalc.calculateAdjustedSpeed(r, r.race, r.race.regatta))
    .filter(s => s !== null);

  if (speeds.length === 0) return null;

  // Use median speed (more robust than mean)
  speeds.sort((a, b) => a - b);
  const medianSpeed = speeds[Math.floor(speeds.length / 2)];

  // Calculate confidence based on sample size
  const confidence = Math.min(1, speeds.length / 5);

  // Update or create speed estimate
  const existing = await prisma.teamSpeedEstimate.findFirst({
    where: { teamId, boatClass, season },
  });

  if (existing) {
    return prisma.teamSpeedEstimate.update({
      where: { id: existing.id },
      data: {
        rawSpeed: speeds.reduce((a, b) => a + b, 0) / speeds.length,
        adjustedSpeed: medianSpeed,
        confidenceScore: confidence,
        sampleCount: speeds.length,
        lastCalculatedAt: new Date(),
      },
    });
  }

  return prisma.teamSpeedEstimate.create({
    data: {
      teamId,
      boatClass,
      season,
      rawSpeed: speeds.reduce((a, b) => a + b, 0) / speeds.length,
      adjustedSpeed: medianSpeed,
      confidenceScore: confidence,
      sampleCount: speeds.length,
    },
  });
}

/**
 * Get team rankings for a boat class
 */
export async function getBoatClassRankings(teamId, boatClass, season) {
  // Get own team estimate
  const ownEstimate = await calculateTeamSpeedEstimate(teamId, boatClass, season);

  // Get results from races with external teams
  const races = await prisma.race.findMany({
    where: {
      boatClass,
      regatta: {
        teamId,
        ...(season && { date: getSeasonDateRange(season) }),
      },
    },
    include: {
      results: {
        include: {
          race: {
            include: { regatta: true },
          },
        },
      },
      regatta: true,
    },
  });

  // Build rankings from race results
  const teamSpeeds = new Map();

  for (const race of races) {
    for (const result of race.results) {
      const speed = speedCalc.calculateAdjustedSpeed(result, race, race.regatta);
      if (!speed) continue;

      const teamName = result.isOwnTeam ? 'Your Team' : result.teamName;
      const existing = teamSpeeds.get(teamName) || [];
      existing.push(speed);
      teamSpeeds.set(teamName, existing);
    }
  }

  // Calculate median speed for each team
  const rankings = [];
  for (const [teamName, speeds] of teamSpeeds) {
    speeds.sort((a, b) => a - b);
    const medianSpeed = speeds[Math.floor(speeds.length / 2)];
    const split = speedCalc.speedToSplit(medianSpeed);

    rankings.push({
      teamName,
      isOwnTeam: teamName === 'Your Team',
      medianSpeed,
      split,
      sampleCount: speeds.length,
      standardTime: 2000 / medianSpeed,
    });
  }

  // Sort by speed (fastest first)
  rankings.sort((a, b) => b.medianSpeed - a.medianSpeed);

  // Add rank
  return rankings.map((r, i) => ({ ...r, rank: i + 1 }));
}

/**
 * Get head-to-head comparison
 */
export async function getHeadToHead(teamId, externalTeamName, boatClass, season) {
  const races = await prisma.race.findMany({
    where: {
      boatClass,
      regatta: {
        teamId,
        ...(season && { date: getSeasonDateRange(season) }),
      },
      results: {
        some: {
          teamName: { equals: externalTeamName, mode: 'insensitive' },
        },
      },
    },
    include: {
      results: true,
      regatta: true,
    },
  });

  const matchups = [];
  for (const race of races) {
    const ownResult = race.results.find(r => r.isOwnTeam);
    const theirResult = race.results.find(
      r => r.teamName.toLowerCase() === externalTeamName.toLowerCase()
    );

    if (!ownResult || !theirResult) continue;

    const ownSpeed = speedCalc.calculateAdjustedSpeed(ownResult, race, race.regatta);
    const theirSpeed = speedCalc.calculateAdjustedSpeed(theirResult, race, race.regatta);

    matchups.push({
      regatta: race.regatta.name,
      date: race.regatta.date,
      eventName: race.eventName,
      ownPlace: ownResult.place,
      theirPlace: theirResult.place,
      ownTime: ownResult.finishTimeSeconds,
      theirTime: theirResult.finishTimeSeconds,
      marginSeconds: theirResult.finishTimeSeconds - ownResult.finishTimeSeconds,
      won: ownResult.place < theirResult.place,
    });
  }

  return {
    opponent: externalTeamName,
    totalRaces: matchups.length,
    wins: matchups.filter(m => m.won).length,
    losses: matchups.filter(m => !m.won).length,
    avgMargin: matchups.length > 0
      ? matchups.reduce((sum, m) => sum + m.marginSeconds, 0) / matchups.length
      : 0,
    matchups,
  };
}

/**
 * Get season date range
 */
function getSeasonDateRange(season) {
  const [seasonName, year] = season.split(' ');
  const yearNum = parseInt(year);

  if (seasonName === 'Spring') {
    return {
      gte: new Date(`${yearNum}-01-01`),
      lte: new Date(`${yearNum}-06-30`),
    };
  } else if (seasonName === 'Fall') {
    return {
      gte: new Date(`${yearNum}-07-01`),
      lte: new Date(`${yearNum}-12-31`),
    };
  }

  return {};
}

/**
 * Get all boat classes with results
 */
export async function getBoatClassesWithResults(teamId, season) {
  const races = await prisma.race.findMany({
    where: {
      regatta: {
        teamId,
        ...(season && { date: getSeasonDateRange(season) }),
      },
      results: { some: { isOwnTeam: true } },
    },
    select: { boatClass: true },
    distinct: ['boatClass'],
  });

  return races.map(r => r.boatClass);
}
```

**Verification:** `node --check server/services/teamRankingService.js`

---

## Phase 5B: Rankings Routes (Tasks 6-7)

### Task 6: Create Team Rankings Routes

**Files:**
- Create: `server/routes/teamRankings.js`
- Modify: `server/index.js`

**Step 1: Create team rankings routes**

```javascript
import express from 'express';
import { authenticateToken, requireTeam } from '../middleware/auth.js';
import * as teamRankingService from '../services/teamRankingService.js';
import * as speedCalcService from '../services/speedCalculationService.js';

const router = express.Router();

router.use(authenticateToken);
router.use(requireTeam);

// Get boat classes with results
router.get('/boat-classes', async (req, res) => {
  try {
    const boatClasses = await teamRankingService.getBoatClassesWithResults(
      req.teamId,
      req.query.season
    );
    res.json({ success: true, data: { boatClasses } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get rankings for a boat class
router.get('/rankings/:boatClass', async (req, res) => {
  try {
    const rankings = await teamRankingService.getBoatClassRankings(
      req.teamId,
      req.params.boatClass,
      req.query.season
    );
    res.json({ success: true, data: { rankings } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get head-to-head comparison
router.get('/head-to-head', async (req, res) => {
  try {
    const { opponent, boatClass, season } = req.query;
    if (!opponent || !boatClass) {
      return res.status(400).json({
        success: false,
        error: 'opponent and boatClass are required',
      });
    }

    const comparison = await teamRankingService.getHeadToHead(
      req.teamId,
      opponent,
      boatClass,
      season
    );
    res.json({ success: true, data: { comparison } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Calculate/recalculate team speed estimate
router.post('/calculate/:boatClass', async (req, res) => {
  try {
    const estimate = await teamRankingService.calculateTeamSpeedEstimate(
      req.teamId,
      req.params.boatClass,
      req.body.season
    );
    res.json({ success: true, data: { estimate } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Analyze a specific race
router.get('/analyze-race/:raceId', async (req, res) => {
  try {
    const analysis = await speedCalcService.analyzeRace(
      req.teamId,
      req.params.raceId
    );
    res.json({ success: true, data: { analysis } });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

export default router;
```

**Step 2: Mount in server/index.js**

```javascript
import teamRankingsRoutes from './routes/teamRankings.js';
app.use('/api/v1/team-rankings', teamRankingsRoutes);
```

**Verification:** Test endpoints

---

### Task 7: Create External Teams Routes

**Files:**
- Create: `server/routes/externalTeams.js`
- Modify: `server/index.js`

**Step 1: Create external teams routes**

```javascript
import express from 'express';
import { authenticateToken, requireTeam, requireRole } from '../middleware/auth.js';
import { prisma } from '../db/connection.js';

const router = express.Router();

router.use(authenticateToken);
router.use(requireTeam);

// Search external teams
router.get('/search', async (req, res) => {
  try {
    const { q, conference, division, limit = 20 } = req.query;

    const where = {};
    if (q) {
      where.name = { contains: q, mode: 'insensitive' };
    }
    if (conference) {
      where.conference = { equals: conference, mode: 'insensitive' };
    }
    if (division) {
      where.division = division;
    }

    const teams = await prisma.externalTeam.findMany({
      where,
      take: parseInt(limit),
      orderBy: { name: 'asc' },
    });

    res.json({ success: true, data: { teams } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all external teams
router.get('/', async (req, res) => {
  try {
    const teams = await prisma.externalTeam.findMany({
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, data: { teams } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create external team
router.post('/', requireRole(['OWNER', 'COACH']), async (req, res) => {
  try {
    const { name, conference, division } = req.body;

    const existing = await prisma.externalTeam.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        error: 'Team already exists',
        data: { team: existing },
      });
    }

    const team = await prisma.externalTeam.create({
      data: { name, conference, division },
    });

    res.status(201).json({ success: true, data: { team } });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Update external team
router.patch('/:id', requireRole(['OWNER', 'COACH']), async (req, res) => {
  try {
    const team = await prisma.externalTeam.update({
      where: { id: req.params.id },
      data: {
        name: req.body.name,
        conference: req.body.conference,
        division: req.body.division,
      },
    });
    res.json({ success: true, data: { team } });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Get conferences
router.get('/conferences', async (req, res) => {
  try {
    const result = await prisma.externalTeam.findMany({
      where: { conference: { not: null } },
      select: { conference: true },
      distinct: ['conference'],
    });

    const conferences = result.map(r => r.conference).filter(Boolean).sort();
    res.json({ success: true, data: { conferences } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
```

**Step 2: Mount in server/index.js**

```javascript
import externalTeamsRoutes from './routes/externalTeams.js';
app.use('/api/v1/external-teams', externalTeamsRoutes);
```

**Verification:** Test endpoints

---

## Phase 5C: Frontend Stores & Components (Tasks 8-13)

### Task 8: Create Regatta Store

**Files:**
- Create: `src/store/regattaStore.js`

**Step 1: Create Zustand store**

```javascript
import { create } from 'zustand';

const API_BASE = '/api/v1/regattas';

const useRegattaStore = create((set, get) => ({
  regattas: [],
  currentRegatta: null,
  loading: false,
  error: null,

  // Fetch all regattas
  fetchRegattas: async (options = {}) => {
    set({ loading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (options.season) params.append('season', options.season);
      if (options.limit) params.append('limit', options.limit);

      const res = await fetch(`${API_BASE}?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      set({ regattas: data.data.regattas, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  // Fetch single regatta with details
  fetchRegatta: async (regattaId) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API_BASE}/${regattaId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      set({ currentRegatta: data.data.regatta, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  // Create regatta
  createRegatta: async (regattaData) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify(regattaData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      set((state) => ({
        regattas: [data.data.regatta, ...state.regattas],
        loading: false,
      }));
      return data.data.regatta;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Add race to regatta
  addRace: async (regattaId, raceData) => {
    try {
      const res = await fetch(`${API_BASE}/${regattaId}/races`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify(raceData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await get().fetchRegatta(regattaId);
      return data.data.race;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  // Add result to race
  addResult: async (raceId, resultData) => {
    try {
      const res = await fetch(`${API_BASE}/races/${raceId}/results`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify(resultData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      return data.data.result;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  // Batch add results
  batchAddResults: async (raceId, results) => {
    try {
      const res = await fetch(`${API_BASE}/races/${raceId}/results/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({ results }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      return data.data.results;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));

export default useRegattaStore;
```

**Verification:** Import in test file

---

### Task 9: Create Team Rankings Store

**Files:**
- Create: `src/store/teamRankingsStore.js`

**Step 1: Create rankings store**

```javascript
import { create } from 'zustand';

const API_BASE = '/api/v1/team-rankings';

const useTeamRankingsStore = create((set) => ({
  rankings: [],
  boatClasses: [],
  headToHead: null,
  loading: false,
  error: null,

  fetchBoatClasses: async (season) => {
    set({ loading: true, error: null });
    try {
      const params = season ? `?season=${season}` : '';
      const res = await fetch(`${API_BASE}/boat-classes${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      set({ boatClasses: data.data.boatClasses, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  fetchRankings: async (boatClass, season) => {
    set({ loading: true, error: null });
    try {
      const params = season ? `?season=${season}` : '';
      const res = await fetch(`${API_BASE}/rankings/${boatClass}${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      set({ rankings: data.data.rankings, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  fetchHeadToHead: async (opponent, boatClass, season) => {
    set({ loading: true, error: null });
    try {
      const params = new URLSearchParams({ opponent, boatClass });
      if (season) params.append('season', season);

      const res = await fetch(`${API_BASE}/head-to-head?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      set({ headToHead: data.data.comparison, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  clearError: () => set({ error: null }),
}));

export default useTeamRankingsStore;
```

**Verification:** Import in test file

---

### Task 10: Create Regatta List Component

**Files:**
- Create: `src/components/Racing/RegattaList.jsx`

**Step 1: Create regatta list component**

```javascript
import React, { useEffect } from 'react';
import useRegattaStore from '../../store/regattaStore';

function RegattaList({ onSelectRegatta, onCreateNew }) {
  const { regattas, loading, error, fetchRegattas } = useRegattaStore();

  useEffect(() => {
    fetchRegattas();
  }, [fetchRegattas]);

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading && regattas.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">
          Regattas
        </h2>
        <button
          onClick={onCreateNew}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Regatta
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg">
          {error}
        </div>
      )}

      {regattas.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <div className="text-5xl mb-3">🏆</div>
          <p>No regattas yet</p>
          <p className="text-sm mt-2">Add your first regatta to start tracking race results</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {regattas.map((regatta) => (
            <div
              key={regatta.id}
              onClick={() => onSelectRegatta(regatta)}
              className="p-4 bg-white/50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 cursor-pointer transition-all"
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-800 dark:text-gray-200">
                      {regatta.name}
                    </span>
                    {regatta.courseType && (
                      <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full">
                        {regatta.courseType}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {formatDate(regatta.date)}
                  </p>
                  {regatta.location && (
                    <p className="text-sm text-gray-500 dark:text-gray-500">
                      {regatta.location}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    {regatta._count?.races || 0} races
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default RegattaList;
```

**Verification:** Import without errors

---

### Task 11: Create Race Results Entry Component

**Files:**
- Create: `src/components/Racing/RaceResultsEntry.jsx`

**Step 1: Create results entry form**

```javascript
import React, { useState } from 'react';
import useRegattaStore from '../../store/regattaStore';

function RaceResultsEntry({ regatta, race, onClose }) {
  const { addResult, batchAddResults } = useRegattaStore();
  const [results, setResults] = useState([
    { teamName: '', finishTimeSeconds: '', place: 1, isOwnTeam: true },
    { teamName: '', finishTimeSeconds: '', place: 2, isOwnTeam: false },
  ]);
  const [saving, setSaving] = useState(false);

  const formatTime = (seconds) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(1);
    return `${mins}:${secs.padStart(4, '0')}`;
  };

  const parseTime = (timeStr) => {
    if (!timeStr) return null;
    const match = timeStr.match(/(\d+):(\d+\.?\d*)/);
    if (!match) return null;
    return parseInt(match[1]) * 60 + parseFloat(match[2]);
  };

  const addRow = () => {
    setResults([
      ...results,
      { teamName: '', finishTimeSeconds: '', place: results.length + 1, isOwnTeam: false },
    ]);
  };

  const updateResult = (index, field, value) => {
    const updated = [...results];
    updated[index] = { ...updated[index], [field]: value };

    // Auto-assign places based on order
    if (field === 'finishTimeSeconds') {
      const withTimes = updated.map((r, i) => ({
        ...r,
        index: i,
        time: parseTime(r.finishTimeSeconds) || Infinity,
      }));
      withTimes.sort((a, b) => a.time - b.time);
      withTimes.forEach((r, i) => {
        updated[r.index].place = i + 1;
      });
    }

    setResults(updated);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const validResults = results
        .filter(r => r.teamName && r.finishTimeSeconds)
        .map(r => ({
          ...r,
          finishTimeSeconds: parseTime(r.finishTimeSeconds),
        }));

      await batchAddResults(race.id, validResults);
      onClose();
    } catch (error) {
      console.error('Failed to save results:', error);
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            {race.eventName}
          </h3>
          <p className="text-sm text-gray-500">
            {race.boatClass} - {race.distanceMeters}m
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Results Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-700">
              <th className="px-3 py-2 text-left text-sm font-medium text-gray-600 dark:text-gray-300">Place</th>
              <th className="px-3 py-2 text-left text-sm font-medium text-gray-600 dark:text-gray-300">Team</th>
              <th className="px-3 py-2 text-center text-sm font-medium text-gray-600 dark:text-gray-300">Time</th>
              <th className="px-3 py-2 text-center text-sm font-medium text-gray-600 dark:text-gray-300">Ours?</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {results.map((result, index) => (
              <tr key={index} className={result.isOwnTeam ? 'bg-blue-50 dark:bg-blue-900/20' : ''}>
                <td className="px-3 py-2">
                  <span className="font-mono text-gray-600 dark:text-gray-400">
                    {result.place}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <input
                    type="text"
                    value={result.teamName}
                    onChange={(e) => updateResult(index, 'teamName', e.target.value)}
                    placeholder="Team name"
                    className="w-full px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="text"
                    value={result.finishTimeSeconds}
                    onChange={(e) => updateResult(index, 'finishTimeSeconds', e.target.value)}
                    placeholder="0:00.0"
                    className="w-24 px-2 py-1 text-center rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                  />
                </td>
                <td className="px-3 py-2 text-center">
                  <input
                    type="checkbox"
                    checked={result.isOwnTeam}
                    onChange={(e) => updateResult(index, 'isOwnTeam', e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex gap-2 justify-between">
        <button
          onClick={addRow}
          className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Row
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Results'}
        </button>
      </div>
    </div>
  );
}

export default RaceResultsEntry;
```

**Verification:** Import without errors

---

### Task 12: Create Team Rankings Display Component

**Files:**
- Create: `src/components/Racing/TeamRankingsDisplay.jsx`

**Step 1: Create rankings display**

```javascript
import React, { useEffect, useState } from 'react';
import useTeamRankingsStore from '../../store/teamRankingsStore';

function TeamRankingsDisplay() {
  const {
    rankings,
    boatClasses,
    headToHead,
    loading,
    error,
    fetchBoatClasses,
    fetchRankings,
    fetchHeadToHead,
  } = useTeamRankingsStore();

  const [selectedBoatClass, setSelectedBoatClass] = useState(null);
  const [selectedOpponent, setSelectedOpponent] = useState(null);

  useEffect(() => {
    fetchBoatClasses();
  }, [fetchBoatClasses]);

  useEffect(() => {
    if (selectedBoatClass) {
      fetchRankings(selectedBoatClass);
    }
  }, [selectedBoatClass, fetchRankings]);

  useEffect(() => {
    if (selectedOpponent && selectedBoatClass) {
      fetchHeadToHead(selectedOpponent, selectedBoatClass);
    }
  }, [selectedOpponent, selectedBoatClass, fetchHeadToHead]);

  const formatSplit = (splitSeconds) => {
    if (!splitSeconds) return '-';
    const mins = Math.floor(splitSeconds / 60);
    const secs = (splitSeconds % 60).toFixed(1);
    return `${mins}:${secs.padStart(4, '0')}`;
  };

  if (loading && boatClasses.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">
          Team Rankings
        </h2>
      </div>

      {/* Boat Class Selector */}
      <div className="flex gap-2 flex-wrap">
        {boatClasses.map((bc) => (
          <button
            key={bc}
            onClick={() => setSelectedBoatClass(bc)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedBoatClass === bc
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {bc}
          </button>
        ))}
      </div>

      {error && (
        <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg">
          {error}
        </div>
      )}

      {!selectedBoatClass ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <p>Select a boat class to view rankings</p>
        </div>
      ) : rankings.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <div className="text-5xl mb-3">📊</div>
          <p>No rankings data yet</p>
          <p className="text-sm mt-2">Add race results to generate rankings</p>
        </div>
      ) : (
        <div className="bg-white/50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700">
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300">Rank</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300">Team</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-600 dark:text-gray-300">Split (500m)</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-600 dark:text-gray-300">2k Time</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-600 dark:text-gray-300">Races</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-600 dark:text-gray-300">H2H</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {rankings.map((r) => (
                <tr
                  key={r.teamName}
                  className={`${r.isOwnTeam ? 'bg-blue-50 dark:bg-blue-900/20' : ''} hover:bg-gray-50 dark:hover:bg-gray-700/50`}
                >
                  <td className="px-4 py-3">
                    <span className={`font-bold ${r.rank <= 3 ? 'text-orange-500' : 'text-gray-500'}`}>
                      #{r.rank}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`font-medium ${r.isOwnTeam ? 'text-blue-600 dark:text-blue-400' : 'text-gray-800 dark:text-gray-200'}`}>
                      {r.teamName}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="font-mono text-gray-700 dark:text-gray-300">
                      {formatSplit(r.split)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="font-mono text-gray-700 dark:text-gray-300">
                      {formatSplit(r.standardTime)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-gray-600 dark:text-gray-400">
                    {r.sampleCount}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {!r.isOwnTeam && (
                      <button
                        onClick={() => setSelectedOpponent(r.teamName)}
                        className="text-blue-600 hover:text-blue-700 text-sm"
                      >
                        View
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Head-to-Head Modal */}
      {selectedOpponent && headToHead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setSelectedOpponent(null)}
          />
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-lg mx-4 shadow-xl">
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">
              vs {headToHead.opponent}
            </h3>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{headToHead.wins}</div>
                <div className="text-sm text-green-700 dark:text-green-400">Wins</div>
              </div>
              <div className="text-center p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <div className="text-2xl font-bold text-gray-600 dark:text-gray-300">{headToHead.totalRaces}</div>
                <div className="text-sm text-gray-500">Total</div>
              </div>
              <div className="text-center p-4 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{headToHead.losses}</div>
                <div className="text-sm text-red-700 dark:text-red-400">Losses</div>
              </div>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {headToHead.matchups.map((m, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-lg ${m.won ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium text-gray-800 dark:text-gray-200">{m.regatta}</div>
                      <div className="text-sm text-gray-500">{m.eventName}</div>
                    </div>
                    <div className="text-right">
                      <div className={`font-mono ${m.won ? 'text-green-600' : 'text-red-600'}`}>
                        {m.marginSeconds > 0 ? '+' : ''}{m.marginSeconds.toFixed(1)}s
                      </div>
                      <div className="text-xs text-gray-500">
                        {m.won ? `${m.ownPlace}st` : `${m.ownPlace}nd`}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setSelectedOpponent(null)}
              className="mt-4 w-full px-4 py-2 text-gray-600 dark:text-gray-400"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default TeamRankingsDisplay;
```

**Verification:** Import without errors

---

### Task 13: Create Racing Page

**Files:**
- Create: `src/pages/RacingPage.jsx`
- Modify: `src/App.jsx` (add route)

**Step 1: Create main page**

```javascript
import React, { useState } from 'react';
import RegattaList from '../components/Racing/RegattaList';
import RaceResultsEntry from '../components/Racing/RaceResultsEntry';
import TeamRankingsDisplay from '../components/Racing/TeamRankingsDisplay';
import useRegattaStore from '../store/regattaStore';

function RacingPage() {
  const [activeTab, setActiveTab] = useState('regattas');
  const [selectedRegatta, setSelectedRegatta] = useState(null);
  const [selectedRace, setSelectedRace] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddRaceModal, setShowAddRaceModal] = useState(false);

  const { createRegatta, addRace, fetchRegatta, currentRegatta } = useRegattaStore();

  const [newRegatta, setNewRegatta] = useState({
    name: '',
    location: '',
    date: new Date().toISOString().split('T')[0],
    courseType: '2000m',
    description: '',
  });

  const [newRace, setNewRace] = useState({
    eventName: '',
    boatClass: '8+',
    distanceMeters: 2000,
    isHeadRace: false,
  });

  const handleCreateRegatta = async () => {
    try {
      const regatta = await createRegatta(newRegatta);
      setShowCreateModal(false);
      setSelectedRegatta(regatta);
      await fetchRegatta(regatta.id);
      setNewRegatta({
        name: '',
        location: '',
        date: new Date().toISOString().split('T')[0],
        courseType: '2000m',
        description: '',
      });
    } catch (error) {
      console.error('Failed to create regatta:', error);
    }
  };

  const handleAddRace = async () => {
    try {
      await addRace(selectedRegatta.id, newRace);
      setShowAddRaceModal(false);
      setNewRace({
        eventName: '',
        boatClass: '8+',
        distanceMeters: 2000,
        isHeadRace: false,
      });
    } catch (error) {
      console.error('Failed to add race:', error);
    }
  };

  const handleSelectRegatta = async (regatta) => {
    setSelectedRegatta(regatta);
    await fetchRegatta(regatta.id);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">
            Racing
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Track regattas, results, and team rankings
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => { setActiveTab('regattas'); setSelectedRegatta(null); setSelectedRace(null); }}
            className={`pb-3 px-1 font-medium transition-colors ${
              activeTab === 'regattas'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
          >
            Regattas
          </button>
          <button
            onClick={() => setActiveTab('rankings')}
            className={`pb-3 px-1 font-medium transition-colors ${
              activeTab === 'rankings'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
          >
            Rankings
          </button>
        </div>

        {/* Content */}
        {activeTab === 'regattas' ? (
          selectedRace ? (
            <RaceResultsEntry
              regatta={currentRegatta}
              race={selectedRace}
              onClose={() => {
                setSelectedRace(null);
                fetchRegatta(selectedRegatta.id);
              }}
            />
          ) : selectedRegatta && currentRegatta ? (
            <div className="space-y-6">
              {/* Regatta Header */}
              <div className="flex justify-between items-start">
                <div>
                  <button
                    onClick={() => setSelectedRegatta(null)}
                    className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 mb-2 flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Regattas
                  </button>
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                    {currentRegatta.name}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    {new Date(currentRegatta.date).toLocaleDateString()} • {currentRegatta.location}
                  </p>
                </div>
                <button
                  onClick={() => setShowAddRaceModal(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg"
                >
                  Add Race
                </button>
              </div>

              {/* Races List */}
              {currentRegatta.races?.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <p>No races yet</p>
                  <p className="text-sm mt-2">Add races to start entering results</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {currentRegatta.races?.map((race) => (
                    <div
                      key={race.id}
                      onClick={() => setSelectedRace(race)}
                      className="p-4 bg-white/50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 cursor-pointer transition-all"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="font-semibold text-gray-800 dark:text-gray-200">
                            {race.eventName}
                          </span>
                          <div className="flex gap-2 mt-1">
                            <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full">
                              {race.boatClass}
                            </span>
                            <span className="text-xs text-gray-500">
                              {race.distanceMeters}m
                            </span>
                          </div>
                        </div>
                        <div className="text-sm text-gray-500">
                          {race.results?.length || 0} results
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <RegattaList
              onSelectRegatta={handleSelectRegatta}
              onCreateNew={() => setShowCreateModal(true)}
            />
          )
        ) : (
          <TeamRankingsDisplay />
        )}

        {/* Create Regatta Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowCreateModal(false)}
            />
            <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl">
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">
                New Regatta
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={newRegatta.name}
                    onChange={(e) => setNewRegatta({ ...newRegatta, name: e.target.value })}
                    placeholder="e.g., Dad Vail Regatta"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={newRegatta.location}
                    onChange={(e) => setNewRegatta({ ...newRegatta, location: e.target.value })}
                    placeholder="e.g., Schuylkill River, Philadelphia"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Date
                    </label>
                    <input
                      type="date"
                      value={newRegatta.date}
                      onChange={(e) => setNewRegatta({ ...newRegatta, date: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Course Type
                    </label>
                    <select
                      value={newRegatta.courseType}
                      onChange={(e) => setNewRegatta({ ...newRegatta, courseType: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                    >
                      <option value="2000m">2000m Sprint</option>
                      <option value="1500m">1500m</option>
                      <option value="head">Head Race</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 justify-end mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateRegatta}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg"
                >
                  Create Regatta
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Race Modal */}
        {showAddRaceModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowAddRaceModal(false)}
            />
            <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl">
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">
                Add Race
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Event Name
                  </label>
                  <input
                    type="text"
                    value={newRace.eventName}
                    onChange={(e) => setNewRace({ ...newRace, eventName: e.target.value })}
                    placeholder="e.g., Men's Varsity 8+ Final"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Boat Class
                    </label>
                    <select
                      value={newRace.boatClass}
                      onChange={(e) => setNewRace({ ...newRace, boatClass: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                    >
                      <option value="8+">8+</option>
                      <option value="4+">4+</option>
                      <option value="4-">4-</option>
                      <option value="4x">4x</option>
                      <option value="2-">2-</option>
                      <option value="2x">2x</option>
                      <option value="1x">1x</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Distance (m)
                    </label>
                    <input
                      type="number"
                      value={newRace.distanceMeters}
                      onChange={(e) => setNewRace({ ...newRace, distanceMeters: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isHeadRace"
                    checked={newRace.isHeadRace}
                    onChange={(e) => setNewRace({ ...newRace, isHeadRace: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <label htmlFor="isHeadRace" className="text-sm text-gray-700 dark:text-gray-300">
                    Head Race (time trial)
                  </label>
                </div>
              </div>

              <div className="flex gap-2 justify-end mt-6">
                <button
                  onClick={() => setShowAddRaceModal(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddRace}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg"
                >
                  Add Race
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default RacingPage;
```

**Step 2: Add route in App.jsx**

Add import and route for `/racing`.

**Verification:** Build frontend and verify page loads

---

## Phase 5D: Integration & Testing (Tasks 14-15)

### Task 14: Update Prisma Schema

**Files:**
- Modify: `prisma/schema.prisma`

**Step 1: Add racing models**

Add to schema.prisma:

```prisma
model Regatta {
  id          String   @id @default(uuid())
  teamId      String
  name        String
  location    String?
  date        DateTime
  courseType  String?
  conditions  Json?
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  team        Team     @relation(fields: [teamId], references: [id], onDelete: Cascade)
  races       Race[]

  @@map("regattas")
}

model Race {
  id            String   @id @default(uuid())
  regattaId     String
  eventName     String
  boatClass     String
  distanceMeters Int     @default(2000)
  isHeadRace    Boolean  @default(false)
  scheduledTime DateTime?

  regatta       Regatta      @relation(fields: [regattaId], references: [id], onDelete: Cascade)
  results       RaceResult[]

  @@map("races")
}

model RaceResult {
  id                String   @id @default(uuid())
  raceId            String
  teamName          String
  isOwnTeam         Boolean  @default(false)
  lineupId          String?
  finishTimeSeconds Float?
  place             Int?
  marginBackSeconds Float?
  rawSpeed          Float?
  adjustedSpeed     Float?

  race              Race     @relation(fields: [raceId], references: [id], onDelete: Cascade)
  lineup            Lineup?  @relation(fields: [lineupId], references: [id])

  @@map("race_results")
}

model ExternalTeam {
  id         String   @id @default(uuid())
  name       String   @unique
  conference String?
  division   String?
  createdAt  DateTime @default(now())

  @@map("external_teams")
}

model TeamSpeedEstimate {
  id               String   @id @default(uuid())
  teamId           String
  boatClass        String
  season           String?
  rawSpeed         Float?
  adjustedSpeed    Float?
  confidenceScore  Float?
  sampleCount      Int      @default(0)
  lastCalculatedAt DateTime @default(now())

  team             Team     @relation(fields: [teamId], references: [id], onDelete: Cascade)

  @@unique([teamId, boatClass, season])
  @@map("team_speed_estimates")
}
```

**Step 2: Run migration**

```bash
npx prisma migrate dev --name add_racing_models
```

**Verification:** Migration runs successfully

---

### Task 15: Update Server Index and Test

**Files:**
- Modify: `server/index.js`

**Step 1: Ensure all routes are mounted**

Verify these imports and routes are present:
```javascript
import regattaRoutes from './routes/regattas.js';
import teamRankingsRoutes from './routes/teamRankings.js';
import externalTeamsRoutes from './routes/externalTeams.js';

// ...

app.use('/api/v1/regattas', regattaRoutes);
app.use('/api/v1/team-rankings', teamRankingsRoutes);
app.use('/api/v1/external-teams', externalTeamsRoutes);
```

**Step 2: Test all endpoints**

```bash
# Start server
npm run dev

# Test regatta creation
curl -X POST http://localhost:3001/api/v1/regattas \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Test Regatta","date":"2025-01-20","courseType":"2000m"}'

# Test rankings
curl http://localhost:3001/api/v1/team-rankings/boat-classes \
  -H "Authorization: Bearer $TOKEN"
```

**Verification:** All endpoints respond correctly

---

## Summary

Phase 5 implements the Racing system with:
- **15 tasks** across 4 sub-phases
- **Regatta/race** management and results entry
- **Speed calculation** with course/conditions normalization
- **CMAX-style** team rankings
- **External team** tracking and head-to-head comparison

Total new files: ~12
Modified files: ~4
Estimated API endpoints: 15+
