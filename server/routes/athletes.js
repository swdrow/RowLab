import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import {
  createAthlete,
  getAthletes,
  getAthleteById,
  updateAthlete,
  deleteAthlete,
  bulkImportAthletes,
  searchAthletes,
  getAthletesBySide,
} from '../services/athleteService.js';
import { authenticateToken, requireRole, teamIsolation } from '../middleware/auth.js';
import prisma from '../db/connection.js';
import logger from '../utils/logger.js';

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

// All routes require authentication and team context
router.use(authenticateToken, teamIsolation);

/**
 * GET /api/v1/athletes/me
 * Get current user's athlete profile and stats
 * Only works if the user has an athlete record linked
 * Supports pagination: ?ergPage=1&ergLimit=20&includeAllHistory=true
 */
router.get('/me', async (req, res) => {
  try {
    // Parse query params for pagination
    const ergPage = parseInt(req.query.ergPage) || 1;
    const ergLimit = Math.min(parseInt(req.query.ergLimit) || 10, 100);
    const includeAllHistory = req.query.includeAllHistory === 'true';
    const ergSkip = (ergPage - 1) * ergLimit;

    // Find athlete linked to this user in the active team
    const athlete = await prisma.athlete.findFirst({
      where: {
        userId: req.user.id,
        teamId: req.user.activeTeamId,
      },
    });

    if (!athlete) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'No athlete profile found for this user' },
      });
    }

    // Get team settings for visibility
    const team = await prisma.team.findUnique({
      where: { id: req.user.activeTeamId },
      select: { settings: true },
    });

    const teamSettings = team?.settings || {};
    const visibility = {
      athletesCanSeeRankings: teamSettings.athletesCanSeeRankings !== false,
      athletesCanSeeOthersErgData: teamSettings.athletesCanSeeOthersErgData !== false,
      athletesCanSeeOthersLineups: teamSettings.athletesCanSeeOthersLineups !== false,
    };

    // Get total erg test count for pagination
    const ergTestCount = await prisma.ergTest.count({
      where: { athleteId: athlete.id },
    });

    // Get erg tests with pagination
    const ergTests = await prisma.ergTest.findMany({
      where: { athleteId: athlete.id },
      orderBy: { testDate: 'desc' },
      skip: includeAllHistory ? 0 : ergSkip,
      take: includeAllHistory ? undefined : ergLimit,
    });

    // Get lineup assignments
    const lineups = await prisma.lineup.findMany({
      where: {
        teamId: req.user.activeTeamId,
        assignments: {
          some: {
            athleteId: athlete.id,
          },
        },
      },
      include: {
        assignments: {
          where: {
            athleteId: athlete.id,
          },
        },
      },
    });

    // Transform lineup data to include seat info
    const lineupData = lineups.map((lineup) => {
      const assignment = lineup.assignments[0];
      return {
        id: lineup.id,
        name: lineup.name,
        boatClass: assignment?.boatClass,
        seatNumber: assignment?.seatNumber,
        isCoxswain: assignment?.isCoxswain || false,
      };
    });

    // Get seat racing rankings if allowed by team settings
    let rankings = [];
    let myRanking = null;

    if (visibility.athletesCanSeeRankings) {
      // Get all athlete ratings for ranking
      const allRatings = await prisma.athleteRating.findMany({
        where: {
          athlete: { teamId: req.user.activeTeamId },
          ratingType: 'combined',
        },
        orderBy: { ratingValue: 'desc' },
        include: {
          athlete: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      });

      // Find this athlete's position
      const athleteRating = await prisma.athleteRating.findFirst({
        where: {
          athleteId: athlete.id,
          ratingType: 'combined',
        },
      });

      if (athleteRating) {
        const rank = allRatings.findIndex((r) => r.athleteId === athlete.id) + 1;
        myRanking = {
          rank,
          totalAthletes: allRatings.length,
          score: parseFloat(athleteRating.ratingValue),
          confidence: athleteRating.confidenceScore
            ? parseFloat(athleteRating.confidenceScore)
            : null,
          racesCount: athleteRating.racesCount,
        };
      }

      // Get this athlete's rating history
      rankings = await prisma.athleteRating.findMany({
        where: {
          athleteId: athlete.id,
        },
        orderBy: { lastCalculatedAt: 'desc' },
        take: 5,
      });
    }

    // Get C2 connection status
    const c2Auth = await prisma.concept2Auth.findUnique({
      where: { userId: req.user.id },
      select: {
        connected: true,
        username: true,
        lastSyncedAt: true,
        syncEnabled: true,
      },
    });

    const c2Status = c2Auth
      ? {
          connected: true,
          username: c2Auth.username,
          lastSyncedAt: c2Auth.lastSyncedAt,
          syncEnabled: c2Auth.syncEnabled,
        }
      : { connected: false };

    res.json({
      success: true,
      data: {
        athlete: {
          id: athlete.id,
          firstName: athlete.firstName,
          lastName: athlete.lastName,
          email: athlete.email,
          side: athlete.side,
          weightKg: athlete.weightKg,
          heightCm: athlete.heightCm,
        },
        ergTests: ergTests.map((test) => ({
          id: test.id,
          testType: test.testType,
          testDate: test.testDate,
          distanceM: test.distanceM,
          timeSeconds: parseFloat(test.timeSeconds),
          splitSeconds: test.splitSeconds ? parseFloat(test.splitSeconds) : null,
          watts: test.watts,
          strokeRate: test.strokeRate,
        })),
        ergTestPagination: {
          page: ergPage,
          limit: ergLimit,
          total: ergTestCount,
          totalPages: Math.ceil(ergTestCount / ergLimit),
        },
        lineups: lineupData,
        myRanking,
        rankings: rankings.map((r) => ({
          ratingType: r.ratingType,
          score: parseFloat(r.ratingValue),
          confidence: r.confidenceScore ? parseFloat(r.confidenceScore) : null,
          racesCount: r.racesCount,
          lastCalculatedAt: r.lastCalculatedAt,
        })),
        teamVisibility: visibility,
        concept2Status: c2Status,
      },
    });
  } catch (error) {
    logger.error('Get athlete profile error', { error: error.message });
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to get athlete profile' },
    });
  }
});

