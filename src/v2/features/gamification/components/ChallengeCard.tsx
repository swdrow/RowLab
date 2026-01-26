import { Clock, Users, Trophy, Target, Flag } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import type { Challenge } from '../../../types/gamification';

interface ChallengeCardProps {
  challenge: Challenge;
  showLeaderboard?: boolean;
}

/**
 * Calculate time remaining
 */
function getTimeRemaining(endDate: string): string {
  const end = new Date(endDate);
  const now = new Date();
  const diff = end.getTime() - now.getTime();

  if (diff <= 0) return 'Ended';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (days > 0) return `${days}d ${hours}h left`;
  if (hours > 0) return `${hours}h left`;
  return 'Ending soon';
}

/**
 * Get status badge color
 */
function getStatusColor(status: string): string {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
    case 'completed':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
    case 'cancelled':
      return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
    default:
      return 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300';
  }
}

export function ChallengeCard({ challenge, showLeaderboard = false }: ChallengeCardProps) {
  const {
    id,
    name,
    description,
    type,
    status,
    startDate,
    endDate,
    metric,
    participantCount,
  } = challenge;

  const isActive = status === 'active';
  const timeRemaining = getTimeRemaining(endDate);

  return (
    <motion.div
      layout
      whileHover={{ scale: 1.01 }}
      className={`
        p-4 rounded-lg border bg-surface-elevated
        ${isActive ? 'border-green-500/50' : 'border-bdr'}
      `}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-txt-primary truncate">{name}</h3>
            <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(status)}`}>
              {status}
            </span>
          </div>

          {description && (
            <p className="text-sm text-txt-secondary line-clamp-2 mb-3">
              {description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3 text-xs text-txt-tertiary">
            <span className="flex items-center gap-1">
              {type === 'individual' ? <Trophy size={14} /> : <Target size={14} />}
              {type === 'individual' ? 'Individual' : 'Team Goal'}
            </span>

            <span className="flex items-center gap-1">
              <Flag size={14} />
              {metric}
            </span>

            <span className="flex items-center gap-1">
              <Users size={14} />
              {participantCount || 0} participants
            </span>

            {isActive && (
              <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                <Clock size={14} />
                {timeRemaining}
              </span>
            )}
          </div>
        </div>

        <Link
          to={`/beta/challenges/${id}`}
          className="px-3 py-1.5 text-sm font-medium text-primary hover:text-primary-dark transition-colors"
        >
          View
        </Link>
      </div>
    </motion.div>
  );
}

export default ChallengeCard;
