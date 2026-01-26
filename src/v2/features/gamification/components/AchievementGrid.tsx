import { useState } from 'react';
import { useAchievements, useTogglePin } from '../../../hooks/useAchievements';
import { AchievementCard } from './AchievementCard';
import { Skeleton } from '../../../components/ui/Skeleton';
import type { AchievementCategory } from '../../../types/gamification';

interface AchievementGridProps {
  athleteId?: string;
  category?: AchievementCategory | 'all';
  showLocked?: boolean;
}

/**
 * Filterable grid of achievements with sorting
 * - Unlocked achievements shown first
 * - Sorted by rarity (Legendary -> Common)
 * - Category filter tabs
 */
export function AchievementGrid({
  athleteId,
  category = 'all',
  showLocked = true,
}: AchievementGridProps) {
  const { achievements, isLoading, unlockedCount, totalCount } = useAchievements();
  const togglePin = useTogglePin();
  const [filter, setFilter] = useState<AchievementCategory | 'all'>(category);

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-40 rounded-lg" />
        ))}
      </div>
    );
  }

  const filteredAchievements = achievements.filter((a) => {
    if (!showLocked && !a.isUnlocked) return false;
    if (filter !== 'all' && a.category !== filter) return false;
    return true;
  });

  // Sort: unlocked first, then by rarity (Legendary first)
  const rarityOrder = { Legendary: 0, Epic: 1, Rare: 2, Common: 3 };
  const sortedAchievements = [...filteredAchievements].sort((a, b) => {
    if (a.isUnlocked !== b.isUnlocked) {
      return a.isUnlocked ? -1 : 1;
    }
    return rarityOrder[a.rarity] - rarityOrder[b.rarity];
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-txt-secondary">
          {unlockedCount} of {totalCount} unlocked
        </p>

        <div className="flex gap-1">
          {(['all', 'Erg', 'Attendance', 'Racing'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`
                px-3 py-1 text-sm rounded-full transition-colors
                ${filter === cat
                  ? 'bg-primary text-white'
                  : 'bg-surface-hover text-txt-secondary hover:text-txt-primary'
                }
              `}
            >
              {cat === 'all' ? 'All' : cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sortedAchievements.map((achievement) => (
          <AchievementCard
            key={achievement.id}
            achievement={achievement}
            onTogglePin={(id) => togglePin.mutate(id)}
            isPinning={togglePin.isPending}
          />
        ))}
      </div>

      {sortedAchievements.length === 0 && (
        <div className="text-center py-8 text-txt-secondary">
          No achievements found
        </div>
      )}
    </div>
  );
}

export default AchievementGrid;
