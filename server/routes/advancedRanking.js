import express from 'express';
import { authenticateToken, requireTeam, requireRole } from '../middleware/auth.js';
import prisma from '../db/connection.js';
import { fitBradleyTerryModel, computeProbabilityMatrix } from '../services/bradleyTerryService.js';
import { generateSwapSchedule, validateSchedule } from '../services/matrixPlannerService.js';
import {
  calculateCompositeRankings,
  getWeightProfile,
  DEFAULT_WEIGHT_PROFILES,
} from '../services/compositeRankingService.js';
import { getTeamRankingsBySide, getAthleteSideRatings } from '../services/eloRatingService.js';
import {
  recordPassiveObservation,
  recordSplitObservation,
  applyPendingObservations,
  processSessionForPassiveTracking,
  getAthletePassiveHistory,
  getTeamPassiveStats,
} from '../services/passiveEloService.js';
import logger from '../utils/logger.js';

const router = express.Router();

// All routes require authentication and team context
router.use(authenticateToken, requireTeam);

// ============================================
// BRADLEY-TERRY RANKINGS
// ============================================

/**
 * GET /api/v1/advanced-ranking/bradley-terry
 * Get Bradley-Terry model rankings for the team
 * Query params: teamId (optional, uses active team)
 */
router.get('/bradley-terry', async (req, res) => {
  try {
    const teamId = req.query.teamId || req.user.activeTeamId;

    if (!teamId) {
      return res.status(400).json({
        success: false,
        error: { code: 'NO_TEAM', message: 'Team ID required' },
      });
    }

    // Get all seat race comparisons for the team
    const comparisons = await extractComparisons(teamId);

    if (comparisons.length === 0) {
      return res.json({
        success: true,
        data: {
          teamId,
          athletes: [],
          modelStats: { totalComparisons: 0, athleteCount: 0, graphConnectivity: 0 },
          message: 'No seat race data available',
        },
      });
    }

    // Fit Bradley-Terry model
    const model = fitBradleyTerryModel(comparisons);

    // Enrich with athlete names
    const athleteIds = model.athletes.map((a) => a.athleteId);
    const athleteInfo = await prisma.athlete.findMany({
      where: { id: { in: athleteIds } },
      select: { id: true, firstName: true, lastName: true, side: true },
    });

    const athleteMap = new Map(athleteInfo.map((a) => [a.id, a]));

    const enrichedAthletes = model.athletes.map((a) => ({
      ...a,
      athlete: athleteMap.get(a.athleteId),
    }));

    // Sort by strength descending
    enrichedAthletes.sort((a, b) => b.strength - a.strength);

    res.json({
      success: true,
      data: {
        teamId,
        fittedAt: new Date().toISOString(),
        athletes: enrichedAthletes,
        convergence: model.convergence,
        modelStats: model.modelStats,
      },
    });
  } catch (error) {
    logger.error('Bradley-Terry ranking error', { error: error.message });
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message },
    });
  }
});

/**
 * GET /api/v1/advanced-ranking/probability-matrix
 * Get pairwise win probability matrix
 */
router.get('/probability-matrix', async (req, res) => {
  try {
    const teamId = req.query.teamId || req.user.activeTeamId;

    if (!teamId) {
      return res.status(400).json({
        success: false,
        error: { code: 'NO_TEAM', message: 'Team ID required' },
      });
    }

    const comparisons = await extractComparisons(teamId);

    if (comparisons.length === 0) {
      return res.json({
        success: true,
        data: { teamId, matrix: [], athletes: [] },
      });
    }

    const model = fitBradleyTerryModel(comparisons);
    const athleteStrengths = model.athletes.map((a) => ({
      athleteId: a.athleteId,
      strength: a.strength,
    }));

    const { matrix, athletes } = computeProbabilityMatrix(athleteStrengths);

    // Get athlete names
    const athleteInfo = await prisma.athlete.findMany({
      where: { id: { in: athletes } },
      select: { id: true, firstName: true, lastName: true },
    });

    res.json({
      success: true,
      data: {
        teamId,
        matrix,
        athletes: athletes.map((id) => athleteInfo.find((a) => a.id === id) || { id }),
      },
    });
  } catch (error) {
    logger.error('Probability matrix error', { error: error.message });
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message },
    });
  }
});