/**
 * GET /api/v1/athletes/me/preferences
 * Get current athlete's gamification preferences
 */
router.get('/me/preferences', async (req, res) => {
  try {
    // Find athlete linked to this user in the active team
    const athlete = await prisma.athlete.findFirst({
      where: {
        userId: req.user.id,
        teamId: req.user.activeTeamId,
      },
      select: {
        id: true,
        gamificationEnabled: true,
      },
    });

    if (!athlete) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'No athlete profile found for this user' },
      });
    }

    res.json({
      success: true,
      data: {
        gamificationEnabled: athlete.gamificationEnabled,
      },
    });
  } catch (error) {
    logger.error('Get athlete preferences error', { error: error.message });
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to get preferences' },
    });
  }
});

/**
 * PATCH /api/v1/athletes/me/preferences
 * Update current athlete's gamification preferences
 */
router.patch(
  '/me/preferences',
  [body('gamificationEnabled').optional().isBoolean()],
  validateRequest,
  async (req, res) => {
    try {
      // Find athlete linked to this user in the active team
      const athlete = await prisma.athlete.findFirst({
        where: {
          userId: req.user.id,
          teamId: req.user.activeTeamId,
        },
      });

      if (!athlete) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'No athlete profile found for this user' },
        });
      }

      // Update preferences
      const updated = await prisma.athlete.update({
        where: { id: athlete.id },
        data: {
          gamificationEnabled: req.body.gamificationEnabled ?? athlete.gamificationEnabled,
        },
        select: {
          id: true,
          gamificationEnabled: true,
        },
      });

      res.json({
        success: true,
        data: {
          gamificationEnabled: updated.gamificationEnabled,
        },
      });
    } catch (error) {
      logger.error('Update athlete preferences error', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to update preferences' },
      });
    }
  }
);

