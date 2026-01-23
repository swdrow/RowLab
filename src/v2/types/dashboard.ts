/**
 * Activity sources matching Prisma enum
 */
export type ActivitySource = 'CONCEPT2' | 'STRAVA' | 'MANUAL';

/**
 * Dashboard widget identifiers
 */
export type WidgetId = 'headline' | 'c2-logbook' | 'strava-feed' | 'activity-feed' | 'quick-stats';

/**
 * Dashboard preferences from backend
 */
export interface DashboardPreferences {
  id?: string;
  userId?: string;
  pinnedModules: WidgetId[];
  hiddenSources: ActivitySource[];
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Activity from a specific source
 */
export interface Activity {
  id: string;
  userId: string;
  teamId?: string;
  source: ActivitySource;
  sourceId: string;
  activityType?: string;
  title: string;
  description?: string;
  date: string;
  data?: ActivityData;
  createdAt: string;
}

/**
 * Source-specific activity data
 */
export interface ActivityData {
  distanceM?: number;
  distance?: number; // Alternative field name from some sources
  durationSeconds?: number;
  splitSeconds?: number;
  avgPace?: string;
  avgHeartRate?: number;
  maxHeartRate?: number;
  strokeRate?: number;
  watts?: number;
  calories?: number;
  // Strava-specific
  movingTime?: number;
  elapsedTime?: number;
  elevationGain?: number;
  // C2-specific
  workoutType?: string;
  dragFactor?: number;
}

/**
 * Activity with deduplication metadata
 */
export interface DeduplicatedActivity extends Activity {
  isPrimary: boolean;
  duplicates?: DuplicateReference[];
}

/**
 * Reference to a duplicate activity
 */
export interface DuplicateReference {
  id: string;
  source: ActivitySource;
  sourceId: string;
}

/**
 * Activity feed response from API
 */
export interface ActivityFeedResponse {
  activities: DeduplicatedActivity[];
  pagination: {
    limit: number;
    offset: number;
    count: number;
  };
}

/**
 * API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown[];
  };
}
