# Phase 4: Selection Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build seat racing system with data entry, margin calculation, Elo ranking, auto-plan generator, and basic AI integration (Ollama).

**Architecture:** Follow Phase 1-3 patterns - service layer, v1 routes with auth/team isolation, Zustand stores.

**Reference Files:**
- Service pattern: `server/services/lineupService.js`
- Route pattern: `server/routes/lineups.js`
- Auth middleware: `server/middleware/auth.js`
- Store pattern: `src/store/lineupStore.js`

---

## Phase 4A: Seat Racing Backend (Tasks 1-5)

### Task 1: Create Seat Race Service

**Files:**
- Create: `server/services/seatRaceService.js`

**Step 1: Create seat race service with session CRUD**

```javascript
import { prisma } from '../db/connection.js';

/**
 * Create a new seat race session
 */
export async function createSession(teamId, data) {
  const { date, location, conditions, boatClass, description } = data;

  const session = await prisma.seatRaceSession.create({
    data: {
      teamId,
      date: new Date(date),
      location,
      conditions,
      boatClass,
      description,
    },
  });

  return session;
}

/**
 * Get all sessions for a team
 */
export async function getSessions(teamId, options = {}) {
  const { limit = 20, offset = 0 } = options;

  const sessions = await prisma.seatRaceSession.findMany({
    where: { teamId },
    include: {
      _count: { select: { pieces: true } },
    },
    orderBy: { date: 'desc' },
    take: limit,
    skip: offset,
  });

  return sessions;
}

/**
 * Get session with all pieces, boats, and assignments
 */
export async function getSessionById(teamId, sessionId) {
  const session = await prisma.seatRaceSession.findFirst({
    where: { id: sessionId, teamId },
    include: {
      pieces: {
        orderBy: { sequenceOrder: 'asc' },
        include: {
          boats: {
            include: {
              assignments: {
                include: {
                  athlete: {
                    select: { id: true, firstName: true, lastName: true, side: true },
                  },
                },
                orderBy: { seatNumber: 'desc' },
              },
            },
          },
        },
      },
    },
  });

  if (!session) throw new Error('Session not found');
  return session;
}

/**
 * Update session
 */
export async function updateSession(teamId, sessionId, data) {
  const existing = await prisma.seatRaceSession.findFirst({
    where: { id: sessionId, teamId },
  });
  if (!existing) throw new Error('Session not found');

  return prisma.seatRaceSession.update({
    where: { id: sessionId },
    data: {
      date: data.date ? new Date(data.date) : undefined,
      location: data.location,
      conditions: data.conditions,
      boatClass: data.boatClass,
      description: data.description,
    },
  });
}

/**
 * Delete session and all related data
 */
export async function deleteSession(teamId, sessionId) {
  const existing = await prisma.seatRaceSession.findFirst({
    where: { id: sessionId, teamId },
  });
  if (!existing) throw new Error('Session not found');

  await prisma.seatRaceSession.delete({
    where: { id: sessionId },
  });

  return { success: true };
}
```

**Verification:** `node --check server/services/seatRaceService.js`

---

### Task 2: Add Piece and Boat Management to Seat Race Service

**Files:**
- Modify: `server/services/seatRaceService.js`

**Step 1: Add piece CRUD operations**

```javascript
/**
 * Add a piece to a session
 */
export async function addPiece(teamId, sessionId, data) {
  const session = await prisma.seatRaceSession.findFirst({
    where: { id: sessionId, teamId },
  });
  if (!session) throw new Error('Session not found');

  const pieceCount = await prisma.seatRacePiece.count({
    where: { sessionId },
  });

  const piece = await prisma.seatRacePiece.create({
    data: {
      sessionId,
      sequenceOrder: pieceCount + 1,
      distanceMeters: data.distanceMeters,
      direction: data.direction,
      notes: data.notes,
    },
  });

  return piece;
}

/**
 * Update piece with times
 */
export async function updatePiece(teamId, pieceId, data) {
  const piece = await prisma.seatRacePiece.findFirst({
    where: { id: pieceId },
    include: { session: true },
  });
  if (!piece || piece.session.teamId !== teamId) {
    throw new Error('Piece not found');
  }

  return prisma.seatRacePiece.update({
    where: { id: pieceId },
    data: {
      distanceMeters: data.distanceMeters,
      direction: data.direction,
      notes: data.notes,
    },
  });
}

/**
 * Add boat to a piece
 */
export async function addBoat(teamId, pieceId, data) {
  const piece = await prisma.seatRacePiece.findFirst({
    where: { id: pieceId },
    include: { session: true },
  });
  if (!piece || piece.session.teamId !== teamId) {
    throw new Error('Piece not found');
  }

  const boat = await prisma.seatRaceBoat.create({
    data: {
      pieceId,
      name: data.name,
      shellName: data.shellName,
      finishTimeSeconds: data.finishTimeSeconds,
      handicapSeconds: data.handicapSeconds || 0,
    },
  });

  return boat;
}

/**
 * Update boat (times, handicap)
 */
export async function updateBoat(teamId, boatId, data) {
  const boat = await prisma.seatRaceBoat.findFirst({
    where: { id: boatId },
    include: { piece: { include: { session: true } } },
  });
  if (!boat || boat.piece.session.teamId !== teamId) {
    throw new Error('Boat not found');
  }

  return prisma.seatRaceBoat.update({
    where: { id: boatId },
    data: {
      name: data.name,
      shellName: data.shellName,
      finishTimeSeconds: data.finishTimeSeconds,
      handicapSeconds: data.handicapSeconds,
    },
  });
}

/**
 * Set athlete assignments for a boat
 */
export async function setBoatAssignments(teamId, boatId, assignments) {
  const boat = await prisma.seatRaceBoat.findFirst({
    where: { id: boatId },
    include: { piece: { include: { session: true } } },
  });
  if (!boat || boat.piece.session.teamId !== teamId) {
    throw new Error('Boat not found');
  }

  // Clear existing
  await prisma.seatRaceAssignment.deleteMany({
    where: { boatId },
  });

  // Create new
  if (assignments.length > 0) {
    await prisma.seatRaceAssignment.createMany({
      data: assignments.map(a => ({
        boatId,
        athleteId: a.athleteId,
        seatNumber: a.seatNumber,
        side: a.side,
      })),
    });
  }

  return prisma.seatRaceBoat.findUnique({
    where: { id: boatId },
    include: {
      assignments: {
        include: {
          athlete: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      },
    },
  });
}
```

