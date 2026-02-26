import { prisma } from '../db/connection.js';
import logger from '../utils/logger.js';

/**
 * Valid activity types for the team activity feed.
 */
const ACTIVITY_TYPES = [
  'member_joined',
  'member_left',
  'role_changed',
  'announcement',
  'team_created',
  'team_updated',
  'invite_generated',
];

/**
 * Log a team activity event.
 *
 * This is designed to be fire-and-forget: call with .catch(console.error)
 * from the calling flow rather than awaiting.
 *
 * @param {object} params
 * @param {string} params.teamId - Team UUID
 * @param {string|null} params.userId - Actor user UUID (null for system events)
 * @param {string} params.type - One of ACTIVITY_TYPES
 * @param {string} params.title - Human-readable event description
 * @param {object} [params.data] - Optional additional data (JSON)
 * @returns {Promise<object>} Created activity record
 */
export async function logActivity({ teamId, userId, type, title, data }) {
  if (!ACTIVITY_TYPES.includes(type)) {
    logger.warn('Unknown activity type', { type, teamId });
  }

  return prisma.teamActivity.create({
    data: {
      teamId,
      userId: userId || null,
      type,
      title,
      data: data || undefined,
    },
  });
}

/**
 * Get a paginated activity feed for a team.
 *
 * Uses cursor-based pagination keyed on createdAt (ISO string).
 * Returns events enriched with actor info (name, avatarUrl).
 *
 * @param {string} teamId - Team UUID
 * @param {object} options
 * @param {string} [options.cursor] - ISO string of the last event's createdAt
 * @param {number} [options.limit=20] - Number of events to return
 * @returns {Promise<object>} { events: [], nextCursor: string|null }
 */
export async function getActivityFeed(teamId, { cursor, limit = 20 } = {}) {
  const take = Math.min(Math.max(limit, 1), 100); // Clamp between 1 and 100

  const where = { teamId };
  if (cursor) {
    where.createdAt = { lt: new Date(cursor) };
  }

  const activities = await prisma.teamActivity.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: take + 1, // Fetch one extra to determine if there's a next page
  });

  const hasMore = activities.length > take;
  const events = hasMore ? activities.slice(0, take) : activities;

  // Collect unique userIds for actor enrichment
  const userIds = [...new Set(events.map((a) => a.userId).filter(Boolean))];

  let actorMap = {};
  if (userIds.length > 0) {
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, avatarUrl: true },
    });
    actorMap = Object.fromEntries(
      users.map((u) => [u.id, { name: u.name, avatarUrl: u.avatarUrl }])
    );
  }

  const enrichedEvents = events.map((event) => {
    const actor = event.userId
      ? actorMap[event.userId] || { name: 'Unknown', avatarUrl: null }
      : null;
    return {
      id: event.id,
      type: event.type,
      actorId: event.userId || null,
      actorName: actor?.name || null,
      actorAvatarUrl: actor?.avatarUrl || null,
      title: event.title,
      data: event.data,
      createdAt: event.createdAt.toISOString(),
    };
  });

  return {
    events: enrichedEvents,
    nextCursor: hasMore ? events[events.length - 1].createdAt.toISOString() : null,
  };
}