// ============================================
// MATRIX SESSION PLANNER
// ============================================

/**
 * POST /api/v1/advanced-ranking/matrix-planner/generate
 * Generate optimal swap schedule
 * Body: { athleteIds: string[], boatClass: string, pieceCount?: number }
 */
router.post('/matrix-planner/generate', async (req, res) => {
  try {
    const { athleteIds, boatClass, pieceCount, prioritizeAthletes } = req.body;

    if (!athleteIds || !Array.isArray(athleteIds) || athleteIds.length < 2) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'At least 2 athlete IDs required' },
      });
    }

    if (!boatClass) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Boat class required' },
      });
    }

    const schedule = generateSwapSchedule({
      athleteIds,
      boatClass,
      pieceCount,
      prioritizeAthletes,
    });

    // Enrich with athlete names
    const athleteInfo = await prisma.athlete.findMany({
      where: { id: { in: athleteIds } },
      select: { id: true, firstName: true, lastName: true, side: true },
    });

    schedule.athletes = athleteInfo;

    res.json({
      success: true,
      data: schedule,
    });
  } catch (error) {
    logger.error('Matrix planner error', { error: error.message });
    res.status(400).json({
      success: false,
      error: { code: 'PLANNER_ERROR', message: error.message },
    });
  }
});

/**
 * POST /api/v1/advanced-ranking/matrix-planner/validate
 * Validate a manually-created schedule
 */
router.post('/matrix-planner/validate', async (req, res) => {
  try {
    const { schedule } = req.body;

    if (!schedule) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Schedule required' },
      });
    }

    const validation = validateSchedule(schedule);

    res.json({
      success: true,
      data: validation,
    });
  } catch (error) {
    logger.error('Schedule validation error', { error: error.message });
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_FAILED', message: error.message },
    });
  }
});

// ============================================
// COMPOSITE RANKINGS
// ============================================

/**
 * GET /api/v1/advanced-ranking/composite
 * Get composite rankings with configurable weights
 * Query params: profileId, customWeights (JSON)
 */
router.get('/composite', async (req, res) => {
  try {
    const teamId = req.query.teamId || req.user.activeTeamId;
    const profileId = req.query.profileId || 'balanced';
    let customWeights = null;

    // Input validation: teamId required
    if (!teamId) {
      return res.status(400).json({
        success: false,
        error: { code: 'NO_TEAM', message: 'Team ID required' },
      });
    }

    // Input validation: customWeights JSON parsing
    if (req.query.customWeights) {
      try {
        customWeights = JSON.parse(req.query.customWeights);
      } catch (e) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_INPUT', message: 'Invalid customWeights JSON' },
        });
      }
    }

    // Input validation: valid profile
    const VALID_PROFILES = DEFAULT_WEIGHT_PROFILES.map((p) => p.id).concat(['custom']);
    if (profileId && !VALID_PROFILES.includes(profileId)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PROFILE',
          message: `Invalid profile: ${profileId}. Valid profiles: ${VALID_PROFILES.join(', ')}`,
        },
      });
    }

    // Check team exists
    const team = await prisma.team.findUnique({ where: { id: teamId } });
    if (!team) {
      return res.status(404).json({
        success: false,
        error: { code: 'TEAM_NOT_FOUND', message: 'Team not found' },
      });
    }

    const result = await calculateCompositeRankings(teamId, {
      profileId,
      customWeights,
    });

    // Return 200 even if rankings is empty (not an error)
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Composite ranking error', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Internal error computing rankings',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
    });
  }
});

/**
 * GET /api/v1/advanced-ranking/weight-profiles
 * Get available weight profiles
 */
router.get('/weight-profiles', async (req, res) => {
  res.json({
    success: true,
    data: { profiles: DEFAULT_WEIGHT_PROFILES },
  });
});

// ============================================
// SIDE-SPECIFIC RATINGS
// ============================================

