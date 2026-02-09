import { Calendar, Dumbbell, Trophy, Flag, Flame, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useStreaks, getStreakDisplayInfo } from '../../../hooks/useStreaks';
import type { Streak, StreakCategory } from '../../../types/gamification';

interface StreakCardProps {
  streak: Streak;
}

/**
 * Get icon component for streak category
 */
function getStreakIcon(category: StreakCategory) {
  const icons = {
    attendance: Calendar,
    workout: Dumbbell,
    pr: Trophy,
    challenge: Flag,
  };
  return icons[category] || Flame;
}

/**
 * Individual streak card
 */
export function StreakCard({ streak }: StreakCardProps) {
  const info = getStreakDisplayInfo(streak);
  const Icon = getStreakIcon(streak.category);

  const statusColors = {
    active: 'border-green-500 bg-green-50 dark:bg-green-950/30',
    'at-risk': 'border-amber-500 bg-amber-50 dark:bg-amber-950/30',
    broken: 'border-bdr-secondary bg-surface dark:border-bdr-secondary dark:bg-surface-elevated',
  };

  const numberColors = {
    active: 'text-green-600 dark:text-green-400',
    'at-risk': 'text-amber-600 dark:text-amber-400',
    broken: 'text-txt-tertiary',
  };

  return (
    <motion.div
      layout
      className={`
        p-4 rounded-lg border-2 transition-colors
        ${statusColors[info.status]}
      `}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`
            p-2 rounded-full
            ${info.status === 'active' ? 'bg-green-100 dark:bg-green-900/30' : ''}
            ${info.status === 'at-risk' ? 'bg-amber-100 dark:bg-amber-900/30' : ''}
            ${info.status === 'broken' ? 'bg-surface-elevated' : ''}
          `}
          >
            <Icon size={20} className={numberColors[info.status]} />
          </div>

          <div>
            <p className="font-medium text-txt-primary">{info.label}</p>
            {info.graceInfo && (
              <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <AlertTriangle size={12} />
                {info.graceInfo}
              </p>
            )}
          </div>
        </div>

        <div className="text-right">
          <p className={`text-3xl font-bold ${numberColors[info.status]}`}>{info.current}</p>
          <p className="text-xs text-txt-tertiary">Best: {info.longest}</p>
        </div>
      </div>
    </motion.div>
  );
}

interface StreakDisplayProps {
  athleteId?: string;
  compact?: boolean;
}

/**
 * Full streak display for profile or dashboard
 */
export function StreakDisplay({ athleteId, compact = false }: StreakDisplayProps) {
  const { data, isLoading } = useStreaks();

  if (isLoading) {
    return (
      <div className={`grid gap-3 ${compact ? 'grid-cols-3' : 'grid-cols-1 sm:grid-cols-3'}`}>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-20 bg-surface-elevated rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (!data || data.streaks.length === 0) {
    return <div className="text-center py-8 text-txt-secondary">No streak data available</div>;
  }

  return (
    <div className="space-y-4">
      {!compact && (
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-txt-primary">Your Streaks</h3>
          <span className="text-sm text-txt-secondary">{data.activeStreakCount} active</span>
        </div>
      )}

      <div className={`grid gap-3 ${compact ? 'grid-cols-3' : 'grid-cols-1 sm:grid-cols-3'}`}>
        {data.streaks.map((streak) => (
          <StreakCard key={streak.category} streak={streak} />
        ))}
      </div>
    </div>
  );
}

export default StreakDisplay;
