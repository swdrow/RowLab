import { useActivityFeed } from '../../hooks/useActivityFeed';
import { useDashboardPrefs } from '../../hooks/useDashboardPrefs';
import { ActivityCard } from './ActivityCard';

/**
 * Loading skeleton matching ActivityCard layout
 */
function ActivitySkeleton() {
  return (
    <div className="rounded-lg bg-card-bg p-4 border border-card-border animate-pulse">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Source badge skeleton */}
          <div className="w-12 h-5 bg-bg-hover rounded" />

          {/* Title skeleton */}
          <div className="min-w-0 flex-1">
            <div className="w-3/4 h-5 bg-bg-hover rounded mb-2" />
            <div className="w-1/2 h-4 bg-bg-hover rounded" />
          </div>
        </div>

        {/* Metrics skeleton */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-5 bg-bg-hover rounded" />
          <div className="w-12 h-5 bg-bg-hover rounded" />
          <div className="w-5 h-5 bg-bg-hover rounded" />
        </div>
      </div>
    </div>
  );
}

/**
 * Empty state when no activities
 */
function EmptyState() {
  return (
    <div className="rounded-lg bg-card-bg p-8 border border-card-border text-center">
      <svg
        className="w-12 h-12 mx-auto mb-4 text-text-secondary"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 10V3L4 14h7v7l9-11h-7z"
        />
      </svg>
      <h3 className="text-text-primary font-medium mb-2">No activities yet</h3>
      <p className="text-text-secondary text-sm">
        Your recent workouts from Concept2, Strava, and manual entries will appear here.
      </p>
    </div>
  );
}

/**
 * UnifiedActivityFeed - Displays deduplicated activities from all sources
 *
 * Features:
 * - Respects hidden sources from dashboard preferences
 * - Shows loading skeleton during fetch
 * - Shows error state with retry
 * - Shows empty state when no activities
 * - Displays activity count in header
 */
export function UnifiedActivityFeed() {
  const { preferences, isLoading: prefsLoading } = useDashboardPrefs();
  const hiddenSources = preferences?.hiddenSources || [];

  const {
    data,
    isLoading: activitiesLoading,
    error,
    refetch,
  } = useActivityFeed({
    limit: 20,
    excludeSources: hiddenSources,
    enabled: !prefsLoading, // Don't fetch until prefs loaded
  });

  const isLoading = prefsLoading || activitiesLoading;
  const activities = data?.activities || [];
  const activityCount = data?.pagination.count || 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-text-primary font-semibold text-lg">
          Recent Activities
          {!isLoading && activityCount > 0 && (
            <span className="ml-2 text-text-secondary text-sm font-normal">
              ({activityCount})
            </span>
          )}
        </h2>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <ActivitySkeleton key={i} />
          ))}
        </div>
      )}

      {/* Error state */}
      {!isLoading && error && (
        <div className="rounded-lg bg-card-bg p-6 border border-card-border">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-status-error shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="flex-1 min-w-0">
              <h3 className="text-text-primary font-medium mb-1">
                Failed to load activities
              </h3>
              <p className="text-text-secondary text-sm mb-3">
                {error instanceof Error ? error.message : 'An error occurred'}
              </p>
              <button
                onClick={() => refetch()}
                className="px-3 py-1.5 text-sm font-medium rounded bg-button-secondary-bg text-button-secondary-text hover:bg-button-secondary-hover transition-colors"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && activities.length === 0 && <EmptyState />}

      {/* Activities list */}
      {!isLoading && !error && activities.length > 0 && (
        <div className="space-y-3">
          {activities.map((activity) => (
            <ActivityCard key={activity.id} activity={activity} />
          ))}
        </div>
      )}
    </div>
  );
}
