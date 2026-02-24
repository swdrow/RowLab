/**
 * Achievements tab content for the profile page.
 * Shows a trophy case with unlocked achievements prominent and locked dimmed below.
 * Unlocked sorted by rarity (descending), locked sorted by progress ratio (descending).
 */

import { useQuery } from '@tanstack/react-query';
import { motion } from 'motion/react';
import { IconTrophy, IconLock } from '@/components/icons';

import { FancySectionHeader } from '@/components/ui/FancySectionHeader';
import { profileAchievementsQueryOptions } from '../api';
import { AchievementCard } from './AchievementCard';
import { Card } from '@/components/ui/Card';
import { Skeleton, SkeletonGroup } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { slideUp } from '@/lib/animations';
import type { Achievement } from '../types';

/** Rarity sort order (higher = more prominent) */
const RARITY_ORDER: Record<Achievement['rarity'], number> = {
  Legendary: 4,
  Epic: 3,
  Rare: 2,
  Common: 1,
};

export function AchievementsTab() {
  const { data, isLoading } = useQuery(profileAchievementsQueryOptions());

  if (isLoading) {
    return <AchievementsTabSkeleton />;
  }

  const achievements = data?.achievements ?? [];
  const summary = data?.summary ?? { total: 0, unlocked: 0 };

  if (achievements.length === 0) {
    return (
      <EmptyState
        icon={IconTrophy}
        title="No achievements yet"
        description="Start training to unlock achievements and build your trophy case."
        className="py-16"
      />
    );
  }

  const unlocked = achievements
    .filter((a) => a.unlocked)
    .sort((a, b) => (RARITY_ORDER[b.rarity] ?? 0) - (RARITY_ORDER[a.rarity] ?? 0));

  const locked = achievements
    .filter((a) => !a.unlocked)
    .sort((a, b) => {
      const ratioA = a.target > 0 ? a.progress / a.target : 0;
      const ratioB = b.target > 0 ? b.progress / b.target : 0;
      return ratioB - ratioA;
    });

  return (
    <motion.div className="space-y-6" {...slideUp}>
      {/* Summary header */}
      <Card padding="sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <IconTrophy width={18} height={18} className="text-accent-teal" />
            <span className="text-text-bright font-semibold">
              {summary.unlocked} / {summary.total}
            </span>
            <span className="text-text-dim text-sm">Achievements Unlocked</span>
          </div>
          <div className="text-text-faint text-xs">
            {Math.round((summary.unlocked / Math.max(summary.total, 1)) * 100)}% complete
          </div>
        </div>
      </Card>

      {/* Unlocked section */}
      {unlocked.length > 0 && (
        <section>
          <FancySectionHeader
            label="Unlocked"
            icon={IconTrophy}
            accentColor="teal"
            className="mb-3"
          />
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-3"
          >
            {unlocked.map((achievement) => (
              <AchievementCard key={achievement.id} achievement={achievement} />
            ))}
          </motion.div>
        </section>
      )}

      {/* Locked section */}
      {locked.length > 0 && (
        <section>
          <FancySectionHeader label="Locked" icon={IconLock} accentColor="sand" className="mb-3" />
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-2"
          >
            {locked.map((achievement) => (
              <AchievementCard key={achievement.id} achievement={achievement} compact />
            ))}
          </motion.div>
        </section>
      )}
    </motion.div>
  );
}

function AchievementsTabSkeleton() {
  return (
    <div className="space-y-6">
      <div className="panel rounded-xl p-3">
        <Skeleton height="1.5rem" width="240px" />
      </div>
      <SkeletonGroup>
        <Skeleton height="0.75rem" width="80px" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} height="5rem" className="rounded-xl" />
          ))}
        </div>
      </SkeletonGroup>
      <SkeletonGroup>
        <Skeleton height="0.75rem" width="60px" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} height="4rem" className="rounded-xl" />
          ))}
        </div>
      </SkeletonGroup>
    </div>
  );
}
