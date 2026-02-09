// src/v2/features/activity-feed/components/SessionActivityCard.tsx
// Typed activity card for training session participation

import { motion } from 'framer-motion';
import { formatDistance } from 'date-fns';
import { Barbell, CheckCircle } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';
import type { SessionParticipationActivity } from '../../../types/activity';

// ============================================
// COMPONENT
// ============================================

interface SessionActivityCardProps {
  activity: SessionParticipationActivity;
}

export function SessionActivityCard({ activity }: SessionActivityCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    const { sessionId } = activity.metadata;
    if (sessionId) {
      navigate(`/app/training/sessions/${sessionId}`);
    } else {
      navigate('/app/training');
    }
  };

  const { sessionName, sessionType, participationPercent } = activity.metadata;

  return (
    <motion.div
      onClick={handleClick}
      whileHover={{ y: -1 }}
      className="bg-surface-elevated/80 backdrop-blur-sm rounded-lg border border-bdr-default p-4 hover:border-accent-primary/30 transition-all duration-200 cursor-pointer group group-hover:scale-[1.01]"
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="w-10 h-10 rounded-full bg-emerald-400/10 flex items-center justify-center shrink-0">
          <Barbell className="w-5 h-5 text-emerald-400" weight="duotone" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <h3 className="font-semibold text-txt-primary truncate">
            {sessionName || 'Training Session'}
          </h3>

          {/* Athlete name */}
          {activity.athleteName && (
            <p className="text-sm text-txt-secondary">{activity.athleteName}</p>
          )}

          {/* Metadata: Session Type + Participation */}
          <div className="flex items-center gap-3 mt-1 text-sm text-txt-muted">
            {sessionType && <span>{sessionType}</span>}
            {participationPercent !== undefined && (
              <span className="flex items-center gap-1">
                <CheckCircle className="w-4 h-4 text-emerald-400" weight="fill" />
                {Math.round(participationPercent)}% complete
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
