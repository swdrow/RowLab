import { prisma } from '../db/connection.js';
import logger from '../utils/logger.js';

/**
 * Challenge templates for quick creation
 */
export const CHALLENGE_TEMPLATES = [
  {
    id: 'holiday-meters',
    name: 'Holiday Meters Challenge',
    description: 'Who can row the most meters during the break?',
    type: 'individual',
    metric: 'meters',
    defaultDurationDays: 14,
  },
  {
    id: 'weekly-attendance',
    name: 'Weekly Attendance Battle',
    description: 'Which squad has the best attendance this week?',
    type: 'collective',
    metric: 'attendance',
    defaultDurationDays: 7,
  },
  {
    id: 'monthly-volume',
    name: 'Monthly Volume Challenge',
    description: 'Total team meters for the month',
    type: 'collective',
    metric: 'meters',
    defaultDurationDays: 30,
  },
  {
    id: 'workout-streak',
    name: 'Workout Streak Challenge',
    description: 'Most consistent training over 2 weeks',
    type: 'individual',
    metric: 'workouts',
    defaultDurationDays: 14,
  },
];

/**
 * Create a new challenge
 */
export async function createChallenge(teamId, createdById, data) {
  const {
    name,
    description,
    type,
    startDate,
    endDate,
    metric,
    formula,
    handicap,
    templateId,
    athleteIds = [],
  } = data;

  // Create challenge
  const challenge = await prisma.challenge.create({
    data: {
      teamId,
      createdById,
      name,
      description,
      type,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      metric,
      formula: formula || null,
      handicap: handicap || null,
      templateId,
      status: 'active',
    },
  });

  // Add participants
  if (athleteIds.length > 0) {
    await prisma.challengeParticipant.createMany({
      data: athleteIds.map(athleteId => ({
        challengeId: challenge.id,
        athleteId,
        score: 0,
      })),
    });
  } else {
    // Auto-enroll all team athletes with gamification enabled
    const athletes = await prisma.athlete.findMany({
      where: { teamId, gamificationEnabled: true },
      select: { id: true },
    });

    if (athletes.length > 0) {
      await prisma.challengeParticipant.createMany({
        data: athletes.map(a => ({
          challengeId: challenge.id,
          athleteId: a.id,
          score: 0,
        })),
      });
    }
  }

  logger.info('Challenge created', { challengeId: challenge.id, type, metric });

  return challenge;
}

/**
 * Calculate score for a participant based on challenge metric
 */
async function calculateScore(challengeId, athleteId, challenge) {
  const { metric, startDate, endDate, formula, handicap } = challenge;

  let score = 0;

  switch (metric) {
    case 'meters': {
      const workouts = await prisma.workout.aggregate({
        where: {
          athleteId,
          date: { gte: startDate, lte: endDate },
        },
        _sum: { distanceM: true },
      });
      score = workouts._sum.distanceM || 0;
      break;
    }

    case 'workouts': {
      const count = await prisma.workout.count({
        where: {
          athleteId,
          date: { gte: startDate, lte: endDate },
        },
      });
      score = count;
      break;
    }

    case 'attendance': {
      const attendance = await prisma.attendance.count({
        where: {
          athleteId,
          date: { gte: startDate, lte: endDate },
          status: { in: ['present', 'late'] },
        },
      });
      score = attendance;
      break;
    }

    case 'composite': {
      // Weighted combination based on formula
      if (formula?.weights) {
        const meters = await prisma.workout.aggregate({
          where: { athleteId, date: { gte: startDate, lte: endDate } },
          _sum: { distanceM: true },
        });
        const workouts = await prisma.workout.count({
          where: { athleteId, date: { gte: startDate, lte: endDate } },
        });
        const attendance = await prisma.attendance.count({
          where: {
            athleteId,
            date: { gte: startDate, lte: endDate },
            status: { in: ['present', 'late'] },
          },
        });

        score =
          (meters._sum.distanceM || 0) * (formula.weights.meters || 0) +
          workouts * (formula.weights.workouts || 0) +
          attendance * (formula.weights.attendance || 0);
      }
      break;
    }
  }

  // Apply handicap if enabled
  if (handicap?.enabled) {
    const athlete = await prisma.athlete.findUnique({
      where: { id: athleteId },
      select: { weightKg: true },
    });

    if (athlete?.weightKg && handicap.type === 'weight-class') {
      const weightClass = Number(athlete.weightKg) < 75 ? 'lightweight' : 'heavyweight';
      const adjustment = handicap.adjustments?.[weightClass] || 1.0;
      score *= adjustment;
    }
  }

  return Math.round(score);
}