**Verification:** `node --check server/services/seatRaceService.js`

---

### Task 3: Create Seat Race Routes

**Files:**
- Create: `server/routes/seatRaces.js`
- Modify: `server/index.js`

**Step 1: Create routes file**

```javascript
import express from 'express';
import { authenticateToken, requireTeam, requireRole } from '../middleware/auth.js';
import * as seatRaceService from '../services/seatRaceService.js';

const router = express.Router();

// All routes require authentication and team context
router.use(authenticateToken);
router.use(requireTeam);

// Sessions
router.get('/', async (req, res) => {
  try {
    const sessions = await seatRaceService.getSessions(req.teamId, {
      limit: parseInt(req.query.limit) || 20,
      offset: parseInt(req.query.offset) || 0,
    });
    res.json({ success: true, data: { sessions } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/', requireRole(['OWNER', 'COACH']), async (req, res) => {
  try {
    const session = await seatRaceService.createSession(req.teamId, req.body);
    res.status(201).json({ success: true, data: { session } });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const session = await seatRaceService.getSessionById(req.teamId, req.params.id);
    res.json({ success: true, data: { session } });
  } catch (error) {
    res.status(404).json({ success: false, error: error.message });
  }
});

router.patch('/:id', requireRole(['OWNER', 'COACH']), async (req, res) => {
  try {
    const session = await seatRaceService.updateSession(req.teamId, req.params.id, req.body);
    res.json({ success: true, data: { session } });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.delete('/:id', requireRole(['OWNER', 'COACH']), async (req, res) => {
  try {
    await seatRaceService.deleteSession(req.teamId, req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Pieces
router.post('/:sessionId/pieces', requireRole(['OWNER', 'COACH']), async (req, res) => {
  try {
    const piece = await seatRaceService.addPiece(req.teamId, req.params.sessionId, req.body);
    res.status(201).json({ success: true, data: { piece } });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.patch('/pieces/:pieceId', requireRole(['OWNER', 'COACH']), async (req, res) => {
  try {
    const piece = await seatRaceService.updatePiece(req.teamId, req.params.pieceId, req.body);
    res.json({ success: true, data: { piece } });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Boats
router.post('/pieces/:pieceId/boats', requireRole(['OWNER', 'COACH']), async (req, res) => {
  try {
    const boat = await seatRaceService.addBoat(req.teamId, req.params.pieceId, req.body);
    res.status(201).json({ success: true, data: { boat } });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.patch('/boats/:boatId', requireRole(['OWNER', 'COACH']), async (req, res) => {
  try {
    const boat = await seatRaceService.updateBoat(req.teamId, req.params.boatId, req.body);
    res.json({ success: true, data: { boat } });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.put('/boats/:boatId/assignments', requireRole(['OWNER', 'COACH']), async (req, res) => {
  try {
    const boat = await seatRaceService.setBoatAssignments(
      req.teamId,
      req.params.boatId,
      req.body.assignments || []
    );
    res.json({ success: true, data: { boat } });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

export default router;
```

**Step 2: Mount routes in server/index.js**

Add import and route mounting:
```javascript
import seatRaceRoutes from './routes/seatRaces.js';
// ...
app.use('/api/v1/seat-races', seatRaceRoutes);
```

**Verification:** Start server and test with curl

---

### Task 4: Create Margin Calculation Service

**Files:**
- Create: `server/services/marginCalculationService.js`

**Step 1: Implement margin swing calculation**

