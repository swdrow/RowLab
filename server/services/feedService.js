/**
 * Social feed service — aggregates workouts from followed users.
 * Cursor-based pagination using workout date.
 */
import { prisma } from '../db/connection.js';

/**
 * Get social feed for a user.
 * @param {string} userId - The authenticated user's ID
 * @param {object} options
 * @param {'all'|'following'|'me'} options.filter - Feed filter
 * @param {string|null} options.cursor - ISO date cursor for pagination
 * @param {number} options.limit - Items per page (default 20)
 */
export async function getFeed(userId, { filter = 'all', cursor = null, limit = 20 } = {}) {
  const take = Math.min(Math.max(limit, 1), 50);

  // Build where clause based on filter
  let userIds;
  if (filter === 'me') {
    userIds = [userId];
  } else if (filter === 'following') {
    const follows = await prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });
    userIds = follows.map((f) => f.followingId);
  } else {
    // 'all' = me + following
    const follows = await prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });
    userIds = [userId, ...follows.map((f) => f.followingId)];
  }

  const where = {
    userId: { in: userIds },
    ...(cursor ? { date: { lt: new Date(cursor) } } : {}),
  };

  const workouts = await prisma.workout.findMany({
    where,
    orderBy: { date: 'desc' },
    take: take + 1, // fetch one extra to determine hasMore
    include: {
      user: {
        select: { id: true, name: true, username: true, avatarUrl: true },
      },
      _count: {
        select: { likes: true },
      },
    },
  });

  const hasMore = workouts.length > take;
  const items = hasMore ? workouts.slice(0, take) : workouts;

  // Check if current user liked each workout
  const workoutIds = items.map((w) => w.id);
  const userLikes = await prisma.workoutLike.findMany({
    where: { userId, workoutId: { in: workoutIds } },
    select: { workoutId: true },
  });
  const likedSet = new Set(userLikes.map((l) => l.workoutId));

  const feedItems = items.map((w) => ({
    id: w.id,
    date: w.date.toISOString(),
    source: w.source,
    machineType: w.machineType,
    distanceM: w.distanceM,
    durationSeconds: w.durationSeconds,
    avgPace: w.avgPace,
    avgWatts: w.avgWatts,
    strokeRate: w.strokeRate,
    notes: w.notes,
    user: w.user,
    likeCount: w._count.likes,
    isLiked: likedSet.has(w.id),
  }));

  return {
    items: feedItems,
    nextCursor: hasMore ? items[items.length - 1].date.toISOString() : null,
    hasMore,
  };
}

/**
 * Toggle like on a workout.
 * Returns { liked: boolean, likeCount: number }
 */
export async function toggleLike(userId, workoutId) {
  const existing = await prisma.workoutLike.findUnique({
    where: { userId_workoutId: { userId, workoutId } },
  });

  if (existing) {
    await prisma.workoutLike.delete({ where: { id: existing.id } });
  } else {
    await prisma.workoutLike.create({ data: { userId, workoutId } });
  }

  const likeCount = await prisma.workoutLike.count({ where: { workoutId } });
  return { liked: !existing, likeCount };
}

/**
 * Get follow stats for a user.
 */
export async function getFollowStats(userId) {
  const [followersCount, followingCount] = await Promise.all([
    prisma.follow.count({ where: { followingId: userId } }),
    prisma.follow.count({ where: { followerId: userId } }),
  ]);
  return { followersCount, followingCount };
}

/**
 * Follow a user. Returns { following: boolean }.
 */
export async function followUser(followerId, followingId) {
  if (followerId === followingId) throw new Error('Cannot follow yourself');

  await prisma.follow.create({
    data: { followerId, followingId },
  });
  return { following: true };
}

/**
 * Unfollow a user. Returns { following: boolean }.
 */
export async function unfollowUser(followerId, followingId) {
  await prisma.follow.delete({
    where: { followerId_followingId: { followerId, followingId } },
  });
  return { following: false };
}
