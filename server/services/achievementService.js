import { prisma } from '../db/connection.js';
import logger from '../utils/logger.js';

/**
 * Seed default achievements if none exist
 */
export async function seedDefaultAchievements() {
  const count = await prisma.achievement.count();
  if (count > 0) return;

  const defaults = [
    // Erg - Volume
    { name: 'First 100K', description: 'Row 100,000 meters on the erg', category: 'Erg', type: 'volume', rarity: 'Common', criteria: { type: 'volume', target: 100000, metric: 'meters' } },
    { name: 'Half Million', description: 'Row 500,000 meters on the erg', category: 'Erg', type: 'volume', rarity: 'Rare', criteria: { type: 'volume', target: 500000, metric: 'meters' } },
    { name: 'Millionaire', description: 'Row 1,000,000 meters on the erg', category: 'Erg', type: 'volume', rarity: 'Epic', criteria: { type: 'volume', target: 1000000, metric: 'meters' } },
    { name: 'Two Million Club', description: 'Row 2,000,000 meters on the erg', category: 'Erg', type: 'volume', rarity: 'Legendary', criteria: { type: 'volume', target: 2000000, metric: 'meters' } },

    // Erg - First-time
    { name: 'First 2K', description: 'Complete your first 2K test', category: 'Erg', type: 'first-time', rarity: 'Common', criteria: { type: 'count', target: 1, testType: '2k' } },
    { name: 'First 6K', description: 'Complete your first 6K test', category: 'Erg', type: 'first-time', rarity: 'Common', criteria: { type: 'count', target: 1, testType: '6k' } },

    // Attendance - Consistency
    { name: 'Perfect Week', description: 'Attend every practice in a week', category: 'Attendance', type: 'consistency', rarity: 'Common', criteria: { type: 'streak', target: 5, metric: 'days' } },
    { name: 'Iron Commitment', description: 'Maintain a 30-day attendance streak', category: 'Attendance', type: 'consistency', rarity: 'Rare', criteria: { type: 'streak', target: 30, metric: 'days' } },
    { name: 'Season Perfect', description: 'Maintain 95%+ attendance for a season', category: 'Attendance', type: 'consistency', rarity: 'Epic', criteria: { type: 'percentage', target: 95, metric: 'attendance' } },

    // Racing - Performance
    { name: 'First Medal', description: 'Earn your first regatta medal', category: 'Racing', type: 'performance', rarity: 'Rare', criteria: { type: 'count', target: 1, metric: 'medals' } },
    { name: 'Champion', description: 'Win a regatta final', category: 'Racing', type: 'performance', rarity: 'Epic', criteria: { type: 'count', target: 1, metric: 'wins' } },
  ];

  await prisma.achievement.createMany({ data: defaults });
  logger.info('Seeded default achievements', { count: defaults.length });
}

/**
 * Get all achievements with athlete's progress
 */
export async function getAchievementsWithProgress(athleteId, teamId) {
  // Get all achievements
  const achievements = await prisma.achievement.findMany({
    orderBy: [
      { category: 'asc' },
      { rarity: 'asc' },
    ],
  });

  // Get athlete's progress on all achievements
  const athleteProgress = await prisma.athleteAchievement.findMany({
    where: { athleteId },
  });

  const progressMap = new Map(athleteProgress.map(p => [p.achievementId, p]));

  // Combine achievements with progress
  return achievements.map(achievement => {
    const progress = progressMap.get(achievement.id);
    const target = achievement.criteria.target || 1;
    const currentProgress = progress?.progress || 0;

    return {
      ...achievement,
      progress: currentProgress,
      target,
      percentComplete: Math.min(100, Math.round((currentProgress / target) * 100)),
      isUnlocked: progress?.unlockedAt !== null && progress?.unlockedAt !== undefined,
      unlockedAt: progress?.unlockedAt,
      isPinned: progress?.isPinned || false,
    };
  });
}

/**
 * Update progress for an achievement
 * Returns true if achievement was unlocked
 */
