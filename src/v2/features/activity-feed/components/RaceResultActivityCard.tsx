// src/v2/features/activity-feed/components/RaceResultActivityCard.tsx
// Typed activity card for race results

import { motion } from 'framer-motion';
import { formatDistance } from 'date-fns';
import { Trophy } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';
import type { RaceResultActivity } from '../../../types/activity';

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get medal emoji for top 3 finishes
 */
function getMedal(place: number): string | null {
  if (place === 1) return '🥇';
  if (place === 2) return '🥈';
  if (place === 3) return '🥉';
  return null;
}

/**
 * Format place with ordinal suffix
 */
function formatPlace(place: number): string {
  const suffix = ['th', 'st', 'nd', 'rd'];
  const value = place % 100;
  return place + (suffix[(value - 20) % 10] || suffix[value] || suffix[0]);
}

/**
 * Format time from seconds to mm:ss format
 */
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// ============================================
// COMPONENT
// ============================================

interface RaceResultActivityCardProps {
  activity: RaceResultActivity;
}

export function RaceResultActivityCard({ activity }: RaceResultActivityCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    // Navigate to regatta detail if available (future implementation)
    // For now, navigate to regattas list
    navigate('/app/regattas');
  };

  const { regattaName, eventName, boatClass, place, time, margin } = activity.metadata;

  const medal = getMedal(place);

  return (
    <motion.div
      onClick={handleClick}
      whileHover={{ y: -1 }}
      className="bg-surface-elevated/80 backdrop-blur-sm rounded-lg border border-bdr-default p-4 hover:border-accent-primary/30 transition-all duration-200 cursor-pointer group group-hover:scale-[1.01]"
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="w-10 h-10 rounded-full bg-amber-400/10 flex items-center justify-center shrink-0">
          <Trophy className="w-5 h-5 text-amber-400" weight="duotone" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <h3 className="font-semibold text-txt-primary truncate">
            {regattaName || 'Race Result'}
          </h3>

          {/* Athlete name */}
          {activity.athleteName && (
            <p className="text-sm text-txt-secondary">{activity.athleteName}</p>
          )}

          {/* Metadata: Event + Boat Class */}
          <div className="flex items-center gap-3 mt-1 text-sm text-txt-muted">
            {eventName && <span>{eventName}</span>}
            {boatClass && <span>{boatClass}</span>}
          </div>

          {/* Results: Place + Time + Margin */}
          <div className="flex items-center gap-3 mt-1 text-sm text-txt-secondary">
            <span className="font-medium">{formatPlace(place)}</span>
            {time && <span>{formatTime(time)}</span>}
            {margin && <span>{margin}</span>}
          </div>

          {/* Timestamp */}
          <p className="text-xs text-txt-subtle mt-1">
            {formatDistance(new Date(activity.date), new Date(), {
              addSuffix: true,
            })}
          </p>
        </div>

        {/* Medal Badge */}
        {medal && (
          <div className="shrink-0 text-2xl" aria-label={`${formatPlace(place)} place`}>
            {medal}
          </div>
        )}
      </div>
    </motion.div>
  );
}