/**
 * GET /api/v1/advanced-ranking/by-side
 * Get rankings filtered by side
 * Query params: side (Port, Starboard, Cox, or null for combined)
 */
router.get('/by-side', async (req, res) => {
  try {
    const teamId = req.query.teamId || req.user.activeTeamId;
    const side = req.query.side || null;

    if (!teamId) {
      return res.status(400).json({
        success: false,
        error: { code: 'NO_TEAM', message: 'Team ID required' },
      });
    }

    const rankings = await getTeamRankingsBySide(teamId, side);

    res.json({
      success: true,
      data: { rankings, side, teamId },
    });
  } catch (error) {
    logger.error('Side ranking error', { error: error.message });
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message },
    });
  }
});

/**
 * GET /api/v1/advanced-ranking/athlete/:athleteId/sides
 * Get all side-specific ratings for an athlete
 */
router.get('/athlete/:athleteId/sides', async (req, res) => {
  try {
    const { athleteId } = req.params;
    const teamId = req.query.teamId || req.user.activeTeamId;

    if (!teamId) {
      return res.status(400).json({
        success: false,
        error: { code: 'NO_TEAM', message: 'Team ID required' },
      });
    }

    const sideRatings = await getAthleteSideRatings(athleteId, teamId);

    // Get athlete info
    const athlete = await prisma.athlete.findUnique({
      where: { id: athleteId },
      select: { id: true, firstName: true, lastName: true, side: true },
    });

    res.json({
      success: true,
      data: {
        athlete,
        ...sideRatings,
      },
    });
  } catch (error) {
    logger.error('Athlete side ratings error', { error: error.message });
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message },
    });
  }
});

// ============================================
// COMPARISON GRAPH
// ============================================

/**
 * GET /api/v1/advanced-ranking/comparison-graph
 * Get comparison graph data for visualization
 */
router.get('/comparison-graph', async (req, res) => {
  try {
    const teamId = req.query.teamId || req.user.activeTeamId;

    if (!teamId) {
      return res.status(400).json({
        success: false,
        error: { code: 'NO_TEAM', message: 'Team ID required' },
      });
    }

    const comparisons = await extractComparisons(teamId);

    // Build graph nodes and edges
    const athletes = await prisma.athlete.findMany({
      where: { teamId, status: 'active' },
      select: { id: true, firstName: true, lastName: true, side: true },
    });

    // Count comparisons per pair
    const edgeMap = new Map();
    const athleteComparisonCount = new Map();

    for (const comp of comparisons) {
      const key = [comp.athlete1Id, comp.athlete2Id].sort().join('-');

      if (!edgeMap.has(key)) {
        edgeMap.set(key, {
          from: comp.athlete1Id,
          to: comp.athlete2Id,
          comparisons: 0,
          winner1Count: 0,
          winner2Count: 0,
          totalMargin: 0,
        });
      }

      const edge = edgeMap.get(key);
      edge.comparisons += 1;
      if (comp.winner === comp.athlete1Id) {
        edge.winner1Count += 1;
      } else {
        edge.winner2Count += 1;
      }
      edge.totalMargin += Math.abs(comp.margin || 0);

      // Track comparison count per athlete
      athleteComparisonCount.set(
        comp.athlete1Id,
        (athleteComparisonCount.get(comp.athlete1Id) || 0) + 1
      );
      athleteComparisonCount.set(
        comp.athlete2Id,
        (athleteComparisonCount.get(comp.athlete2Id) || 0) + 1
      );
    }

    // Format edges
    const edges = Array.from(edgeMap.values()).map((e) => ({
      ...e,
      avgMarginSeconds: e.comparisons > 0 ? e.totalMargin / e.comparisons : 0,
    }));

    // Format nodes
    const comparedAthleteIds = new Set([
      ...comparisons.flatMap((c) => [c.athlete1Id, c.athlete2Id]),
    ]);
    const nodes = athletes.map((a) => ({
      id: a.id,
      athleteId: a.id,
      label: `${a.firstName} ${a.lastName}`,
      comparisonCount: athleteComparisonCount.get(a.id) || 0,
      side: a.side,
    }));

    // Find gaps (pairs that haven't raced)
    const gaps = [];
    for (let i = 0; i < athletes.length; i++) {
      for (let j = i + 1; j < athletes.length; j++) {
        const key = [athletes[i].id, athletes[j].id].sort().join('-');
        if (!edgeMap.has(key)) {
          gaps.push({
            athlete1: athletes[i],
            athlete2: athletes[j],
            priority: 'medium',
          });
        }
      }
    }

    const totalPossible = (athletes.length * (athletes.length - 1)) / 2;

    res.json({
      success: true,
      data: {
        nodes,
        edges,
        gaps,
        statistics: {
          totalNodes: nodes.length,
          totalEdges: edges.length,
          totalGaps: gaps.length,
          connectivity: totalPossible > 0 ? edges.length / totalPossible : 0,
          isConnected: gaps.length === 0,
        },
      },
    });
  } catch (error) {
    logger.error('Comparison graph error', { error: error.message });
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message },
    });
  }
});