```javascript
/**
 * Margin Calculation Service
 *
 * Implements the margin swing formula for seat racing analysis:
 * Swing = Margin₂ - Margin₁
 * Performance_Diff = Swing ÷ 2
 */

/**
 * Calculate margin between two boats in a piece
 */
export function calculateMargin(boat1Time, boat2Time, boat1Handicap = 0, boat2Handicap = 0) {
  const adjustedTime1 = boat1Time - boat1Handicap;
  const adjustedTime2 = boat2Time - boat2Handicap;
  return adjustedTime2 - adjustedTime1; // Positive = boat1 wins
}

/**
 * Calculate swing between two pieces
 * Returns the change in margin after a swap
 */
export function calculateSwing(margin1, margin2) {
  return margin2 - margin1;
}

/**
 * Estimate individual performance difference
 * Assumes swap was made, so swing/2 gives individual contribution
 */
export function estimatePerformanceDiff(swing) {
  return swing / 2;
}

/**
 * Analyze a pair of pieces (baseline + swap)
 */
export function analyzePiecePair(piece1Boats, piece2Boats, swappedAthletes) {
  if (piece1Boats.length !== 2 || piece2Boats.length !== 2) {
    throw new Error('Piece pair analysis requires exactly 2 boats per piece');
  }

  // Sort boats consistently
  const [boat1P1, boat2P1] = piece1Boats.sort((a, b) => a.name.localeCompare(b.name));
  const [boat1P2, boat2P2] = piece2Boats.sort((a, b) => a.name.localeCompare(b.name));

  const margin1 = calculateMargin(
    boat1P1.finishTimeSeconds,
    boat2P1.finishTimeSeconds,
    boat1P1.handicapSeconds,
    boat2P1.handicapSeconds
  );

  const margin2 = calculateMargin(
    boat1P2.finishTimeSeconds,
    boat2P2.finishTimeSeconds,
    boat1P2.handicapSeconds,
    boat2P2.handicapSeconds
  );

  const swing = calculateSwing(margin1, margin2);
  const performanceDiff = estimatePerformanceDiff(swing);

  return {
    margin1,
    margin2,
    swing,
    performanceDiff,
    swappedAthletes,
    // Positive performanceDiff means athlete in better position after swap performed better
    interpretation: performanceDiff > 0
      ? `${swappedAthletes[0]?.name || 'Athlete A'} is ~${Math.abs(performanceDiff).toFixed(2)}s faster`
      : performanceDiff < 0
      ? `${swappedAthletes[1]?.name || 'Athlete B'} is ~${Math.abs(performanceDiff).toFixed(2)}s faster`
      : 'Athletes appear evenly matched',
  };
}

/**
 * Analyze all piece pairs in a session
 */
export function analyzeSession(session) {
  const results = [];
  const pieces = session.pieces || [];

  // Analyze consecutive pairs
  for (let i = 0; i < pieces.length - 1; i += 2) {
    const piece1 = pieces[i];
    const piece2 = pieces[i + 1];

    if (!piece1 || !piece2) continue;

    // Find swapped athletes
    const swapped = findSwappedAthletes(piece1.boats, piece2.boats);

    try {
      const analysis = analyzePiecePair(piece1.boats, piece2.boats, swapped);
      results.push({
        piece1Id: piece1.id,
        piece2Id: piece2.id,
        piece1Order: piece1.sequenceOrder,
        piece2Order: piece2.sequenceOrder,
        ...analysis,
      });
    } catch (error) {
      // Skip invalid pairs
    }
  }

  return results;
}

/**
 * Find which athletes were swapped between pieces
 */
function findSwappedAthletes(boats1, boats2) {
  const swapped = [];

  for (const boat1 of boats1) {
    const boat2Same = boats2.find(b => b.name === boat1.name);
    if (!boat2Same) continue;

    const athletes1 = new Set(boat1.assignments?.map(a => a.athleteId) || []);
    const athletes2 = new Set(boat2Same.assignments?.map(a => a.athleteId) || []);

    // Athletes in boat1 piece1 but not piece2
    for (const id of athletes1) {
      if (!athletes2.has(id)) {
        const assignment = boat1.assignments?.find(a => a.athleteId === id);
        swapped.push(assignment?.athlete);
      }
    }
  }

  return swapped.filter(Boolean);
}
```

**Verification:** `node --check server/services/marginCalculationService.js`

---

### Task 5: Create Elo Rating Service

**Files:**
- Create: `server/services/eloRatingService.js`

**Step 1: Implement Elo rating system**

```javascript
import { prisma } from '../db/connection.js';

const DEFAULT_RATING = 1000;
const K_FACTOR = 32; // How quickly ratings change

/**
 * Calculate expected score based on ratings
 */
function expectedScore(ratingA, ratingB) {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

/**
 * Calculate new Elo rating
 */
function calculateNewRating(currentRating, expectedScore, actualScore, k = K_FACTOR) {
  return currentRating + k * (actualScore - expectedScore);
}

/**
 * Get or create athlete rating
 */
export async function getOrCreateRating(athleteId, teamId, ratingType = 'seat_race_elo') {
  let rating = await prisma.athleteRating.findFirst({
    where: { athleteId, teamId, ratingType },
  });

  if (!rating) {
    rating = await prisma.athleteRating.create({
      data: {
        athleteId,
        teamId,
        ratingType,
        ratingValue: DEFAULT_RATING,
        confidenceScore: 0,
        racesCount: 0,
      },
    });
  }

  return rating;
}

/**
 * Update ratings after a seat race result
 */
export async function updateRatingsFromSeatRace(teamId, athlete1Id, athlete2Id, performanceDiff) {
  const rating1 = await getOrCreateRating(athlete1Id, teamId);
  const rating2 = await getOrCreateRating(athlete2Id, teamId);

  // Determine actual scores (1 = win, 0.5 = draw, 0 = loss)
  let score1, score2;
  if (Math.abs(performanceDiff) < 0.5) {
    // Essentially a draw
    score1 = 0.5;
    score2 = 0.5;
  } else if (performanceDiff > 0) {
    // Athlete 1 won
    score1 = 1;
    score2 = 0;
  } else {
    // Athlete 2 won
    score1 = 0;
    score2 = 1;
  }

  const expected1 = expectedScore(rating1.ratingValue, rating2.ratingValue);
  const expected2 = expectedScore(rating2.ratingValue, rating1.ratingValue);

  // Scale K factor by margin
  const marginFactor = Math.min(2, 1 + Math.abs(performanceDiff) / 5);
  const adjustedK = K_FACTOR * marginFactor;

  const newRating1 = calculateNewRating(rating1.ratingValue, expected1, score1, adjustedK);
  const newRating2 = calculateNewRating(rating2.ratingValue, expected2, score2, adjustedK);

  // Update confidence based on races
  const newConfidence1 = Math.min(1, (rating1.racesCount + 1) / 10);
  const newConfidence2 = Math.min(1, (rating2.racesCount + 1) / 10);

  await Promise.all([
    prisma.athleteRating.update({
      where: { id: rating1.id },
      data: {
        ratingValue: newRating1,
        confidenceScore: newConfidence1,
        racesCount: { increment: 1 },
        lastCalculatedAt: new Date(),
      },
    }),
    prisma.athleteRating.update({
      where: { id: rating2.id },
      data: {
        ratingValue: newRating2,
        confidenceScore: newConfidence2,
        racesCount: { increment: 1 },
        lastCalculatedAt: new Date(),
      },
    }),
  ]);

  return {
    athlete1: { id: athlete1Id, oldRating: rating1.ratingValue, newRating: newRating1 },
    athlete2: { id: athlete2Id, oldRating: rating2.ratingValue, newRating: newRating2 },
  };
}

/**
 * Get team rankings
 */
export async function getTeamRankings(teamId, options = {}) {
  const { ratingType = 'seat_race_elo', minRaces = 0 } = options;

  const ratings = await prisma.athleteRating.findMany({
    where: {
      teamId,
      ratingType,
      racesCount: { gte: minRaces },
    },
    include: {
      athlete: {
        select: { id: true, firstName: true, lastName: true, side: true },
      },
    },
    orderBy: { ratingValue: 'desc' },
  });

  return ratings.map((r, index) => ({
    rank: index + 1,
    athlete: r.athlete,
    rating: Math.round(r.ratingValue),
    confidence: r.confidenceScore,
    racesCount: r.racesCount,
    lastUpdated: r.lastCalculatedAt,
  }));
}

/**
 * Recalculate all ratings from session history
 */
export async function recalculateAllRatings(teamId) {
  // Reset all ratings
  await prisma.athleteRating.updateMany({
    where: { teamId, ratingType: 'seat_race_elo' },
    data: { ratingValue: DEFAULT_RATING, racesCount: 0, confidenceScore: 0 },
  });

  // Get all sessions chronologically
  const sessions = await prisma.seatRaceSession.findMany({
    where: { teamId },
    include: {
      pieces: {
        orderBy: { sequenceOrder: 'asc' },
        include: {
          boats: {
            include: { assignments: true },
          },
        },
      },
    },
    orderBy: { date: 'asc' },
  });

  // Process each session
  for (const session of sessions) {
    // Import would cause circular dependency, so inline the logic
    // This would call analyzeSession and update ratings
  }

  return getTeamRankings(teamId);
}
```

