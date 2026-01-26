// src/v2/features/activity-feed/components/ActivityCard.tsx
// Activity card component with type-specific styling and content

import { formatDistance } from 'date-fns';
import {
  Timer,
  Users,
  Trophy,
  Check,
  ArrowsLeftRight,
  Barbell,
} from '@phosphor-icons/react';
import type { AnyActivity, ActivityType } from '../../../types/activity';
import {
  ACTIVITY_TYPE_COLORS,
  ACTIVITY_TYPE_LABELS,
} from '../../../types/activity';

// ============================================
// ICONS MAP
// ============================================

const TYPE_ICONS: Record<ActivityType, React.ElementType> = {
  erg_test: Timer,
  session_participation: Barbell,
  race_result: Trophy,
  attendance: Check,
  seat_race: ArrowsLeftRight,
  lineup_assignment: Users,
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Format erg time from seconds to mm:ss.t format
 */
function formatErgTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const tenths = Math.floor((seconds % 1) * 10);
  return `${mins}:${secs.toString().padStart(2, '0')}.${tenths}`;
}

// ============================================
// COMPONENT
// ============================================

interface ActivityCardProps {
  activity: AnyActivity;
}

export function ActivityCard({ activity }: ActivityCardProps) {
  const Icon = TYPE_ICONS[activity.type];

  return (
    <div className="bg-surface-elevated rounded-lg border border-bdr-default p-4 hover:border-bdr-focus transition-colors">
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${ACTIVITY_TYPE_COLORS[activity.type]}`}
        >
          <Icon className="w-5 h-5" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium text-txt-primary truncate">
              {activity.title}
            </span>
            <span className="text-xs text-txt-muted whitespace-nowrap">
              {formatDistance(new Date(activity.date), new Date(), {
                addSuffix: true,
              })}
            </span>
          </div>

          {/* Athlete name */}
          {activity.athleteName && (
            <p className="text-sm text-txt-secondary">{activity.athleteName}</p>
          )}

          {/* Description */}
          {activity.description && (
            <p className="text-sm text-txt-muted mt-1">{activity.description}</p>
          )}

          {/* Type-specific details */}
          {activity.type === 'erg_test' && (
            <div className="flex items-center gap-4 mt-2 text-sm text-txt-secondary">
              <span>
                Time: {formatErgTime(activity.metadata.time as number)}
              </span>
              {activity.metadata.watts && (
                <span>{activity.metadata.watts}W</span>
              )}
              {activity.metadata.personalBest && (
                <span className="text-green-500 font-medium">PB!</span>
              )}
            </div>
          )}

          {activity.type === 'race_result' && (
            <div className="flex items-center gap-4 mt-2 text-sm text-txt-secondary">
              <span>Place: #{activity.metadata.place}</span>
              <span>{activity.metadata.boatClass}</span>
            </div>
          )}

          {activity.type === 'session_participation' && (
            <div className="flex items-center gap-4 mt-2 text-sm text-txt-secondary">
              <span>{activity.metadata.sessionType}</span>
              <span>
                {Math.round(activity.metadata.participationPercent as number)}%
                participation
              </span>
            </div>
          )}

          {activity.type === 'seat_race' && activity.metadata.ratingChange && (
            <div className="flex items-center gap-4 mt-2 text-sm text-txt-secondary">
              <span
                className={
                  (activity.metadata.ratingChange as number) > 0
                    ? 'text-green-500'
                    : 'text-red-500'
                }
              >
                Rating:{' '}
                {(activity.metadata.ratingChange as number) > 0 ? '+' : ''}
                {activity.metadata.ratingChange}
              </span>
              {activity.metadata.newRating && (
                <span>New: {activity.metadata.newRating}</span>
              )}
            </div>
          )}

          {activity.type === 'lineup_assignment' && (
            <div className="flex items-center gap-4 mt-2 text-sm text-txt-secondary">
              <span>{activity.metadata.lineupName}</span>
              <span>{activity.metadata.boatClass}</span>
              {activity.metadata.seatNumber && (
                <span>Seat {activity.metadata.seatNumber}</span>
              )}
            </div>
          )}

          {/* Type badge */}
          <div className="mt-2">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${ACTIVITY_TYPE_COLORS[activity.type]}`}
            >
              {ACTIVITY_TYPE_LABELS[activity.type]}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
