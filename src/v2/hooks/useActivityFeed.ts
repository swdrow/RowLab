import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import type { DeduplicatedActivity, ActivityFeedResponse, ApiResponse, ActivitySource } from '../types/dashboard';

const API_URL = import.meta.env.VITE_API_URL || '';

interface ActivityFeedOptions {
  limit?: number;
  offset?: number;
  excludeSources?: ActivitySource[];
  enabled?: boolean;
}

/**
 * Fetch activity feed for current user
 */
async function fetchActivities(options: ActivityFeedOptions): Promise<ActivityFeedResponse> {
  const params = new URLSearchParams();

  if (options.limit) params.append('limit', String(options.limit));
  if (options.offset) params.append('offset', String(options.offset));
  if (options.excludeSources?.length) {
    params.append('excludeSources', options.excludeSources.join(','));
  }

  const url = `${API_URL}/api/v1/activities${params.toString() ? `?${params}` : ''}`;

  const response = await axios.get<ApiResponse<ActivityFeedResponse>>(url, {
    withCredentials: true,
  });

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to fetch activities');
  }

  return response.data.data;
}

/**
 * Hook for unified activity feed
 *
 * Uses stable queryKey to prevent refetching on every render.
 * Excludes sources from hidden sources in preferences.
 */
export function useActivityFeed(options: ActivityFeedOptions = {}) {
  const {
    limit = 20,
    offset = 0,
    excludeSources = [],
    enabled = true,
  } = options;

  // Stable query key - use primitive values, not object references
  const excludeKey = excludeSources.sort().join(',');

  return useQuery({
    queryKey: ['activities', limit, offset, excludeKey],
    queryFn: () => fetchActivities({ limit, offset, excludeSources }),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Get activity type display name
 */
export function getActivityTypeName(activityType?: string): string {
  if (!activityType) return 'Activity';

  const t = activityType.toLowerCase();
  if (t.includes('row') || t.includes('erg')) return 'Rowing';
  if (t.includes('bike') || t.includes('cycling')) return 'Cycling';
  if (t.includes('run')) return 'Running';
  if (t.includes('swim')) return 'Swimming';
  if (t.includes('weight') || t.includes('strength')) return 'Strength';

  // Capitalize first letter
  return activityType.charAt(0).toUpperCase() + activityType.slice(1);
}

/**
 * Format duration from seconds to display string
 */
export function formatDuration(seconds?: number): string {
  if (!seconds) return '--';

  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format distance from meters to display string
 */
export function formatDistance(meters?: number): string {
  if (!meters) return '--';

  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)}km`;
  }
  return `${meters}m`;
}