**Verification:** `node --check server/services/eloRatingService.js`

---

## Phase 4B: Rankings & Analysis Routes (Tasks 6-8)

### Task 6: Add Rankings Routes

**Files:**
- Create: `server/routes/rankings.js`
- Modify: `server/index.js`

**Step 1: Create rankings routes**

```javascript
import express from 'express';
import { authenticateToken, requireTeam } from '../middleware/auth.js';
import * as eloRatingService from '../services/eloRatingService.js';

const router = express.Router();

router.use(authenticateToken);
router.use(requireTeam);

// Get team rankings
router.get('/', async (req, res) => {
  try {
    const rankings = await eloRatingService.getTeamRankings(req.teamId, {
      ratingType: req.query.type || 'seat_race_elo',
      minRaces: parseInt(req.query.minRaces) || 0,
    });
    res.json({ success: true, data: { rankings } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get individual athlete rating
router.get('/athlete/:athleteId', async (req, res) => {
  try {
    const rating = await eloRatingService.getOrCreateRating(
      req.params.athleteId,
      req.teamId
    );
    res.json({ success: true, data: { rating } });
  } catch (error) {
    res.status(404).json({ success: false, error: error.message });
  }
});

// Recalculate all ratings (admin only)
router.post('/recalculate', async (req, res) => {
  try {
    const rankings = await eloRatingService.recalculateAllRatings(req.teamId);
    res.json({ success: true, data: { rankings } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
```

**Step 2: Mount in server/index.js**

```javascript
import rankingsRoutes from './routes/rankings.js';
app.use('/api/v1/rankings', rankingsRoutes);
```

**Verification:** Test endpoints

---

### Task 7: Add Session Analysis Endpoint

**Files:**
- Modify: `server/routes/seatRaces.js`
- Modify: `server/services/seatRaceService.js`

**Step 1: Add analysis endpoint**

Add to seatRaces.js:
```javascript
import * as marginService from '../services/marginCalculationService.js';
import * as eloService from '../services/eloRatingService.js';

// Analyze a session
router.get('/:id/analysis', async (req, res) => {
  try {
    const session = await seatRaceService.getSessionById(req.teamId, req.params.id);
    const analysis = marginService.analyzeSession(session);
    res.json({ success: true, data: { session, analysis } });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Process session and update ratings
router.post('/:id/process', requireRole(['OWNER', 'COACH']), async (req, res) => {
  try {
    const session = await seatRaceService.getSessionById(req.teamId, req.params.id);
    const analysis = marginService.analyzeSession(session);

    const ratingUpdates = [];
    for (const result of analysis) {
      if (result.swappedAthletes.length === 2) {
        const update = await eloService.updateRatingsFromSeatRace(
          req.teamId,
          result.swappedAthletes[0].id,
          result.swappedAthletes[1].id,
          result.performanceDiff
        );
        ratingUpdates.push(update);
      }
    }

    res.json({ success: true, data: { analysis, ratingUpdates } });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});
```

**Verification:** Test with curl

---

### Task 8: Create Auto-Plan Generator Service

**Files:**
- Create: `server/services/autoPlanService.js`

**Step 1: Implement auto-plan generator**