// ============================================
// PASSIVE ELO TRACKING
// ============================================

/**
 * POST /api/v1/advanced-ranking/passive/observation
 * Record a passive observation from practice
 * Body: { boat1Athletes, boat2Athletes, splitDifferenceSeconds, sessionId?, weight? }
 */
router.post('/passive/observation', async (req, res) => {
  try {
    const teamId = req.body.teamId || req.user.activeTeamId;
    const {
      boat1Athletes,
      boat2Athletes,
      splitDifferenceSeconds,
      sessionId,
      pieceId,
      weight,
      source,
    } = req.body;

    if (!teamId) {
      return res.status(400).json({
        success: false,
        error: { message: 'Team ID required' },
      });
    }

    if (!boat1Athletes || !boat2Athletes || splitDifferenceSeconds === undefined) {
      return res.status(400).json({
        success: false,
        error: { message: 'boat1Athletes, boat2Athletes, and splitDifferenceSeconds are required' },
      });
    }

    const observation = await recordPassiveObservation({
      teamId,
      boat1Athletes,
      boat2Athletes,
      splitDifferenceSeconds,
      sessionId,
      pieceId,
      weight,
      source,
    });

    if (!observation) {
      return res.json({
        success: true,
        data: null,
        message: 'Observation ignored (split difference below threshold)',
      });
    }

    res.status(201).json({
      success: true,
      data: observation,
    });
  } catch (error) {
    console.error('Record passive observation error:', error);
    res.status(400).json({
      success: false,
      error: { message: error.message },
    });
  }
});

/**
 * POST /api/v1/advanced-ranking/passive/split-observation
 * Record a simplified split observation (boat names + split times)
 * Body: { boat1Name, boat1Athletes, boat1SplitSeconds, boat2Name, boat2Athletes, boat2SplitSeconds }
 */
router.post('/passive/split-observation', async (req, res) => {
  try {
    const teamId = req.body.teamId || req.user.activeTeamId;
    const { boat1Athletes, boat2Athletes, boat1SplitSeconds, boat2SplitSeconds, sessionId } =
      req.body;

    if (!teamId) {
      return res.status(400).json({
        success: false,
        error: { message: 'Team ID required' },
      });
    }

    if (
      !boat1Athletes ||
      !boat2Athletes ||
      boat1SplitSeconds === undefined ||
      boat2SplitSeconds === undefined
    ) {
      return res.status(400).json({
        success: false,
        error: {
          message:
            'boat1Athletes, boat2Athletes, boat1SplitSeconds, and boat2SplitSeconds are required',
        },
      });
    }

    const observation = await recordSplitObservation({
      teamId,
      boat1Athletes,
      boat2Athletes,
      boat1SplitSeconds,
      boat2SplitSeconds,
      sessionId,
    });

    res.status(201).json({
      success: true,
      data: observation,
    });
  } catch (error) {
    console.error('Record split observation error:', error);
    res.status(400).json({
      success: false,
      error: { message: error.message },
    });
  }
});