/**
 * PATCH /api/v1/athletes/:id/preferences
 * Update athlete's preferences (for coaches updating athlete settings)
 */
router.patch(
  '/:id/preferences',
  requireRole('OWNER', 'COACH'),
  [param('id').isUUID(), body('gamificationEnabled').optional().isBoolean()],
  validateRequest,
  async (req, res) => {
    try {
      // Find athlete by ID in active team
      const athlete = await prisma.athlete.findFirst({
        where: {
          id: req.params.id,
          teamId: req.user.activeTeamId,
        },
      });

      if (!athlete) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Athlete not found' },
        });
      }

      // Update preferences
      const updated = await prisma.athlete.update({
        where: { id: athlete.id },
        data: {
          gamificationEnabled: req.body.gamificationEnabled ?? athlete.gamificationEnabled,
        },
        select: {
          id: true,
          gamificationEnabled: true,
        },
      });

      res.json({
        success: true,
        data: {
          gamificationEnabled: updated.gamificationEnabled,
        },
      });
    } catch (error) {
      logger.error('Update athlete preferences error', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to update preferences' },
      });
    }
  }
);

/**
 * GET /api/v1/athletes/:id/dashboard
 * Get full dashboard data for a specific athlete (Coach view)
 * Allows OWNER/COACH to view any athlete's dashboard in their team
 */
router.get(
  '/:id/dashboard',
  requireRole('OWNER', 'COACH'),
  [param('id').isUUID()],
  validateRequest,
  async (req, res) => {
    try {
      const ergPage = parseInt(req.query.ergPage) || 1;
      const ergLimit = Math.min(parseInt(req.query.ergLimit) || 10, 100);
      const includeAllHistory = req.query.includeAllHistory === 'true';
      const ergSkip = (ergPage - 1) * ergLimit;

      // Find athlete by ID in active team
      const athlete = await prisma.athlete.findFirst({
        where: {
          id: req.params.id,
          teamId: req.user.activeTeamId,
        },
      });

      if (!athlete) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Athlete not found' },
        });
      }

      // Coach viewing: always allow full visibility
      const visibility = {
        athletesCanSeeRankings: true,
        athletesCanSeeOthersErgData: true,
        athletesCanSeeOthersLineups: true,
      };

      // Get total erg test count
      const ergTestCount = await prisma.ergTest.count({
        where: { athleteId: athlete.id },
      });

      // Get erg tests
      const ergTests = await prisma.ergTest.findMany({
        where: { athleteId: athlete.id },
        orderBy: { testDate: 'desc' },
        skip: includeAllHistory ? 0 : ergSkip,
        take: includeAllHistory ? undefined : ergLimit,
      });

      // Get lineups
      const lineups = await prisma.lineup.findMany({
        where: {
          teamId: req.user.activeTeamId,
          assignments: { some: { athleteId: athlete.id } },
        },
        include: {
          assignments: { where: { athleteId: athlete.id } },
        },
      });

      const lineupData = lineups.map((lineup) => {
        const assignment = lineup.assignments[0];
        return {
          id: lineup.id,
          name: lineup.name,
          boatClass: assignment?.boatClass,
          seatNumber: assignment?.seatNumber,
          isCoxswain: assignment?.isCoxswain || false,
        };
      });

      // Get rankings (Coach sees all)
      const allRatings = await prisma.athleteRating.findMany({
        where: {
          athlete: { teamId: req.user.activeTeamId },
          ratingType: 'combined',
        },
        orderBy: { ratingValue: 'desc' },
        include: {
          athlete: { select: { id: true, firstName: true, lastName: true } },
        },
      });

      let myRanking = null;
      const athleteRating = await prisma.athleteRating.findFirst({
        where: { athleteId: athlete.id, ratingType: 'combined' },
      });

      if (athleteRating) {
        const rank = allRatings.findIndex((r) => r.athleteId === athlete.id) + 1;
        myRanking = {
          rank,
          totalAthletes: allRatings.length,
          score: parseFloat(athleteRating.ratingValue),
          confidence: athleteRating.confidenceScore
            ? parseFloat(athleteRating.confidenceScore)
            : null,
          racesCount: athleteRating.racesCount,
        };
      }

      const rankings = await prisma.athleteRating.findMany({
        where: { athleteId: athlete.id },
        orderBy: { lastCalculatedAt: 'desc' },
        take: 5,
      });

      // Check if athlete has C2 connection (via linked user)
      let c2Status = { connected: false };
      if (athlete.userId) {
        const c2Auth = await prisma.concept2Auth.findUnique({
          where: { userId: athlete.userId },
          select: {
            connected: true,
            username: true,
            lastSyncedAt: true,
            syncEnabled: true,
          },
        });
        if (c2Auth) {
          c2Status = {
            connected: true,
            username: c2Auth.username,
            lastSyncedAt: c2Auth.lastSyncedAt,
            syncEnabled: c2Auth.syncEnabled,
          };
        }
      }

      res.json({
        success: true,
        data: {
          athlete: {
            id: athlete.id,
            firstName: athlete.firstName,
            lastName: athlete.lastName,
            email: athlete.email,
            side: athlete.side,
            weightKg: athlete.weightKg,
            heightCm: athlete.heightCm,
          },
          ergTests: ergTests.map((test) => ({
            id: test.id,
            testType: test.testType,
            testDate: test.testDate,
            distanceM: test.distanceM,
            timeSeconds: parseFloat(test.timeSeconds),
            splitSeconds: test.splitSeconds ? parseFloat(test.splitSeconds) : null,
            watts: test.watts,
            strokeRate: test.strokeRate,
          })),
          ergTestPagination: {
            page: ergPage,
            limit: ergLimit,
            total: ergTestCount,
            totalPages: Math.ceil(ergTestCount / ergLimit),
          },
          lineups: lineupData,
          myRanking,
          rankings: rankings.map((r) => ({
            ratingType: r.ratingType,
            score: parseFloat(r.ratingValue),
            confidence: r.confidenceScore ? parseFloat(r.confidenceScore) : null,
            racesCount: r.racesCount,
            lastCalculatedAt: r.lastCalculatedAt,
          })),
          teamVisibility: visibility,
          concept2Status: c2Status,
          isCoachView: true, // Flag to indicate this is a coach viewing an athlete
        },
      });
    } catch (error) {
      logger.error('Get athlete dashboard error', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to get athlete dashboard' },
      });
    }
  }
);