export async function updateProgress(athleteId, achievementId, newProgress) {
  const achievement = await prisma.achievement.findUnique({
    where: { id: achievementId },
  });

  if (!achievement) {
    throw new Error('Achievement not found');
  }

  const target = achievement.criteria.target || 1;
  const isUnlocked = newProgress >= target;

  await prisma.athleteAchievement.upsert({
    where: {
      athleteId_achievementId: { athleteId, achievementId },
    },
    create: {
      athleteId,
      achievementId,
      progress: newProgress,
      unlockedAt: isUnlocked ? new Date() : null,
    },
    update: {
      progress: newProgress,
      unlockedAt: isUnlocked ? new Date() : undefined, // Only set if unlocking
    },
  });

  return isUnlocked;
}

/**
 * Check and update progress for volume-based achievements
 */
export async function checkVolumeAchievements(athleteId, teamId) {
  // Get total meters from workouts and erg tests
  const [workoutMeters, ergTestMeters] = await Promise.all([
    prisma.workout.aggregate({
      where: { athleteId },
      _sum: { distanceM: true },
    }),
    prisma.ergTest.aggregate({
      where: { athleteId },
      _sum: { distanceM: true },
    }),
  ]);

  const totalMeters = (workoutMeters._sum.distanceM || 0) + (ergTestMeters._sum.distanceM || 0);

  // Get volume achievements
  const volumeAchievements = await prisma.achievement.findMany({
    where: {
      category: 'Erg',
      type: 'volume',
    },
  });

  const unlocked = [];

  for (const achievement of volumeAchievements) {
    const wasUnlocked = await updateProgress(athleteId, achievement.id, totalMeters);
    if (wasUnlocked) {
      unlocked.push(achievement);
    }
  }

  return unlocked;
}

/**
 * Check first-time achievements for a test type
 */
export async function checkFirstTimeAchievements(athleteId, testType) {
  const achievement = await prisma.achievement.findFirst({
    where: {
      category: 'Erg',
      type: 'first-time',
      criteria: {
        path: ['testType'],
        equals: testType,
      },
    },
  });

  if (!achievement) return null;

  // Check if already unlocked
  const existing = await prisma.athleteAchievement.findUnique({
    where: {
      athleteId_achievementId: { athleteId, achievementId: achievement.id },
    },
  });

  if (existing?.unlockedAt) return null;

  // Count tests of this type
  const count = await prisma.ergTest.count({
    where: { athleteId, testType },
  });

  if (count >= 1) {
    await updateProgress(athleteId, achievement.id, count);
    return achievement;
  }

  return null;
}

/**
 * Toggle pinned status for an achievement
 */
export async function togglePinned(athleteId, achievementId) {
  // Check current pinned count
  const pinnedCount = await prisma.athleteAchievement.count({
    where: {
      athleteId,
      isPinned: true,
    },
  });

  const current = await prisma.athleteAchievement.findUnique({
    where: {
      athleteId_achievementId: { athleteId, achievementId },
    },
  });

  if (!current) {
    throw new Error('Achievement not found for athlete');
  }

  // Max 5 pinned per CONTEXT.md
  if (!current.isPinned && pinnedCount >= 5) {
    throw new Error('Maximum 5 pinned achievements allowed');
  }

  const updated = await prisma.athleteAchievement.update({
    where: {
      athleteId_achievementId: { athleteId, achievementId },
    },
    data: {
      isPinned: !current.isPinned,
    },
  });

  return updated;
}

/**
 * Get pinned achievements for an athlete
 */
export async function getPinnedAchievements(athleteId) {
  return prisma.athleteAchievement.findMany({
    where: {
      athleteId,
      isPinned: true,
      unlockedAt: { not: null },
    },
    include: {
      achievement: true,
    },
    orderBy: {
      unlockedAt: 'desc',
    },
  });
}

/**
 * Get athlete's unlocked achievements
 */
export async function getUnlockedAchievements(athleteId) {
  return prisma.athleteAchievement.findMany({
    where: {
      athleteId,
      unlockedAt: { not: null },
    },
    include: {
      achievement: true,
    },
    orderBy: {
      unlockedAt: 'desc',
    },
  });
}
