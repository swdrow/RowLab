/**
 * Social feed types.
 * Matches the response shapes from GET /api/u/feed and related endpoints.
 */

export interface FeedUser {
  id: string;
  name: string;
  username: string | null;
  avatarUrl: string | null;
}

export interface FeedItem {
  id: string;
  date: string;
  source: 'manual' | 'concept2_sync' | 'strava_sync' | 'garmin';
  machineType: string | null;
  distanceM: number | null;
  durationSeconds: number | null;
  avgPace: number | null;
  avgWatts: number | null;
  strokeRate: number | null;
  notes: string | null;
  user: FeedUser;
  likeCount: number;
  isLiked: boolean;
}

export interface FeedData {
  items: FeedItem[];
  nextCursor: string | null;
  hasMore: boolean;
}

export type FeedFilter = 'all' | 'following' | 'me';

export interface FeedFilters {
  filter: FeedFilter;
}

export interface FollowStats {
  followersCount: number;
  followingCount: number;
}

export interface ToggleLikeResult {
  liked: boolean;
  likeCount: number;
}

export interface FollowResult {
  following: boolean;
}
