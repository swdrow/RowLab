import express from 'express';
import { authenticateToken, requireTeam } from '../middleware/auth.js';
import { prisma } from '../db/connection.js';
import logger from '../utils/logger.js';

const router = express.Router();

// All routes require authentication and team context
router.use(authenticateToken, requireTeam);

/**
 * GET /api/v1/dashboard/exceptions/:teamId
 * Aggregate exception alerts from multiple data sources:
 * - Low attendance (<70% in last 30 days)
 * - Overdue sessions (past date, not completed)
 * - Stale erg data (no test in 60+ days)
 */
router.get('/exceptions/:teamId', async (req, res) => {
  const { teamId } = req.params;
  const exceptions = [];

  // Date thresholds
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
  const now = new Date();

  try {
    // Run all queries in parallel for performance
    const [attendanceData, overdueSessions, ergTestData] = await Promise.all([
      // 1. Low attendance: athletes with attendance records in last 30 days
      prisma.athlete.findMany({
        where: {
          teamId,
          status: 'active',
        },
        include: {
          attendance: {
            where: {
              date: {
                gte: thirtyDaysAgo,
              },
            },
          },
        },
      }),

      // 2. Overdue sessions: past sessions not marked complete
      prisma.session.findMany({
        where: {
          teamId,
          date: {
            lt: now,
          },
          status: {
            in: ['PLANNED', 'ACTIVE'],
          },
        },
        orderBy: {
          date: 'asc',
        },
        take: 5, // Only show first 5 overdue sessions
      }),

      // 3. Stale erg data: all athletes with their most recent erg test
      prisma.athlete.findMany({
        where: {
          teamId,
          status: 'active',
        },
        include: {
          ergTests: {
            orderBy: {
              testDate: 'desc',
            },
            take: 1,
          },
        },
      }),
    ]);

    // Process attendance data into exceptions
    attendanceData.forEach((athlete) => {
      if (athlete.attendance.length === 0) {
        // No attendance records in last 30 days - critical
        exceptions.push({
          id: `attendance-${athlete.id}`,
          severity: 'critical',
          title: `${athlete.firstName} ${athlete.lastName}: No attendance`,
          description: 'No attendance records in last 30 days',
          actionPath: `/app/athletes/${athlete.id}`,
          actionLabel: 'View Athlete',
        });
      } else {
        // Calculate attendance rate
        const presentCount = athlete.attendance.filter(
          (a) => a.status === 'present' || a.status === 'late'
        ).length;
        const totalCount = athlete.attendance.length;
        const attendanceRate = presentCount / totalCount;

        if (attendanceRate < 0.5) {
          // <50% = critical
          exceptions.push({
            id: `attendance-${athlete.id}`,
            severity: 'critical',
            title: `${athlete.firstName} ${athlete.lastName}: ${Math.round(attendanceRate * 100)}% attendance`,
            description: `${presentCount}/${totalCount} sessions in last 30 days`,
            actionPath: `/app/athletes/${athlete.id}`,
            actionLabel: 'View Athlete',
          });
        } else if (attendanceRate < 0.7) {
          // <70% = warning
          exceptions.push({
            id: `attendance-${athlete.id}`,
            severity: 'warning',
            title: `${athlete.firstName} ${athlete.lastName}: ${Math.round(attendanceRate * 100)}% attendance`,
            description: `${presentCount}/${totalCount} sessions in last 30 days`,
            actionPath: `/app/athletes/${athlete.id}`,
            actionLabel: 'View Athlete',
          });
        }
      }
    });

    // Process overdue sessions
    overdueSessions.forEach((session) => {
      const daysOverdue = Math.floor((now - session.date) / (1000 * 60 * 60 * 24));
      exceptions.push({
        id: `session-${session.id}`,
        severity: 'warning',
        title: `Session overdue: ${session.name}`,
        description: `${daysOverdue} days past due, not marked complete`,
        actionPath: `/app/training/sessions/${session.id}`,
        actionLabel: 'View Session',
      });
    });

    // Process stale erg data
    ergTestData.forEach((athlete) => {
      const mostRecentTest = athlete.ergTests[0];

      if (!mostRecentTest) {
        // No erg tests at all - warning
        exceptions.push({
          id: `erg-${athlete.id}`,
          severity: 'warning',
          title: `${athlete.firstName} ${athlete.lastName}: No erg data`,
          description: 'No erg test records found',
          actionPath: `/app/erg-tests?athlete=${athlete.id}`,
          actionLabel: 'Add Test',
        });
      } else {
        const testDate = new Date(mostRecentTest.testDate);
        if (testDate < sixtyDaysAgo) {
          // Test >60 days old - warning
          const daysStale = Math.floor((now - testDate) / (1000 * 60 * 60 * 24));
          exceptions.push({
            id: `erg-${athlete.id}`,
            severity: 'warning',
            title: `${athlete.firstName} ${athlete.lastName}: Stale erg data`,
            description: `Last test ${daysStale} days ago`,
            actionPath: `/app/erg-tests?athlete=${athlete.id}`,
            actionLabel: 'Add Test',
          });
        }
      }
    });

    // TODO(phase-36.1-04): NCAA compliance exceptions deferred
    // Requires weekly hour tracking (Session.duration summed per week)
    // Implement when training load tracking is enhanced

    // Build summary
    const summary = {
      critical: exceptions.filter((e) => e.severity === 'critical').length,
      warning: exceptions.filter((e) => e.severity === 'warning').length,
      ok: exceptions.length === 0 ? 1 : 0,
      items: exceptions,
    };

    return res.json(summary);
  } catch (error) {
    logger.error('Exception aggregation failed', { error: error.message, teamId });
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to compute exceptions' },
    });
  }
});

export default router;