```javascript
/**
 * Auto-Plan Generator
 *
 * Generates optimal seat racing schedules to maximize comparisons
 * with minimum pieces.
 */

/**
 * Generate a round-robin schedule for athletes
 */
export function generateRoundRobin(athletes, boatClass) {
  const n = athletes.length;
  const seatsPerBoat = getSeatsPerBoat(boatClass);

  if (n < seatsPerBoat * 2) {
    throw new Error(`Need at least ${seatsPerBoat * 2} athletes for ${boatClass} seat racing`);
  }

  const schedule = [];
  const pairs = [];

  // Generate all unique pairs
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      pairs.push([athletes[i], athletes[j]]);
    }
  }

  // Group into sessions (each session = 2 pieces with one swap)
  for (const [athlete1, athlete2] of pairs) {
    // Find other athletes to fill boats
    const others = athletes.filter(a => a.id !== athlete1.id && a.id !== athlete2.id);

    if (others.length < (seatsPerBoat * 2) - 2) continue;

    const fillers = others.slice(0, (seatsPerBoat * 2) - 2);
    const midpoint = Math.floor(fillers.length / 2);

    schedule.push({
      comparing: [athlete1, athlete2],
      piece1: {
        boatA: [athlete1, ...fillers.slice(0, midpoint)],
        boatB: [athlete2, ...fillers.slice(midpoint)],
      },
      piece2: {
        boatA: [athlete2, ...fillers.slice(0, midpoint)], // Swapped
        boatB: [athlete1, ...fillers.slice(midpoint)],
      },
    });
  }

  return schedule;
}

/**
 * Generate efficient schedule (fewer pieces, more comparisons per session)
 */
export function generateEfficientSchedule(athletes, boatClass, maxSessions) {
  const seatsPerBoat = getSeatsPerBoat(boatClass);
  const schedule = [];
  const compared = new Set();

  // Priority queue of pairs not yet compared
  const pendingPairs = [];
  for (let i = 0; i < athletes.length; i++) {
    for (let j = i + 1; j < athletes.length; j++) {
      pendingPairs.push([athletes[i].id, athletes[j].id]);
    }
  }

  let sessionCount = 0;
  while (pendingPairs.length > 0 && sessionCount < maxSessions) {
    const pair = pendingPairs.shift();
    const pairKey = pair.sort().join('-');

    if (compared.has(pairKey)) continue;

    const athlete1 = athletes.find(a => a.id === pair[0]);
    const athlete2 = athletes.find(a => a.id === pair[1]);

    const others = athletes.filter(a => a.id !== pair[0] && a.id !== pair[1]);
    if (others.length < (seatsPerBoat * 2) - 2) continue;

    const fillers = others.slice(0, (seatsPerBoat * 2) - 2);
    const midpoint = Math.floor(fillers.length / 2);

    schedule.push({
      sessionNumber: sessionCount + 1,
      comparing: [athlete1, athlete2],
      boats: {
        boatA: {
          piece1: [athlete1, ...fillers.slice(0, midpoint)],
          piece2: [athlete2, ...fillers.slice(0, midpoint)],
        },
        boatB: {
          piece1: [athlete2, ...fillers.slice(midpoint)],
          piece2: [athlete1, ...fillers.slice(midpoint)],
        },
      },
      instructions: `Swap ${athlete1.firstName} and ${athlete2.firstName} between pieces`,
    });

    compared.add(pairKey);
    sessionCount++;
  }

  return {
    schedule,
    totalSessions: schedule.length,
    comparisonsNeeded: (athletes.length * (athletes.length - 1)) / 2,
    comparisonsScheduled: compared.size,
  };
}

function getSeatsPerBoat(boatClass) {
  const seats = {
    '8+': 8,
    '4+': 4,
    '4-': 4,
    '4x': 4,
    '2-': 2,
    '2x': 2,
    '1x': 1,
  };
  return seats[boatClass] || 4;
}

/**
 * Export for route usage
 */
export async function generatePlan(teamId, options) {
  const { athleteIds, boatClass, maxSessions = 10 } = options;

  // This would fetch athletes from DB
  // For now, expect athletes array in options
  if (!options.athletes || options.athletes.length < 4) {
    throw new Error('Need at least 4 athletes for seat racing');
  }

  return generateEfficientSchedule(options.athletes, boatClass, maxSessions);
}
```

**Verification:** `node --check server/services/autoPlanService.js`

---

## Phase 4C: Frontend Stores & Components (Tasks 9-14)

### Task 9: Create Seat Race Store

**Files:**
- Create: `src/store/seatRaceStore.js`

**Step 1: Create Zustand store**

```javascript
import { create } from 'zustand';

const API_BASE = '/api/v1/seat-races';

const useSeatRaceStore = create((set, get) => ({
  sessions: [],
  currentSession: null,
  analysis: null,
  loading: false,
  error: null,

  // Fetch all sessions
  fetchSessions: async () => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(API_BASE, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      set({ sessions: data.data.sessions, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  // Fetch single session with details
  fetchSession: async (sessionId) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API_BASE}/${sessionId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      set({ currentSession: data.data.session, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  // Create session
  createSession: async (sessionData) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify(sessionData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      set((state) => ({
        sessions: [data.data.session, ...state.sessions],
        loading: false,
      }));
      return data.data.session;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Add piece to session
  addPiece: async (sessionId, pieceData) => {
    try {
      const res = await fetch(`${API_BASE}/${sessionId}/pieces`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify(pieceData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await get().fetchSession(sessionId);
      return data.data.piece;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  // Add boat to piece
  addBoat: async (pieceId, boatData) => {
    try {
      const res = await fetch(`${API_BASE}/pieces/${pieceId}/boats`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify(boatData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      return data.data.boat;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  // Update boat time
  updateBoatTime: async (boatId, finishTimeSeconds) => {
    try {
      const res = await fetch(`${API_BASE}/boats/${boatId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({ finishTimeSeconds }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      return data.data.boat;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  // Analyze session
  analyzeSession: async (sessionId) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API_BASE}/${sessionId}/analysis`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      set({ analysis: data.data.analysis, loading: false });
      return data.data.analysis;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Process and update ratings
  processSession: async (sessionId) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API_BASE}/${sessionId}/process`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      set({ loading: false });
      return data.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));

export default useSeatRaceStore;
```

**Verification:** Import in test file

---

### Task 10: Create Rankings Store

**Files:**
- Create: `src/store/rankingsStore.js`

**Step 1: Create rankings store**

```javascript
import { create } from 'zustand';

