import { Link } from 'react-router-dom';
import { Lightning } from '@phosphor-icons/react';
import { useUnifiedActivityFeed } from '../../../activity-feed/hooks/useActivityFeed';
import { ActivityCard } from '../../../activity-feed/components/ActivityCard';

export function RecentActivityWidget(_props: import('../../types').WidgetProps) {
  const { data, isLoading } = useUnifiedActivityFeed();

  // Get first 5 activities
  const recentActivities = data?.pages[0]?.items.slice(0, 5) || [];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-ink-bright flex items-center gap-2">
          <Lightning className="w-5 h-5 text-accent-copper" />
          Recent Activity
        </h3>
        <Link to="/app/activity" className="text-sm text-accent-copper hover:underline">
          View all
        </Link>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-ink-base rounded-lg animate-pulse" />
            ))}
          </div>
        ) : recentActivities.length === 0 ? (
          <div className="text-center py-8 text-ink-muted">
            <Lightning className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No recent activity</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="text-sm">
                <ActivityCard activity={activity} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
