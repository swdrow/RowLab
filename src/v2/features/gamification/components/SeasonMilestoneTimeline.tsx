import { Trophy, Award, Flag, Target, Medal, Calendar, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSeasonMilestones } from '../../../hooks/useSeasonMilestones';
import type { JourneyMilestone } from '../../../types/gamification';

interface SeasonMilestoneTimelineProps {
  /** Compact mode for dashboard widget */
  compact?: boolean;
  /** Optional date range filters */
  startDate?: string;
  endDate?: string;
}

/**
 * Get icon for milestone type
 */
function getMilestoneIcon(type: string) {
  const icons = {
    pr: Trophy,
    'first-test': Calendar,
    'first-regatta': Flag,
    'challenge-complete': Target,
    'practice-milestone': Award,
    race: Medal,
  };
  return icons[type as keyof typeof icons] || TrendingUp;
}

/**
 * Get color classes for milestone type
 */
function getMilestoneColors(type: string) {
  const colors = {
    pr: 'bg-accent-primary/10 text-accent-primary border-accent-primary/30',
    'first-test': 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    'first-regatta': 'bg-green-500/10 text-green-400 border-green-500/30',
    'challenge-complete': 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    'practice-milestone': 'bg-orange-500/10 text-orange-400 border-orange-500/30',
    race: 'bg-pink-500/10 text-pink-400 border-pink-500/30',
  };
  return (
    colors[type as keyof typeof colors] ||
    'bg-surface-elevated text-txt-secondary border-bdr-default'
  );
}

/**
 * Format large numbers
 */
function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toLocaleString();
}

/**
 * Season milestone timeline component
 * Per GM-03: Displays key season events in chronological order
 */
export function SeasonMilestoneTimeline({
  compact = false,
  startDate,
  endDate,
}: SeasonMilestoneTimelineProps) {
  const { milestones, stats, isLoading } = useSeasonMilestones(startDate, endDate);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(compact ? 3 : 5)].map((_, i) => (
          <div key={i} className="flex gap-3 animate-pulse">
            <div className="w-8 h-8 rounded-full bg-surface-elevated" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-surface-elevated rounded w-1/3" />
              <div className="h-3 bg-surface-elevated rounded w-2/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (milestones.length === 0) {
    return (
      <div className="text-center py-8">
        <Calendar className="w-12 h-12 text-txt-tertiary mx-auto mb-3" />
        <p className="text-txt-secondary">No milestones yet this season</p>
        <p className="text-sm text-txt-tertiary mt-1">
          Complete workouts and challenges to see your progress
        </p>
      </div>
    );
  }

  const displayMilestones = compact ? milestones.slice(0, 5) : milestones;

  return (
    <div className="space-y-4">
      {/* Stats summary (non-compact mode only) */}
      {!compact && stats && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
          <StatCard label="Total Meters" value={formatNumber(stats.totalMeters)} />
          <StatCard label="Sessions" value={stats.totalSessions.toString()} />
          <StatCard label="PRs" value={stats.totalPRs.toString()} />
          <StatCard label="Achievements" value={stats.totalAchievements.toString()} />
          <StatCard label="Challenges" value={stats.totalChallenges.toString()} />
        </div>
      )}

      {/* Timeline */}
      <div className="relative">
        {/* Timeline line */}
        {!compact && <div className="absolute left-4 top-2 bottom-2 w-px bg-bdr-default" />}

        {/* Milestones */}
        <div className={compact ? 'space-y-2' : 'space-y-4'}>
          {displayMilestones.map((milestone, index) => (
            <MilestoneCard key={index} milestone={milestone} index={index} compact={compact} />
          ))}
        </div>
      </div>

      {/* Show more indicator */}
      {compact && milestones.length > 5 && (
        <div className="text-center pt-2">
          <p className="text-xs text-txt-tertiary">
            +{milestones.length - 5} more milestone{milestones.length - 5 !== 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Stat card for summary
 */
function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 bg-surface rounded-lg border border-bdr-default text-center">
      <p className="text-xl font-bold text-txt-primary">{value}</p>
      <p className="text-xs text-txt-secondary mt-0.5">{label}</p>
    </div>
  );
}

/**
 * Individual milestone card
 */
function MilestoneCard({
  milestone,
  index,
  compact,
}: {
  milestone: JourneyMilestone;
  index: number;
  compact?: boolean;
}) {
  const Icon = getMilestoneIcon(milestone.type);
  const colorClasses = getMilestoneColors(milestone.type);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: compact ? 0 : index * 0.05 }}
      className="flex gap-3 items-start"
    >
      {/* Icon dot */}
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border ${colorClasses}`}
      >
        <Icon size={16} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h4 className={`font-medium text-txt-primary ${compact ? 'text-sm' : ''}`}>
            {milestone.title}
          </h4>
          <span className="text-xs text-txt-tertiary whitespace-nowrap">
            {new Date(milestone.date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}
          </span>
        </div>
        <p className={`text-txt-secondary mt-0.5 ${compact ? 'text-xs' : 'text-sm'}`}>
          {milestone.description}
        </p>
      </div>
    </motion.div>
  );
}

export default SeasonMilestoneTimeline;
