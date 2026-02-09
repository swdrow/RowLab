// src/v2/features/activity-feed/components/ActivityCard.tsx
// Activity card dispatcher - routes to typed card components based on activity.type

import { motion } from 'framer-motion';
import { formatDistance } from 'date-fns';
import { Question } from '@phosphor-icons/react';
import type { AnyActivity, ActivityType } from '../../../types/activity';
import { ACTIVITY_TYPE_LABELS } from '../../../types/activity';

// Import typed card components
import { ErgTestActivityCard } from './ErgTestActivityCard';
import { SessionActivityCard } from './SessionActivityCard';
import { RaceResultActivityCard } from './RaceResultActivityCard';
import { AttendanceActivityCard } from './AttendanceActivityCard';
import { SeatRaceActivityCard } from './SeatRaceActivityCard';
import { LineupAssignmentActivityCard } from './LineupAssignmentActivityCard';

// ============================================
// TYPE-TO-COMPONENT MAP
// ============================================

const TYPE_CARD_MAP: Record<ActivityType, React.ComponentType<{ activity: any }>> = {
  erg_test: ErgTestActivityCard,
  session_participation: SessionActivityCard,
  race_result: RaceResultActivityCard,
  attendance: AttendanceActivityCard,
  seat_race: SeatRaceActivityCard,
  lineup_assignment: LineupAssignmentActivityCard,
};

// ============================================
// GENERIC FALLBACK CARD
// ============================================

/**
 * Generic fallback for unknown activity types
 */
function GenericActivityCard({ activity }: { activity: AnyActivity }) {
  return (
    <motion.div
      whileHover={{ y: -1 }}
      className="bg-surface-elevated/80 backdrop-blur-sm rounded-lg border border-bdr-default p-4 hover:border-accent-primary/30 transition-all duration-200 cursor-pointer"
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="w-10 h-10 rounded-full bg-gray-400/10 flex items-center justify-center shrink-0">
          <Question className="w-5 h-5 text-gray-400" weight="duotone" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <h3 className="font-semibold text-txt-primary truncate">{activity.title}</h3>

          {/* Athlete name */}
          {activity.athleteName && (
            <p className="text-sm text-txt-secondary">{activity.athleteName}</p>
          )}

          {/* Description */}
          {activity.description && (
            <p className="text-sm text-txt-muted mt-1">{activity.description}</p>
          )}

          {/* Type badge */}
          <div className="mt-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-400/10 text-gray-400">
              {ACTIVITY_TYPE_LABELS[activity.type] || 'Activity'}
            </span>
          </div>

          {/* Timestamp */}
          <p className="text-xs text-txt-subtle mt-1">
            {formatDistance(new Date(activity.date), new Date(), {
              addSuffix: true,
            })}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================
// DISPATCHER COMPONENT
// ============================================

interface ActivityCardProps {
  activity: AnyActivity;
}

/**
 * Activity card dispatcher - routes to typed card component based on activity.type
 * Falls back to GenericActivityCard for unknown types (no crashes)
 */
export function ActivityCard({ activity }: ActivityCardProps) {
  const CardComponent = TYPE_CARD_MAP[activity.type];

  // If we have a typed card for this activity type, use it
  if (CardComponent) {
    return <CardComponent activity={activity} />;
  }

  // Otherwise, fall back to generic card
  return <GenericActivityCard activity={activity} />;
}
