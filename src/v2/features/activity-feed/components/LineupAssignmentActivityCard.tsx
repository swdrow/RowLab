// src/v2/features/activity-feed/components/LineupAssignmentActivityCard.tsx
// Typed activity card for lineup assignments

import { motion } from 'framer-motion';
import { formatDistance } from 'date-fns';
import { Users, Anchor } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';
import type { LineupAssignmentActivity } from '../../../types/activity';

// ============================================
// COMPONENT
// ============================================

interface LineupAssignmentActivityCardProps {
  activity: LineupAssignmentActivity;
}

export function LineupAssignmentActivityCard({ activity }: LineupAssignmentActivityCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate('/app/lineup-builder');
  };

  const { lineupName, boatClass, seatNumber } = activity.metadata;

  return (
    <motion.div
      onClick={handleClick}
      whileHover={{ y: -1 }}
      className="bg-surface-elevated/80 backdrop-blur-sm rounded-lg border border-bdr-default p-4 hover:border-accent-primary/30 transition-all duration-200 cursor-pointer group group-hover:scale-[1.01]"
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="w-10 h-10 rounded-full bg-cyan-400/10 flex items-center justify-center shrink-0">
          <Users className="w-5 h-5 text-cyan-400" weight="duotone" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <h3 className="font-semibold text-txt-primary truncate">
            {lineupName || 'Lineup Assignment'}
          </h3>

          {/* Athlete name */}
          {activity.athleteName && (
            <p className="text-sm text-txt-secondary">{activity.athleteName}</p>
          )}

          {/* Metadata: Boat Class + Seat */}
          <div className="flex items-center gap-3 mt-1 text-sm text-txt-muted">
            {boatClass && <span>{boatClass}</span>}
            {seatNumber !== undefined && (
              <span className="flex items-center gap-1">
                <Anchor className="w-4 h-4" weight="duotone" />
                Seat {seatNumber}
              </span>
            )}
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