/**
 * POST /api/v1/athletes
 * Create a new athlete
 */
router.post(
  '/',
  requireRole('OWNER', 'COACH'),
  [
    body('firstName').trim().isLength({ min: 1, max: 50 }),
    body('lastName').trim().isLength({ min: 1, max: 50 }),
    body('email').optional({ nullable: true }).isEmail().normalizeEmail(),
    body('side').optional().isIn(['Port', 'Starboard', 'Both', 'Cox']),
    body('weightKg').optional().isFloat({ min: 30, max: 200 }),
    body('heightCm').optional().isInt({ min: 100, max: 250 }),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const athlete = await createAthlete(req.user.activeTeamId, req.body);

      res.status(201).json({
        success: true,
        data: { athlete },
      });
    } catch (error) {
      if (error.message.includes('already exists')) {
        return res.status(409).json({
          success: false,
          error: { code: 'DUPLICATE', message: error.message },
        });
      }
      logger.error('Create athlete error', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to create athlete' },
      });
    }
  }
);

/**
 * GET /api/v1/athletes
 * Get all athletes for the team
 */
router.get(
  '/',
  [query('includeStats').optional().isBoolean()],
  validateRequest,
  async (req, res) => {
    try {
      const includeStats = req.query.includeStats === 'true';
      const athletes = await getAthletes(req.user.activeTeamId, { includeStats });

      res.json({
        success: true,
        data: { athletes, count: athletes.length },
      });
    } catch (error) {
      logger.error('Get athletes error', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to get athletes' },
      });
    }
  }
);

