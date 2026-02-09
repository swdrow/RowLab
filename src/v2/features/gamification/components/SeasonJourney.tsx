import { Trophy, Award, Flag, Target, Medal, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import type {
  SeasonJourney as SeasonJourneyType,
  JourneyMilestone,
} from '../../../types/gamification';

interface SeasonJourneyProps {
  journey: SeasonJourneyType;
}

/**
 * Get icon for milestone type
 */
function getMilestoneIcon(type: JourneyMilestone['type']) {
  const icons = {
    pr: Trophy,
    achievement: Award,
    'challenge-win': Flag,
    streak: Target,
    race: Medal,
  };
  return icons[type] || Calendar;
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
 * Season journey timeline component
 * Per CONTEXT.md: "Story format: Narrative-style 'your season in review' with highlights"
 */
export function SeasonJourney({ journey }: SeasonJourneyProps) {
  const {
    seasonName,
    startDate,
    endDate,
    totalMeters,
    totalWorkouts,
    prsAchieved,
    achievementsEarned,
    challengesWon,
    milestones,
    narrative,
  } = journey;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-txt-primary">{seasonName}</h2>
        <p className="text-sm text-txt-secondary mt-1">
          {new Date(startDate).toLocaleDateString()} - {new Date(endDate).toLocaleDateString()}
        </p>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <StatCard
          label="Total Meters"
          value={formatNumber(totalMeters)}
          icon={<Target size={20} />}
        />
        <StatCard label="Workouts" value={totalWorkouts.toString()} icon={<Calendar size={20} />} />
        <StatCard label="PRs" value={prsAchieved.toString()} icon={<Trophy size={20} />} />
        <StatCard
          label="Achievements"
          value={achievementsEarned.toString()}
          icon={<Award size={20} />}
        />
        <StatCard
          label="Challenges Won"
          value={challengesWon.toString()}
          icon={<Flag size={20} />}
        />
      </div>

      {/* Narrative (if available) */}
      {narrative && (
        <div className="p-4 bg-surface-elevated rounded-lg border border-bdr-default">
          <p className="text-txt-primary leading-relaxed">{narrative}</p>
        </div>
      )}

      {/* Timeline */}
      {milestones.length > 0 && (
        <div className="relative">
          <h3 className="font-semibold text-txt-primary mb-4">Season Highlights</h3>

          {/* Timeline line */}
          <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-bdr-default" />

          {/* Milestones */}
          <div className="space-y-4">
            {milestones.map((milestone, index) => (
              <MilestoneCard key={index} milestone={milestone} index={index} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Stat card for summary
 */
function StatCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="p-4 bg-surface rounded-lg border border-bdr-default text-center">
      <div className="text-txt-secondary mb-1">{icon}</div>
      <p className="text-2xl font-bold text-txt-primary">{value}</p>
      <p className="text-xs text-txt-secondary">{label}</p>
    </div>
  );
}

/**
 * Individual milestone card
 */
function MilestoneCard({ milestone, index }: { milestone: JourneyMilestone; index: number }) {
  const Icon = getMilestoneIcon(milestone.type);

  const typeColors = {
    pr: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-accent-primary',
    achievement: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    'challenge-win': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    streak: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    race: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="flex gap-4 items-start ml-2"
    >
      {/* Icon dot */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${typeColors[milestone.type]}`}
      >
        <Icon size={16} />
      </div>

      {/* Content */}
      <div className="flex-1 pb-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-txt-primary">{milestone.title}</h4>
          <span className="text-xs text-txt-tertiary">
            {new Date(milestone.date).toLocaleDateString()}
          </span>
        </div>
        <p className="text-sm text-txt-secondary mt-0.5">{milestone.description}</p>
      </div>
    </motion.div>
  );
}

export default SeasonJourney;