/**
 * POST /api/v1/advanced-ranking/passive/apply
 * Apply pending passive observations to ELO ratings
 * Body: { limit?, dryRun? }
 */
router.post('/passive/apply', async (req, res) => {
  try {
    const teamId = req.body.teamId || req.user.activeTeamId;
    const { limit, dryRun } = req.body;

    if (!teamId) {
      return res.status(400).json({
        success: false,
        error: { message: 'Team ID required' },
      });
    }

    const result = await applyPendingObservations(teamId, { limit, dryRun });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Apply passive observations error:', error);
    res.status(500).json({
      success: false,
      error: { message: error.message },
    });
  }
});

/**
 * POST /api/v1/advanced-ranking/passive/process-session/:sessionId
 * Auto-detect and record observations from a completed session
 * Body: { autoApply? }
 */
router.post('/passive/process-session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { autoApply } = req.body;

    const result = await processSessionForPassiveTracking(sessionId, { autoApply });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Process session for passive tracking error:', error);
    res.status(500).json({
      success: false,
      error: { message: error.message },
    });
  }
});

/**
 * GET /api/v1/advanced-ranking/passive/stats
 * Get passive tracking statistics for the team
 */
router.get('/passive/stats', async (req, res) => {
  try {
    const teamId = req.query.teamId || req.user.activeTeamId;

    if (!teamId) {
      return res.status(400).json({
        success: false,
        error: { message: 'Team ID required' },
      });
    }

    const stats = await getTeamPassiveStats(teamId);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Get passive stats error:', error);
    res.status(500).json({
      success: false,
      error: { message: error.message },
    });
  }
});

/**
 * GET /api/v1/advanced-ranking/passive/athlete/:athleteId/history
 * Get passive observation history for a specific athlete
 */
router.get('/passive/athlete/:athleteId/history', async (req, res) => {
  try {
    const { athleteId } = req.params;
    const { limit } = req.query;

    const history = await getAthletePassiveHistory(athleteId, {
      limit: limit ? parseInt(limit, 10) : 50,
    });

    res.json({
      success: true,
      data: { history },
    });
  } catch (error) {
    console.error('Get athlete passive history error:', error);
    res.status(500).json({
      success: false,
      error: { message: error.message },
    });
  }
});

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Extract pairwise comparisons from seat race sessions
 */
async function extractComparisons(teamId) {
  const sessions = await prisma.seatRaceSession.findMany({
    where: { teamId },
    include: {
      pieces: {
        include: {
          boats: {
            include: {
              assignments: true,
            },
          },
        },
      },
    },
  });

  const comparisons = [];

  for (const session of sessions) {
    for (const piece of session.pieces) {
      const boats = piece.boats;

      // Compare each pair of boats
      for (let i = 0; i < boats.length; i++) {
        for (let j = i + 1; j < boats.length; j++) {
          const boatA = boats[i];
          const boatB = boats[j];

          if (!boatA.finishTimeSeconds || !boatB.finishTimeSeconds) continue;

          const athletesA = boatA.assignments.map((a) => a.athleteId);
          const athletesB = boatB.assignments.map((a) => a.athleteId);

          // Find swapped athletes
          const onlyInA = athletesA.filter((id) => !athletesB.includes(id));
          const onlyInB = athletesB.filter((id) => !athletesA.includes(id));

          // Only record if exactly one swap
          if (onlyInA.length === 1 && onlyInB.length === 1) {
            const timeA = Number(boatA.finishTimeSeconds) + Number(boatA.handicapSeconds || 0);
            const timeB = Number(boatB.finishTimeSeconds) + Number(boatB.handicapSeconds || 0);
            const margin = timeB - timeA; // Positive = A was faster

            comparisons.push({
              athlete1Id: onlyInA[0],
              athlete2Id: onlyInB[0],
              winner: margin > 0 ? onlyInA[0] : onlyInB[0],
              margin: Math.abs(margin),
              sessionId: session.id,
              pieceId: piece.id,
            });
          }
        }
      }
    }
  }

  return comparisons;
}

export default router;