/**
 * GET /api/v1/athletes/search
 * Search athletes
 */
router.get(
  '/search',
  [query('q').trim().isLength({ min: 1 })],
  validateRequest,
  async (req, res) => {
    try {
      const athletes = await searchAthletes(req.user.activeTeamId, req.query.q);

      res.json({
        success: true,
        data: { athletes },
      });
    } catch (error) {
      logger.error('Search athletes error', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Search failed' },
      });
    }
  }
);

/**
 * GET /api/v1/athletes/by-side/:side
 * Get athletes by side preference
 */
router.get(
  '/by-side/:side',
  [param('side').isIn(['Port', 'Starboard', 'Cox'])],
  validateRequest,
  async (req, res) => {
    try {
      const athletes = await getAthletesBySide(req.user.activeTeamId, req.params.side);

      res.json({
        success: true,
        data: { athletes },
      });
    } catch (error) {
      logger.error('Get by side error', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to get athletes' },
      });
    }
  }
);

/**
 * GET /api/v1/athletes/:id
 * Get single athlete. Pass ?detail=true for extended data (attendance, erg tests, PRs, ranking).
 */
router.get('/:id', [param('id').isUUID()], validateRequest, async (req, res) => {
  try {
    const athlete = await getAthleteById(req.params.id, req.user.activeTeamId);
    const includeDetail = req.query.detail === 'true';

    if (!includeDetail) {
      return res.json({
        success: true,
        data: { athlete },
      });
    }

    // Extended detail: recent attendance (last 12 weeks)
    const twelveWeeksAgo = new Date();
    twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84);

    const [recentAttendance, recentErgTests, personalRecords, athleteRating, allRatings] =
      await Promise.all([
        prisma.attendance.findMany({
          where: {
            athleteId: req.params.id,
            teamId: req.user.activeTeamId,
            date: { gte: twelveWeeksAgo },
          },
          orderBy: { date: 'desc' },
          select: { date: true, status: true },
        }),
        prisma.ergTest.findMany({
          where: { athleteId: req.params.id },
          orderBy: { testDate: 'desc' },
          take: 10,
          select: {
            id: true,
            testType: true,
            timeSeconds: true,
            testDate: true,
            distanceM: true,
          },
        }),
        prisma.personalRecord.findMany({
          where: { athleteId: req.params.id },
          orderBy: { achievedAt: 'desc' },
          take: 10,
          select: { testType: true, timeSeconds: true, achievedAt: true },
        }),
        prisma.athleteRating.findFirst({
          where: { athleteId: req.params.id, ratingType: 'combined' },
        }),
        prisma.athleteRating.findMany({
          where: {
            athlete: { teamId: req.user.activeTeamId },
            ratingType: 'combined',
          },
          orderBy: { ratingValue: 'desc' },
          select: { athleteId: true },
        }),
      ]);

    // Calculate attendance streak (consecutive present/late days)
    let attendanceStreak = 0;
    const sortedAttendance = [...recentAttendance].sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );
    for (const record of sortedAttendance) {
      if (record.status === 'present' || record.status === 'late') {
        attendanceStreak++;
      } else {
        break;
      }
    }

    // Calculate team rank
    let teamRank = undefined;
    let seatRaceRating = undefined;
    if (athleteRating) {
      const rankIndex = allRatings.findIndex((r) => r.athleteId === req.params.id);
      teamRank = rankIndex >= 0 ? rankIndex + 1 : undefined;
      seatRaceRating = parseFloat(athleteRating.ratingValue);
    }

    res.json({
      success: true,
      data: {
        athlete: {
          ...athlete,
          recentAttendance: recentAttendance.map((a) => ({
            date: a.date.toISOString().split('T')[0],
            status: a.status,
          })),
          recentErgTests: recentErgTests.map((t) => ({
            id: t.id,
            testType: t.testType,
            time: t.timeSeconds ? String(Number(t.timeSeconds)) : null,
            testDate: t.testDate instanceof Date ? t.testDate.toISOString() : t.testDate,
            distance: t.distanceM,
          })),
          personalRecords: personalRecords.map((pr) => ({
            testType: pr.testType,
            time: pr.timeSeconds ? String(Number(pr.timeSeconds)) : null,
            date: pr.achievedAt instanceof Date ? pr.achievedAt.toISOString() : pr.achievedAt,
          })),
          attendanceStreak,
          seatRaceRating,
          teamRank,
        },
      },
    });
  } catch (error) {
    if (error.message === 'Athlete not found') {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: error.message },
      });
    }
    logger.error('Get athlete error', { error: error.message });
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to get athlete' },
    });
  }
});

