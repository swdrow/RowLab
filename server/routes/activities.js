import express from 'express';
import logger from '../utils/logger.js';
import { query, validationResult } from 'express-validator';
import { authenticateToken, requireTeam } from '../middleware/auth.js';
import { getUnifiedActivityFeed } from '../services/activityService.js';
import prisma from '../db/connection.js';

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
 * GET /api/v1/activities
 * Get unified activity feed for current user
 * Supports pagination and source filtering
 *
 * Query params:
 * - limit: Max activities to return (default 20, max 50)
 * - offset: Pagination offset (default 0)
 * - excludeSources: Comma-separated sources to exclude (CONCEPT2, STRAVA, MANUAL)
 */
router.get(
  '/',
  authenticateToken,
  [
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .toInt()
      .withMessage('limit must be between 1 and 50'),
    query('offset')
      .optional()
      .isInt({ min: 0 })
      .toInt()
      .withMessage('offset must be a non-negative integer'),
    query('excludeSources')
      .optional()
      .custom((value) => {
        if (!value) return true;
        const valid = ['CONCEPT2', 'STRAVA', 'MANUAL'];
        const sources = value.split(',').map(s => s.trim());
        return sources.every(s => valid.includes(s));
      })
      .withMessage('excludeSources must be comma-separated valid sources: CONCEPT2, STRAVA, MANUAL'),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const limit = req.query.limit || 20;
      const offset = req.query.offset || 0;
      const excludeSources = req.query.excludeSources
        ? req.query.excludeSources.split(',').map(s => s.trim())
        : [];

      const activities = await getUnifiedActivityFeed(req.user.userId, {
        limit,
        offset,
        excludeSources,
      });

      res.json({
        success: true,
        data: {
          activities,
          pagination: {
            limit,
            offset,
            count: activities.length,
          },
        },
      });
    } catch (error) {
      logger.error('Get activities error', { error: error.message, userId: req.user.userId });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to load activities' },
      });
    }
  }
);

/**
 * GET /api/v1/activities/unified
 * Get unified activity timeline for an athlete (or all team athletes)
 * Aggregates: erg tests, session attendance, race results
 * Uses cursor-based pagination for infinite scroll
 *
 * Query params:
 * - athleteId: Filter to specific athlete (optional)
 * - cursor: ISO date string for pagination
 * - limit: Max items per page (default 20, max 50)
 */
router.get(
  '/unified',
  authenticateToken,
  requireTeam,
  [
    query('athleteId').optional().isString(),
    query('cursor').optional().isISO8601(),
    query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const teamId = req.teamId;
      const { athleteId, cursor } = req.query;
      const limit = req.query.limit || 20;
      const cursorDate = cursor ? new Date(cursor) : new Date();

      const activities = [];

      // ========================================
      // Fetch erg tests
      // ========================================
      const ergTests = await prisma.ergTest.findMany({
        where: {
          teamId,
          ...(athleteId && { athleteId }),
          testDate: { lt: cursorDate },
        },
        include: {
          athlete: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { testDate: 'desc' },
        take: limit,
      });

      ergTests.forEach((test) => {
        activities.push({
          id: `erg-${test.id}`,
          type: 'erg_test',
          title: `${test.testType} Test`,
          description: `Completed ${test.testType} erg test`,
          date: test.testDate.toISOString(),
          athleteId: test.athleteId,
          athleteName: `${test.athlete.firstName} ${test.athlete.lastName}`,
          metadata: {
            testType: test.testType,
            time: Number(test.timeSeconds),
            distance: test.distanceM || 0,
            watts: test.watts || null,
          },
        });
      });

      // ========================================
      // Fetch session participation (from sessions model)
      // ========================================
      try {
        const sessions = await prisma.session.findMany({
          where: {
            teamId,
            status: 'COMPLETED',
            date: { lt: cursorDate },
          },
          select: {
            id: true,
            name: true,
            type: true,
            date: true,
          },
          orderBy: { date: 'desc' },
          take: limit,
        });

        // If athleteId specified, we'd need attendance records
        // For now, add sessions as team-level activities
        sessions.forEach((session) => {
          activities.push({
            id: `session-${session.id}`,
            type: 'session_participation',
            title: session.name,
            description: `${session.type.toLowerCase()} session completed`,
            date: session.date.toISOString(),
            athleteId: athleteId || '',
            athleteName: '',
            metadata: {
              sessionId: session.id,
              sessionType: session.type,
              sessionName: session.name,
              participationPercent: 100,
            },
          });
        });
      } catch (sessionError) {
        logger.debug('Sessions query failed (may not exist yet)', {
          error: sessionError.message,
        });
      }

      // ========================================
      // Fetch race results (from RaceEntry if exists)
      // ========================================
      try {
        const raceEntries = await prisma.raceEntry.findMany({
          where: {
            race: {
              regatta: { teamId },
              date: { lt: cursorDate },
            },
            finishTime: { not: null },
          },
          include: {
            race: {
              include: {
                event: true,
                regatta: { select: { name: true } },
              },
            },
            lineup: {
              include: {
                assignments: {
                  include: {
                    athlete: {
                      select: { id: true, firstName: true, lastName: true },
                    },
                  },
                },
              },
            },
          },
          orderBy: { race: { date: 'desc' } },
          take: limit,
        });

        raceEntries.forEach((entry) => {
          // Get athletes from lineup if available
          const athletes = entry.lineup?.assignments?.map(
            (a) => `${a.athlete.firstName} ${a.athlete.lastName}`
          ) || [];

          // Skip if filtering by athleteId and athlete not in lineup
          if (athleteId && entry.lineup?.assignments) {
            const athleteInLineup = entry.lineup.assignments.some(
              (a) => a.athleteId === athleteId
            );
            if (!athleteInLineup) return;
          }

          activities.push({
            id: `race-${entry.id}`,
            type: 'race_result',
            title: `${entry.race.event.name}`,
            description: `${entry.race.regatta.name} - Finished ${
              entry.finishPlace ? `#${entry.finishPlace}` : ''
            }`,
            date: entry.race.date.toISOString(),
            athleteId: athleteId || '',
            athleteName: athletes.join(', '),
            metadata: {
              regattaName: entry.race.regatta.name,
              eventName: entry.race.event.name,
              boatClass: entry.race.event.boatClass,
              place: entry.finishPlace || 0,
              time: entry.finishTime,
            },
          });
        });
      } catch (raceError) {
        logger.debug('Race entries query failed (may not exist yet)', {
          error: raceError.message,
        });
      }

      // ========================================
      // Sort all activities by date descending
      // ========================================
      activities.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      // Apply limit
      const limited = activities.slice(0, limit);

      // Determine next cursor
      const hasMore = activities.length > limit;
      const nextCursor =
        hasMore && limited.length > 0
          ? limited[limited.length - 1].date
          : undefined;

      res.json({
        success: true,
        data: {
          items: limited,
          nextCursor,
          hasMore,
        },
      });
    } catch (error) {
      logger.error('Get unified activities error', {
        error: error.message,
        stack: error.stack,
        teamId: req.teamId,
      });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to load activities' },
      });
    }
  }
);

export default router;
