import { prisma } from '../db/connection.js';
import logger from '../utils/logger.js';

/**
 * Season Milestones Service
 * Generates season timeline from existing data (erg tests, regattas, challenges, PRs)
 */

/**
 * Get season milestones for team
 * Aggregates key events into a chronological timeline
 */
export async function getSeasonMilestones(teamId, seasonStartDate = null, seasonEndDate = null) {
  try {
    // Default to current season (last 6 months)
    const endDate = seasonEndDate ? new Date(seasonEndDate) : new Date();
    const startDate = seasonStartDate
      ? new Date(seasonStartDate)
      : new Date(endDate.getTime() - 180 * 24 * 60 * 60 * 1000); // 6 months ago

    const milestones = [];

    // 1. First erg test of season
    const firstErgTest = await prisma.ergTest.findFirst({
      where: {
        teamId,
        testDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { testDate: 'asc' },
      include: {
        athlete: true,
      },
    });

    if (firstErgTest) {
      milestones.push({
        type: 'first-test',
        date: firstErgTest.testDate,
        title: 'Season Begins',
        description: `First erg test: ${firstErgTest.athlete.firstName} ${firstErgTest.athlete.lastName} - ${firstErgTest.testType}`,
        icon: 'calendar',
      });
    }

    // 2. First regatta
    const firstRegatta = await prisma.regatta.findFirst({
      where: {
        teamId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: 'asc' },
    });

    if (firstRegatta) {
      milestones.push({
        type: 'first-regatta',
        date: firstRegatta.date,
        title: 'Racing Begins',
        description: `First regatta: ${firstRegatta.name}`,
        icon: 'flag',
      });
    }

    // 3. Team PRs (fastest erg tests)
    const teamPRs = await prisma.ergTest.findMany({
      where: {
        teamId,
        testDate: {
          gte: startDate,
          lte: endDate,
        },
        isPR: true, // Assumes PR detection logic sets this field
      },
      orderBy: { testDate: 'asc' },
      include: {
        athlete: true,
      },
      take: 10, // Limit to top 10 PRs for timeline
    });

    teamPRs.forEach((pr) => {
      milestones.push({
        type: 'pr',
        date: pr.testDate,
        title: 'Personal Record',
        description: `${pr.athlete.firstName} ${pr.athlete.lastName} - ${pr.testType}: ${formatTime(pr.time)}`,
        icon: 'trophy',
      });
    });

    // 4. Challenge completions
    const challengeWins = await prisma.challenge.findMany({
      where: {
        teamId,
        status: 'completed',
        endDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { endDate: 'asc' },
      include: {
        _count: {
          select: { participants: true },
        },
      },
    });

    challengeWins.forEach((challenge) => {
      milestones.push({
        type: 'challenge-complete',
        date: challenge.endDate,
        title: 'Challenge Completed',
        description: `${challenge.name} (${challenge._count.participants} participants)`,
        icon: 'target',
      });
    });

    // 5. Practice milestones (every 50 sessions)
    const sessionCount = await prisma.session.count({
      where: {
        teamId,
        date: {
          gte: startDate,
          lte: endDate,
        },
        status: 'completed',
      },
    });

    if (sessionCount >= 50) {
      const milestoneSession = await prisma.session.findMany({
        where: {
          teamId,
          date: {
            gte: startDate,
            lte: endDate,
          },
          status: 'completed',
        },
        orderBy: { date: 'asc' },
        skip: 49, // 50th session
        take: 1,
      });

      if (milestoneSession.length > 0) {
        milestones.push({
          type: 'practice-milestone',
          date: milestoneSession[0].date,
          title: '50 Practices',
          description: 'Team reached 50 completed sessions',
          icon: 'award',
        });
      }
    }

    // Sort all milestones chronologically
    milestones.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Calculate summary stats
    const totalMeters = await prisma.ergTest.aggregate({
      where: {
        teamId,
        testDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        distance: true,
      },
    });

    const completedSessions = await prisma.session.count({
      where: {
        teamId,
        date: {
          gte: startDate,
          lte: endDate,
        },
        status: 'completed',
      },
    });

    const achievementsCount = await prisma.achievementProgress.count({
      where: {
        athlete: {
          teamId,
        },
        unlockedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    return {
      milestones,
      stats: {
        totalMeters: totalMeters._sum.distance || 0,
        totalSessions: completedSessions,
        totalPRs: teamPRs.length,
        totalAchievements: achievementsCount,
        totalChallenges: challengeWins.length,
      },
      seasonPeriod: {
        start: startDate,
        end: endDate,
      },
    };
  } catch (error) {
    logger.error('Failed to fetch season milestones', { error: error.message });
    throw error;
  }
}

/**
 * Format time in seconds to MM:SS.T
 */
function formatTime(seconds) {
  if (!seconds) return '--:--.-';
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(1);
  return `${mins}:${secs.padStart(4, '0')}`;
}