const API_BASE = '/api/v1/rankings';

const useRankingsStore = create((set) => ({
  rankings: [],
  loading: false,
  error: null,

  fetchRankings: async (options = {}) => {
    set({ loading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (options.type) params.append('type', options.type);
      if (options.minRaces) params.append('minRaces', options.minRaces);

      const res = await fetch(`${API_BASE}?${params}`, {
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

  recalculateRankings: async () => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API_BASE}/recalculate`, {
        method: 'POST',
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

  clearError: () => set({ error: null }),
}));

export default useRankingsStore;
```

**Verification:** Import in test file

---

### Task 11: Create Seat Race Session List Component

**Files:**
- Create: `src/components/SeatRacing/SeatRaceSessionList.jsx`

**Step 1: Create session list component**

```javascript
import React, { useEffect } from 'react';
import useSeatRaceStore from '../../store/seatRaceStore';

function SeatRaceSessionList({ onSelectSession, onCreateNew }) {
  const { sessions, loading, error, fetchSessions } = useSeatRaceStore();

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading && sessions.length === 0) {
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
          Seat Racing Sessions
        </h2>
        <button
          onClick={onCreateNew}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Session
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg">
          {error}
        </div>
      )}

      {sessions.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <div className="text-5xl mb-3">🏁</div>
          <p>No seat racing sessions yet</p>
          <p className="text-sm mt-2">Create your first session to start tracking athlete performance</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {sessions.map((session) => (
            <div
              key={session.id}
              onClick={() => onSelectSession(session)}
              className="p-4 bg-white/50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 cursor-pointer transition-all"
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-800 dark:text-gray-200">
                      {formatDate(session.date)}
                    </span>
                    <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full">
                      {session.boatClass}
                    </span>
                  </div>
                  {session.location && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {session.location}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    {session._count?.pieces || 0} pieces
                  </p>
                </div>
                {session.conditions && (
                  <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded">
                    {session.conditions}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SeatRaceSessionList;
```

**Verification:** Import without errors

---

### Task 12: Create Seat Race Entry Form Component

**Files:**
- Create: `src/components/SeatRacing/SeatRaceEntryForm.jsx`

**Step 1: Create data entry form**

```javascript
import React, { useState } from 'react';
import useSeatRaceStore from '../../store/seatRaceStore';
import useAthleteStore from '../../store/athleteStore';

function SeatRaceEntryForm({ session, onClose }) {
  const { addPiece, addBoat, updateBoatTime, fetchSession } = useSeatRaceStore();
  const { athletes } = useAthleteStore();

  const [pieces, setPieces] = useState(session?.pieces || []);
  const [newPiece, setNewPiece] = useState({
    distanceMeters: 500,
    direction: 'upstream',
  });
  const [saving, setSaving] = useState(false);

  const handleAddPiece = async () => {
    setSaving(true);
    try {
      const piece = await addPiece(session.id, newPiece);
      setPieces([...pieces, piece]);
      setNewPiece({ distanceMeters: 500, direction: 'upstream' });
    } catch (error) {
      console.error('Failed to add piece:', error);
    }
    setSaving(false);
  };

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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
          Session Data Entry
        </h3>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Existing Pieces */}
      <div className="space-y-4">
        {pieces.map((piece, index) => (
          <div key={piece.id} className="p-4 bg-white/50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-3">
              <span className="font-medium text-gray-800 dark:text-gray-200">
                Piece {index + 1}
              </span>
              <span className="text-sm text-gray-500">
                {piece.distanceMeters}m {piece.direction}
              </span>
            </div>

            {/* Boats */}
            <div className="grid grid-cols-2 gap-4">
              {piece.boats?.map((boat) => (
                <div key={boat.id} className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <div className="font-medium text-sm mb-2">{boat.name}</div>
                  <input
                    type="text"
                    placeholder="0:00.0"
                    defaultValue={formatTime(boat.finishTimeSeconds)}
                    onBlur={(e) => {
                      const seconds = parseTime(e.target.value);
                      if (seconds) updateBoatTime(boat.id, seconds);
                    }}
                    className="w-full px-2 py-1 text-center rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Add New Piece */}
      <div className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl">
        <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-3">Add Piece</h4>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Distance (m)
            </label>
            <input
              type="number"
              value={newPiece.distanceMeters}
              onChange={(e) => setNewPiece({ ...newPiece, distanceMeters: parseInt(e.target.value) })}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Direction
            </label>
            <select
              value={newPiece.direction}
              onChange={(e) => setNewPiece({ ...newPiece, direction: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
            >
              <option value="upstream">Upstream</option>
              <option value="downstream">Downstream</option>
            </select>
          </div>
        </div>
        <button
          onClick={handleAddPiece}
          disabled={saving}
          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg disabled:opacity-50"
        >
          {saving ? 'Adding...' : 'Add Piece'}
        </button>
      </div>
    </div>
  );
}

export default SeatRaceEntryForm;
```

**Verification:** Import without errors

---

### Task 13: Create Rankings Display Component

**Files:**
- Create: `src/components/SeatRacing/RankingsDisplay.jsx`

**Step 1: Create rankings display**

```javascript
import React, { useEffect } from 'react';
import useRankingsStore from '../../store/rankingsStore';

function RankingsDisplay() {
  const { rankings, loading, error, fetchRankings, recalculateRankings } = useRankingsStore();

  useEffect(() => {
    fetchRankings();
  }, [fetchRankings]);

  const getRatingColor = (rating) => {
    if (rating >= 1200) return 'text-green-600 dark:text-green-400';
    if (rating >= 1000) return 'text-blue-600 dark:text-blue-400';
    if (rating >= 800) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  const getConfidenceBadge = (confidence) => {
    if (confidence >= 0.8) return { text: 'High', color: 'bg-green-100 text-green-700' };
    if (confidence >= 0.5) return { text: 'Medium', color: 'bg-yellow-100 text-yellow-700' };
    return { text: 'Low', color: 'bg-gray-100 text-gray-600' };
  };

  if (loading && rankings.length === 0) {
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
          Athlete Rankings
        </h2>
        <button
          onClick={recalculateRankings}
          disabled={loading}
          className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 flex items-center gap-1"
        >
          <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Recalculate
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg">
          {error}
        </div>
      )}

      {rankings.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <div className="text-5xl mb-3">📊</div>
          <p>No rankings yet</p>
          <p className="text-sm mt-2">Complete seat racing sessions to generate rankings</p>
        </div>
      ) : (
        <div className="bg-white/50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700">
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300">Rank</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300">Athlete</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-600 dark:text-gray-300">Rating</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-600 dark:text-gray-300">Races</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-600 dark:text-gray-300">Confidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {rankings.map((r) => {
                const confidence = getConfidenceBadge(r.confidence);
                return (
                  <tr key={r.athlete.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3">
                      <span className={`font-bold ${r.rank <= 3 ? 'text-orange-500' : 'text-gray-500'}`}>
                        #{r.rank}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-800 dark:text-gray-200">
                        {r.athlete.firstName} {r.athlete.lastName}
                      </div>
                      <div className="text-xs text-gray-500">{r.athlete.side}</div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-mono font-bold ${getRatingColor(r.rating)}`}>
                        {r.rating}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-600 dark:text-gray-400">
                      {r.racesCount}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 text-xs rounded-full ${confidence.color}`}>
                        {confidence.text}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default RankingsDisplay;
```

**Verification:** Import without errors

---

### Task 14: Create Seat Racing Page

**Files:**
- Create: `src/pages/SeatRacingPage.jsx`
- Modify: `src/App.jsx` (add route)

**Step 1: Create main page**

```javascript
import React, { useState } from 'react';
import SeatRaceSessionList from '../components/SeatRacing/SeatRaceSessionList';
import SeatRaceEntryForm from '../components/SeatRacing/SeatRaceEntryForm';
import RankingsDisplay from '../components/SeatRacing/RankingsDisplay';
import useSeatRaceStore from '../store/seatRaceStore';

function SeatRacingPage() {
  const [activeTab, setActiveTab] = useState('sessions');
  const [selectedSession, setSelectedSession] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { createSession } = useSeatRaceStore();

  const [newSession, setNewSession] = useState({
    date: new Date().toISOString().split('T')[0],
    location: '',
    conditions: 'calm',
    boatClass: '8+',
    description: '',
  });

  const handleCreateSession = async () => {
    try {
      const session = await createSession(newSession);
      setShowCreateModal(false);
      setSelectedSession(session);
      setNewSession({
        date: new Date().toISOString().split('T')[0],
        location: '',
        conditions: 'calm',
        boatClass: '8+',
        description: '',
      });
    } catch (error) {
      console.error('Failed to create session:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">
            Seat Racing
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Track athlete performance and generate rankings
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('sessions')}
            className={`pb-3 px-1 font-medium transition-colors ${
              activeTab === 'sessions'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
          >
            Sessions
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
        {activeTab === 'sessions' ? (
          selectedSession ? (
            <SeatRaceEntryForm
              session={selectedSession}
              onClose={() => setSelectedSession(null)}
            />
          ) : (
            <SeatRaceSessionList
              onSelectSession={setSelectedSession}
              onCreateNew={() => setShowCreateModal(true)}
            />
          )
        ) : (
          <RankingsDisplay />
        )}

        {/* Create Session Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowCreateModal(false)}
            />
            <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl">
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">
                New Seat Racing Session
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={newSession.date}
                    onChange={(e) => setNewSession({ ...newSession, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={newSession.location}
                    onChange={(e) => setNewSession({ ...newSession, location: e.target.value })}
                    placeholder="e.g., Lake Mercer"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Boat Class
                    </label>
                    <select
                      value={newSession.boatClass}
                      onChange={(e) => setNewSession({ ...newSession, boatClass: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                    >
                      <option value="8+">8+</option>
                      <option value="4+">4+</option>
                      <option value="4-">4-</option>
                      <option value="4x">4x</option>
                      <option value="2-">2-</option>
                      <option value="2x">2x</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Conditions
                    </label>
                    <select
                      value={newSession.conditions}
                      onChange={(e) => setNewSession({ ...newSession, conditions: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                    >
                      <option value="calm">Calm</option>
                      <option value="variable">Variable</option>
                      <option value="rough">Rough</option>
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
                  onClick={handleCreateSession}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg"
                >
                  Create Session
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SeatRacingPage;
```

**Step 2: Add route in App.jsx**

Add import and route for `/seat-racing`.

**Verification:** Build frontend and verify page loads

---

## Phase 4D: AI Integration (Tasks 15-17)

### Task 15: Create AI Service Adapter

**Files:**
- Create: `server/services/aiService.js`

**Step 1: Create pluggable AI service**

```javascript
/**
 * AI Service - Pluggable LLM adapter
 *
 * Starts with Ollama for local inference,
 * designed for easy swap to OpenAI/Anthropic later.
 */

const OLLAMA_BASE = process.env.OLLAMA_URL || 'http://localhost:11434';
const DEFAULT_MODEL = process.env.OLLAMA_MODEL || 'llama3.2';

/**
 * Query Ollama for completion
 */
async function queryOllama(prompt, options = {}) {
  const { model = DEFAULT_MODEL, temperature = 0.7 } = options;

  try {
    const response = await fetch(`${OLLAMA_BASE}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt,
        stream: false,
        options: { temperature },
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama error: ${response.status}`);
    }

    const data = await response.json();
    return data.response;
  } catch (error) {
    console.error('Ollama query failed:', error);
    return null;
  }
}

/**
 * Check if Ollama is available
 */
async function isOllamaAvailable() {
  try {
    const response = await fetch(`${OLLAMA_BASE}/api/tags`);
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Parse CSV columns using AI
 */
export async function parseCSVColumns(headers, sampleRow) {
  const prompt = `Given these CSV headers: ${JSON.stringify(headers)}
And a sample row: ${JSON.stringify(sampleRow)}

Map each column to one of these fields:
- firstName, lastName, email, side, weightKg
- test2kTime, test6kTime, distance, date
- ignore (for unmapped columns)

Return a JSON object mapping header names to field names.
Only output valid JSON, no explanation.`;

  const response = await queryOllama(prompt, { temperature: 0.1 });
  if (!response) return null;

  try {
    return JSON.parse(response);
  } catch {
    return null;
  }
}

/**
 * Match fuzzy athlete names
 */
export async function matchAthleteName(inputName, athleteList) {
  if (!athleteList.length) return null;

  const athleteNames = athleteList.map(a => `${a.firstName} ${a.lastName}`);
  const prompt = `Given the input name: "${inputName}"
And this list of athletes: ${JSON.stringify(athleteNames)}

Which athlete is the best match? Consider nicknames, abbreviations, typos.
Return only the exact matching name from the list, or "NO_MATCH" if none match.`;

  const response = await queryOllama(prompt, { temperature: 0.1 });
  if (!response || response.includes('NO_MATCH')) return null;

  return athleteList.find(a =>
    `${a.firstName} ${a.lastName}`.toLowerCase() === response.trim().toLowerCase()
  );
}

/**
 * Suggest lineup optimization
 */
export async function suggestLineup(athletes, boatClass, constraints = {}) {
  const athleteData = athletes.map(a => ({
    name: `${a.firstName} ${a.lastName}`,
    side: a.side,
    rating: a.rating || 1000,
    weight: a.weightKg,
  }));

  const prompt = `Create an optimal rowing lineup for a ${boatClass}.
Athletes: ${JSON.stringify(athleteData)}
Constraints: ${JSON.stringify(constraints)}

Consider:
- Higher rated athletes are faster
- Side preferences (Port/Starboard) should be respected
- Balance weight distribution
- Stroke seat should be a strong technical rower

Return a JSON array of seat assignments:
[{ "seat": 8, "athlete": "Name", "side": "Port" }, ...]`;

  const response = await queryOllama(prompt, { temperature: 0.3 });
  if (!response) return null;

  try {
    return JSON.parse(response);
  } catch {
    return null;
  }
}

export { isOllamaAvailable };
```

**Verification:** `node --check server/services/aiService.js`

---

### Task 16: Create AI Routes

**Files:**
- Create: `server/routes/ai.js`
- Modify: `server/index.js`

**Step 1: Create AI routes**

```javascript
import express from 'express';
import { authenticateToken, requireTeam, requireRole } from '../middleware/auth.js';
import * as aiService from '../services/aiService.js';

const router = express.Router();

router.use(authenticateToken);
router.use(requireTeam);

// Health check
router.get('/status', async (req, res) => {
  const available = await aiService.isOllamaAvailable();
  res.json({
    success: true,
    data: {
      provider: 'ollama',
      available,
      model: process.env.OLLAMA_MODEL || 'llama3.2',
    },
  });
});

// Parse CSV columns
router.post('/parse-csv', requireRole(['OWNER', 'COACH']), async (req, res) => {
  try {
    const { headers, sampleRow } = req.body;
    const mapping = await aiService.parseCSVColumns(headers, sampleRow);

    if (!mapping) {
      return res.status(503).json({
        success: false,
        error: 'AI service unavailable',
        fallback: 'manual',
      });
    }

    res.json({ success: true, data: { mapping } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Match athlete name
router.post('/match-name', requireRole(['OWNER', 'COACH']), async (req, res) => {
  try {
    const { inputName, athletes } = req.body;
    const match = await aiService.matchAthleteName(inputName, athletes);

    res.json({
      success: true,
      data: { match: match || null },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Suggest lineup
router.post('/suggest-lineup', requireRole(['OWNER', 'COACH']), async (req, res) => {
  try {
    const { athletes, boatClass, constraints } = req.body;
    const suggestion = await aiService.suggestLineup(athletes, boatClass, constraints);

    if (!suggestion) {
      return res.status(503).json({
        success: false,
        error: 'AI service unavailable',
      });
    }

    res.json({ success: true, data: { lineup: suggestion } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
```

**Step 2: Mount in server/index.js**

```javascript
import aiRoutes from './routes/ai.js';
app.use('/api/v1/ai', aiRoutes);
```

**Verification:** Test endpoints

---

### Task 17: Update Service Exports and Final Integration

**Files:**
- Modify: `server/services/index.js`
- Verify all routes mounted

**Step 1: Export all new services**

```javascript
export * from './seatRaceService.js';
export * from './marginCalculationService.js';
export * from './eloRatingService.js';
export * from './autoPlanService.js';
export * from './aiService.js';
```

**Step 2: Verify server/index.js has all routes**

Ensure these routes are mounted:
- `/api/v1/seat-races` - seatRaceRoutes
- `/api/v1/rankings` - rankingsRoutes
- `/api/v1/ai` - aiRoutes

**Verification:** Start server, test all endpoints, run frontend build

---

## Summary

Phase 4 implements the Selection system with:
- **17 tasks** across 4 sub-phases
- **Seat racing** data entry and session management
- **Margin calculation** for performance comparison
- **Elo rating** system for athlete rankings
- **Auto-plan generator** for scheduling sessions
- **AI integration** with Ollama adapter

Total new files: ~15
Modified files: ~5
Estimated API endpoints: 15+
