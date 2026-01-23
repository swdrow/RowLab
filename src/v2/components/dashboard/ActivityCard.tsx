import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { DeduplicatedActivity, ActivitySource } from '../../types/dashboard';
import { formatDuration, formatDistance, getActivityTypeName } from '../../hooks/useActivityFeed';

interface ActivityCardProps {
  activity: DeduplicatedActivity;
}

/**
 * Source badge colors
 */
const SOURCE_STYLES: Record<ActivitySource, { bg: string; text: string; label: string }> = {
  CONCEPT2: {
    bg: 'bg-blue-600/20',
    text: 'text-blue-400',
    label: 'C2',
  },
  STRAVA: {
    bg: 'bg-orange-600/20',
    text: 'text-orange-400',
    label: 'Strava',
  },
  MANUAL: {
    bg: 'bg-gray-600/20',
    text: 'text-gray-400',
    label: 'Manual',
  },
};

/**
 * Format date to relative or absolute string
 */
function formatActivityDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

/**
 * ActivityCard - Individual activity with expand/collapse
 *
 * Core metrics visible by default: distance, time, date
 * Expanded view shows: pace, HR, stroke rate, other details
 */
export function ActivityCard({ activity }: ActivityCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const sourceStyle = SOURCE_STYLES[activity.source];
  const distance = activity.data?.distanceM || activity.data?.distance;
  const duration = activity.data?.durationSeconds;

  return (
    <div
      className="
        rounded-lg bg-card-bg p-4 border border-card-border
        hover:bg-card-hover transition-colors
        cursor-pointer
      "
      onClick={() => setIsExpanded(!isExpanded)}
    >
      {/* Header row */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {/* Source badge */}
          <span
            className={`
              shrink-0 px-2 py-0.5 rounded text-xs font-medium
              ${sourceStyle.bg} ${sourceStyle.text}
            `}
          >
            {sourceStyle.label}
          </span>

          {/* Activity title */}
          <div className="min-w-0">
            <h4 className="text-text-primary font-medium truncate">
              {activity.title || getActivityTypeName(activity.activityType)}
            </h4>
            <p className="text-text-secondary text-sm">
              {formatActivityDate(activity.date)}
            </p>
          </div>
        </div>

        {/* Core metrics (always visible) */}
        <div className="flex items-center gap-4 text-sm">
          {distance && (
            <span className="text-text-primary font-medium">
              {formatDistance(distance)}
            </span>
          )}
          {duration && (
            <span className="text-text-secondary">
              {formatDuration(duration)}
            </span>
          )}

          {/* Expand indicator */}
          <svg
            className={`
              w-5 h-5 text-text-secondary transition-transform
              ${isExpanded ? 'rotate-180' : ''}
            `}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>

      {/* Duplicate indicator */}
      {activity.duplicates && activity.duplicates.length > 0 && (
        <div className="mt-2 text-xs text-text-secondary">
          Also tracked on:{' '}
          {activity.duplicates.map(d => SOURCE_STYLES[d.source].label).join(', ')}
        </div>
      )}

      {/* Expanded details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-4 pt-4 border-t border-border-default">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                {/* Pace / Split */}
                {activity.data?.splitSeconds && (
                  <div>
                    <dt className="text-text-secondary">Pace</dt>
                    <dd className="text-text-primary font-medium">
                      {formatDuration(activity.data.splitSeconds)}/500m
                    </dd>
                  </div>
                )}

                {/* Heart Rate */}
                {activity.data?.avgHeartRate && (
                  <div>
                    <dt className="text-text-secondary">Avg HR</dt>
                    <dd className="text-text-primary font-medium">
                      {activity.data.avgHeartRate} bpm
                    </dd>
                  </div>
                )}

                {/* Stroke Rate */}
                {activity.data?.strokeRate && (
                  <div>
                    <dt className="text-text-secondary">Stroke Rate</dt>
                    <dd className="text-text-primary font-medium">
                      {activity.data.strokeRate} spm
                    </dd>
                  </div>
                )}

                {/* Watts */}
                {activity.data?.watts && (
                  <div>
                    <dt className="text-text-secondary">Power</dt>
                    <dd className="text-text-primary font-medium">
                      {activity.data.watts}W
                    </dd>
                  </div>
                )}

                {/* Calories */}
                {activity.data?.calories && (
                  <div>
                    <dt className="text-text-secondary">Calories</dt>
                    <dd className="text-text-primary font-medium">
                      {activity.data.calories} kcal
                    </dd>
                  </div>
                )}

                {/* Drag Factor */}
                {activity.data?.dragFactor && (
                  <div>
                    <dt className="text-text-secondary">Drag</dt>
                    <dd className="text-text-primary font-medium">
                      {activity.data.dragFactor}
                    </dd>
                  </div>
                )}
              </div>

              {/* Description */}
              {activity.description && (
                <p className="mt-4 text-text-secondary text-sm">
                  {activity.description}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
