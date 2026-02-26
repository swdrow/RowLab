import express from 'express';
import { getUserStats } from '../../services/userScopedService.js';
import { prisma } from '../../db/connection.js';

const router = express.Router();

// ============================================
// Achievement Definitions
// ============================================

const PROFILE_ACHIEVEMENTS = [
  // Distance milestones
  {
    id: 'distance-100k',
    name: 'First 100K',
    description: 'Row 100,000 meters total',
    category: 'Distance',
    icon: 'milestone',
    target: 100000,
    metric: 'totalMeters',
  },
  {
    id: 'distance-500k',
    name: 'Half Million',
    description: 'Row 500,000 meters total',
    category: 'Distance',
    icon: 'milestone',
    target: 500000,
    metric: 'totalMeters',
  },
  {
    id: 'distance-1m',
    name: 'Million Meter Club',
    description: 'Row 1,000,000 meters total',
    category: 'Distance',
    icon: 'trophy',
    target: 1000000,
    metric: 'totalMeters',
  },
  {
    id: 'distance-2m',
    name: 'Double Millionaire',
    description: 'Row 2,000,000 meters total',
    category: 'Distance',
    icon: 'trophy',
    target: 2000000,
    metric: 'totalMeters',
  },
  {
    id: 'distance-5m',
    name: 'Marathon Warrior',
    description: 'Row 5,000,000 meters total',
    category: 'Distance',
    icon: 'legend',
    target: 5000000,
    metric: 'totalMeters',
  },

  // Workout count milestones
  {
    id: 'workouts-10',
    name: 'Getting Started',
    description: 'Complete 10 workouts',
    category: 'Consistency',
    icon: 'starter',
    target: 10,
    metric: 'workoutCount',
  },
  {
    id: 'workouts-50',
    name: 'Dedicated',
    description: 'Complete 50 workouts',
    category: 'Consistency',
    icon: 'dedication',
    target: 50,
    metric: 'workoutCount',
  },
  {
    id: 'workouts-100',
    name: 'Century Club',
    description: 'Complete 100 workouts',
    category: 'Consistency',
    icon: 'century',
    target: 100,
    metric: 'workoutCount',
  },
  {
    id: 'workouts-250',
    name: 'Iron Will',
    description: 'Complete 250 workouts',
    category: 'Consistency',
    icon: 'iron',
    target: 250,
    metric: 'workoutCount',
  },
  {
    id: 'workouts-500',
    name: 'Relentless',
    description: 'Complete 500 workouts',
    category: 'Consistency',
    icon: 'legend',
    target: 500,
    metric: 'workoutCount',
  },

  // Streak milestones
  {
    id: 'streak-3',
    name: 'Three-Peat',
    description: '3-day workout streak',
    category: 'Streak',
    icon: 'streak',
    target: 3,
    metric: 'longestStreak',
  },
  {
    id: 'streak-7',
    name: 'Full Week',
    description: '7-day workout streak',
    category: 'Streak',
    icon: 'streak',
    target: 7,
    metric: 'longestStreak',
  },
  {
    id: 'streak-14',
    name: 'Fortnight Fighter',
    description: '14-day workout streak',
    category: 'Streak',
    icon: 'streak',
    target: 14,
    metric: 'longestStreak',
  },
  {
    id: 'streak-30',
    name: 'Month of Madness',
    description: '30-day workout streak',
    category: 'Streak',
    icon: 'legend',
    target: 30,
    metric: 'longestStreak',
  },

  // Duration milestones
  {
    id: 'duration-10h',
    name: 'Ten Hours',
    description: 'Log 10 hours of training',
    category: 'Duration',
    icon: 'time',
    target: 36000,
    metric: 'totalDurationSeconds',
  },
  {
    id: 'duration-50h',
    name: 'Fifty Hours',
    description: 'Log 50 hours of training',
    category: 'Duration',
    icon: 'time',
    target: 180000,
    metric: 'totalDurationSeconds',
  },
  {
    id: 'duration-100h',
    name: 'Hundred Hours',
    description: 'Log 100 hours of training',
    category: 'Duration',
    icon: 'trophy',
    target: 360000,
    metric: 'totalDurationSeconds',
  },

  // Variety
  {
    id: 'variety-multi-machine',
    name: 'Multi-Machine',
    description: 'Use 2+ different erg machine types',
    category: 'Variety',
    icon: 'variety',
    target: 2,
    metric: 'machineTypeCount',
  },
];

// ============================================
// GET /api/u/achievements
// ============================================

router.get('/', async (req, res, next) => {
  try {
    // Get user stats for metric values
    const stats = await getUserStats(req.user.id, 'all');

    // Get distinct machine types from workouts for variety achievement
    const athleteIds = await getAthleteIds(req.user.id);
    const machineTypes = await prisma.workout.findMany({
      where: buildWhere(req.user.id, athleteIds),
      select: { machineType: true },
      distinct: ['machineType'],
    });
    const machineTypeCount = machineTypes.filter((m) => m.machineType).length;

    // Build metrics lookup
    const metrics = {
      totalMeters: stats.allTime.totalMeters,
      totalDurationSeconds: stats.allTime.totalDurationSeconds,
      workoutCount: stats.allTime.workoutCount,
      longestStreak: stats.streak.longest,
      machineTypeCount,
    };

    // Evaluate each achievement
    const achievements = PROFILE_ACHIEVEMENTS.map((def) => {
      const progress = metrics[def.metric] || 0;
      const unlocked = progress >= def.target;
      return {
        id: def.id,
        name: def.name,
        description: def.description,
        category: def.category,
        icon: def.icon,
        target: def.target,
        progress: Math.min(progress, def.target),
        progressRaw: progress,
        unlocked,
      };
    });

    const unlockedCount = achievements.filter((a) => a.unlocked).length;
    const totalCount = achievements.length;

    res.json({
      success: true,
      data: {
        achievements,
        summary: {
          unlocked: unlockedCount,
          total: totalCount,
          percentage: Math.round((unlockedCount / totalCount) * 100),
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

// ============================================
// Helpers (duplicated minimally from service)
// ============================================

async function getAthleteIds(userId) {
  const athletes = await prisma.athlete.findMany({
    where: { userId },
    select: { id: true },
  });
  return athletes.map((a) => a.id);
}

function buildWhere(userId, athleteIds) {
  return {
    OR: [
      { userId },
      ...(athleteIds.length > 0 ? [{ athleteId: { in: athleteIds }, userId: null }] : []),
    ],
  };
}

export default router;