/**
 * PATCH /api/v1/athletes/:id
 * Update athlete
 */
router.patch(
  '/:id',
  requireRole('OWNER', 'COACH'),
  [
    param('id').isUUID(),
    body('firstName').optional().trim().isLength({ min: 1, max: 50 }),
    body('lastName').optional().trim().isLength({ min: 1, max: 50 }),
    body('email').optional({ nullable: true }).isEmail().normalizeEmail(),
    body('side').optional().isIn(['Port', 'Starboard', 'Both', 'Cox', null]),
    body('weightKg').optional({ nullable: true }).isFloat({ min: 30, max: 200 }),
    body('heightCm').optional({ nullable: true }).isInt({ min: 100, max: 250 }),
    body('status').optional().isIn(['active', 'inactive', 'injured', 'graduated']),
    body('classYear').optional({ nullable: true }).isInt({ min: 2000, max: 2100 }),
    body('avatar')
      .optional({ nullable: true })
      .custom((value) => {
        // Allow null to clear avatar
        if (value === null) return true;
        // Must be a string
        if (typeof value !== 'string') {
          throw new Error('Avatar must be a string');
        }
        // Validate base64 data URL format
        if (!value.startsWith('data:image/')) {
          throw new Error('Avatar must be a valid image data URL');
        }
        // Check size (max ~500KB base64 = ~375KB image)
        if (value.length > 500000) {
          throw new Error('Avatar image too large (max 500KB)');
        }
        return true;
      }),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const athlete = await updateAthlete(req.params.id, req.user.activeTeamId, req.body);

      res.json({
        success: true,
        data: { athlete },
      });
    } catch (error) {
      if (error.message === 'Athlete not found') {
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
      logger.error('Update athlete error', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to update athlete' },
      });
    }
  }
);

/**
 * DELETE /api/v1/athletes/:id
 * Delete athlete
 */
router.delete(
  '/:id',
  requireRole('OWNER', 'COACH'),
  [param('id').isUUID()],
  validateRequest,
  async (req, res) => {
    try {
      await deleteAthlete(req.params.id, req.user.activeTeamId);

      res.json({
        success: true,
        data: { message: 'Athlete deleted' },
      });
    } catch (error) {
      if (error.message === 'Athlete not found') {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: error.message },
        });
      }
      if (error.message === 'Cannot delete linked athlete account') {
        return res.status(400).json({
          success: false,
          error: { code: 'LINKED_ACCOUNT', message: error.message },
        });
      }
      logger.error('Delete athlete error', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to delete athlete' },
      });
    }
  }
);

/**
 * POST /api/v1/athletes/bulk-import
 * Bulk import athletes
 */
router.post(
  '/bulk-import',
  requireRole('OWNER', 'COACH'),
  [
    body('athletes').isArray({ min: 1, max: 100 }),
    body('athletes.*.firstName').trim().isLength({ min: 1, max: 50 }),
    body('athletes.*.lastName').trim().isLength({ min: 1, max: 50 }),
    body('athletes.*.email').optional({ nullable: true }).isEmail(),
    body('athletes.*.side').optional().isIn(['Port', 'Starboard', 'Both', 'Cox']),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const results = await bulkImportAthletes(req.user.activeTeamId, req.body.athletes);

      res.json({
        success: true,
        data: results,
      });
    } catch (error) {
      logger.error('Bulk import error', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Bulk import failed' },
      });
    }
  }
);

export default router;
