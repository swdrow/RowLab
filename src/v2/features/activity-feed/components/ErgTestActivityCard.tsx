// src/v2/features/activity-feed/components/ErgTestActivityCard.tsx
// Typed activity card for erg test results

import { motion } from 'framer-motion';
import { formatDistance } from 'date-fns';
import { Timer, Trophy } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';
import type { ErgTestActivity } from '../../../types/activity';

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

/**
 * Format split time (time per 500m)
 */
function formatSplit(seconds: number, distance: number): string {
  const splitTime = (seconds / distance) * 500;
  return formatErgTime(splitTime);
}

// ============================================
// COMPONENT
// ============================================

interface ErgTestActivityCardProps {
  activity: ErgTestActivity;
}

export function ErgTestActivityCard({ activity }: ErgTestActivityCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate('/app/erg-tests');
  };

  const { testType, time, distance, watts, personalBest } = activity.metadata;

  return (
    <motion.div
      onClick={handleClick}
      whileHover={{ y: -1 }}
      className="bg-surface-elevated/80 backdrop-blur-sm rounded-lg border border-bdr-default p-4 hover:border-accent-primary/30 transition-all duration-200 cursor-pointer group group-hover:scale-[1.01]"
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="w-10 h-10 rounded-full bg-data-good/10 flex items-center justify-center shrink-0">
          <Timer className="w-5 h-5 text-data-good" weight="duotone" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <h3 className="font-semibold text-txt-primary truncate">
            {testType ? `${testType} Erg Test` : 'Erg Test'}
          </h3>

          {/* Athlete name */}
          {activity.athleteName && (
            <p className="text-sm text-txt-secondary">{activity.athleteName}</p>
          )}

          {/* Metadata: Time + Split */}
          <div className="flex items-center gap-3 mt-1 text-sm text-txt-muted">
            <span>Time: {formatErgTime(time)}</span>
            {distance > 0 && <span>Split: {formatSplit(time, distance)}/500m</span>}
            {watts && <span>{Math.round(watts)}W</span>}
          </div>

          {/* Timestamp */}
          <p className="text-xs text-txt-subtle mt-1">
            {formatDistance(new Date(activity.date), new Date(), {
              addSuffix: true,
            })}
          </p>
        </div>

        {/* PR Badge */}
        {personalBest && (
          <div className="shrink-0 flex items-center gap-1 px-2 py-1 rounded-md bg-data-warning/10 text-data-warning border border-data-warning/20">
            <Trophy className="w-4 h-4" weight="fill" />
            <span className="text-xs font-semibold">PR!</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
