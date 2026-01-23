import prisma from '../db/connection.js';
import logger from '../utils/logger.js';

/**
 * Time window for deduplication matching (milliseconds)
 * Two activities within 5 minutes may be the same workout
 */
const DEDUP_TIME_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Distance tolerance for deduplication (percentage)
 * Activities must be within 10% distance to be considered duplicates
 */
const DEDUP_DISTANCE_TOLERANCE = 0.1; // 10%

/**
 * Get rounded time window key for grouping
 * Rounds to nearest 5-minute block
 */
function getTimeWindowKey(date) {
  const d = new Date(date);
  const minutes = Math.floor(d.getMinutes() / 5) * 5;
  d.setMinutes(minutes, 0, 0);
  return d.toISOString();
}

/**
 * Check if two activities are likely the same workout
 */
function areSimilarActivities(a, b) {
  // Must be within time window
  const timeDiff = Math.abs(new Date(a.date).getTime() - new Date(b.date).getTime());
  if (timeDiff > DEDUP_TIME_WINDOW_MS) return false;

  // If both have distance data, check tolerance
  const distA = a.data?.distanceM || a.data?.distance;
  const distB = b.data?.distanceM || b.data?.distance;

  if (distA && distB) {
    const distDiff = Math.abs(distA - distB) / Math.max(distA, distB);
    if (distDiff > DEDUP_DISTANCE_TOLERANCE) return false;
  }

  // Activity types should match (if both have type)
  if (a.activityType && b.activityType) {
    const typeA = normalizeActivityType(a.activityType);
    const typeB = normalizeActivityType(b.activityType);
    if (typeA !== typeB) return false;
  }

  return true;
}

/**
 * Normalize activity type for comparison
 */
function normalizeActivityType(type) {
  if (!type) return 'unknown';
  const t = type.toLowerCase();
  if (t.includes('row') || t.includes('erg')) return 'rowing';
  if (t.includes('bike') || t.includes('cycling')) return 'cycling';
  if (t.includes('run')) return 'running';
  return t;
}

/**
 * Select primary activity from a group of duplicates
 * C2 is always primary for rowing activities (canonical erg data)
 */
function selectPrimary(activities) {
  // Sort by source priority: CONCEPT2 > STRAVA > MANUAL
  const sorted = [...activities].sort((a, b) => {
    const priority = { CONCEPT2: 0, STRAVA: 1, MANUAL: 2 };
    const prioA = priority[a.source] ?? 3;
    const prioB = priority[b.source] ?? 3;

    // For rowing, C2 is always primary
    if (normalizeActivityType(a.activityType) === 'rowing' ||
        normalizeActivityType(b.activityType) === 'rowing') {
      if (a.source === 'CONCEPT2') return -1;
      if (b.source === 'CONCEPT2') return 1;
    }

    return prioA - prioB;
  });

  return sorted[0];
}

/**
 * Get unified activity feed with deduplication
 * @param {string} userId - User ID
 * @param {Object} options - Query options
 * @param {number} options.limit - Max activities to return
 * @param {number} options.offset - Pagination offset
 * @param {string[]} options.excludeSources - Sources to exclude
 * @returns {Promise<Array>} Deduplicated activities
 */
export async function getUnifiedActivityFeed(userId, options = {}) {
  const { limit = 20, offset = 0, excludeSources = [] } = options;

  // Fetch more than limit to account for deduplication
  const fetchLimit = Math.min((limit + offset) * 2, 100);

  const where = { userId };
  if (excludeSources.length > 0) {
    where.source = { notIn: excludeSources };
  }

  const activities = await prisma.activity.findMany({
    where,
    orderBy: { date: 'desc' },
    take: fetchLimit,
  });

  // Group by time window + activity type for deduplication
  const groups = new Map();

  for (const activity of activities) {
    const timeKey = getTimeWindowKey(activity.date);
    const typeKey = normalizeActivityType(activity.activityType);
    const groupKey = `${timeKey}-${typeKey}`;

    if (!groups.has(groupKey)) {
      groups.set(groupKey, [activity]);
    } else {
      // Check if this activity is similar to any in the group
      const group = groups.get(groupKey);
      const hasSimilar = group.some(g => areSimilarActivities(activity, g));

      if (hasSimilar) {
        group.push(activity);
      } else {
        // Not similar, create new group
        const newKey = `${groupKey}-${activity.id}`;
        groups.set(newKey, [activity]);
      }
    }
  }

  // Process each group: select primary, attach duplicates
  const deduplicated = [];

  for (const group of groups.values()) {
    const primary = selectPrimary(group);
    const duplicates = group
      .filter(a => a.id !== primary.id)
      .map(d => ({
        id: d.id,
        source: d.source,
        sourceId: d.sourceId,
      }));

    deduplicated.push({
      ...primary,
      isPrimary: true,
      duplicates: duplicates.length > 0 ? duplicates : undefined,
    });
  }

  // Sort by date descending, apply pagination
  deduplicated.sort((a, b) => new Date(b.date) - new Date(a.date));

  return deduplicated.slice(offset, offset + limit);
}