/**
 * Update leaderboard for a challenge
 */
export async function updateLeaderboard(challengeId) {
  const challenge = await prisma.challenge.findUnique({
    where: { id: challengeId },
    include: {
      participants: true,
    },
  });

  if (!challenge || challenge.status !== 'active') {
    return null;
  }

  // Calculate scores for all participants
  const updates = [];

  for (const participant of challenge.participants) {
    const score = await calculateScore(challengeId, participant.athleteId, challenge);
    updates.push({
      id: participant.id,
      score,
    });
  }

  // Sort by score descending to calculate ranks
  updates.sort((a, b) => b.score - a.score);

  // Update all participants with new scores and ranks
  for (let i = 0; i < updates.length; i++) {
    await prisma.challengeParticipant.update({
      where: { id: updates[i].id },
      data: {
        score: updates[i].score,
        rank: i + 1,
      },
    });
  }

  logger.info('Leaderboard updated', { challengeId, participantCount: updates.length });

  return updates;
}

/**
 * Get leaderboard for a challenge
 */
export async function getLeaderboard(challengeId) {
  const challenge = await prisma.challenge.findUnique({
    where: { id: challengeId },
  });

  if (!challenge) {
    throw new Error('Challenge not found');
  }

  const participants = await prisma.challengeParticipant.findMany({
    where: { challengeId },
    orderBy: { rank: 'asc' },
    include: {
      athlete: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatar: true,
        },
      },
    },
  });

  const leaderboard = participants.map(p => ({
    rank: p.rank || 0,
    athleteId: p.athleteId,
    athleteName: `${p.athlete.firstName} ${p.athlete.lastName}`,
    avatar: p.athlete.avatar,
    score: Number(p.score),
    contribution: p.contribution,
  }));

  return {
    challenge,
    leaderboard,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Get active challenges for a team
 */
export async function getActiveChallenges(teamId) {
  return prisma.challenge.findMany({
    where: {
      teamId,
      status: 'active',
      endDate: { gte: new Date() },
    },
    include: {
      _count: {
        select: { participants: true },
      },
    },
    orderBy: { endDate: 'asc' },
  });
}

/**
 * Get all challenges for a team (including completed)
 */
export async function getAllChallenges(teamId, status = null) {
  const where = { teamId };
  if (status) {
    where.status = status;
  }

  return prisma.challenge.findMany({
    where,
    include: {
      _count: {
        select: { participants: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Complete expired challenges
 */
export async function completeExpiredChallenges() {
  const expired = await prisma.challenge.findMany({
    where: {
      status: 'active',
      endDate: { lt: new Date() },
    },
  });

  for (const challenge of expired) {
    // Final leaderboard update
    await updateLeaderboard(challenge.id);

    // Mark as completed
    await prisma.challenge.update({
      where: { id: challenge.id },
      data: { status: 'completed' },
    });

    logger.info('Challenge completed', { challengeId: challenge.id });
  }

  return expired.length;
}

/**
 * Join a challenge
 */
export async function joinChallenge(challengeId, athleteId) {
  const challenge = await prisma.challenge.findUnique({
    where: { id: challengeId },
  });

  if (!challenge) {
    throw new Error('Challenge not found');
  }

  if (challenge.status !== 'active') {
    throw new Error('Challenge is not active');
  }

  // Check if already participating
  const existing = await prisma.challengeParticipant.findUnique({
    where: {
      challengeId_athleteId: { challengeId, athleteId },
    },
  });

  if (existing) {
    throw new Error('Already participating');
  }

  return prisma.challengeParticipant.create({
    data: {
      challengeId,
      athleteId,
      score: 0,
    },
  });
}

/**
 * Leave a challenge
 */
export async function leaveChallenge(challengeId, athleteId) {
  return prisma.challengeParticipant.delete({
    where: {
      challengeId_athleteId: { challengeId, athleteId },
    },
  });
}

/**
 * Get collective challenge total
 */
export async function getCollectiveTotal(challengeId) {
  const result = await prisma.challengeParticipant.aggregate({
    where: { challengeId },
    _sum: { score: true },
  });

  return Number(result._sum.score) || 0;
}

/**
 * Cancel a challenge (coach only)
 */
export async function cancelChallenge(challengeId) {
  return prisma.challenge.update({
    where: { id: challengeId },
    data: { status: 'cancelled' },
  });
}
