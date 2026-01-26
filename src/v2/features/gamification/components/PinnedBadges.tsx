import { usePinnedAchievements } from '../../../hooks/useAchievements';
import { AchievementBadge } from './AchievementBadge';
import { Skeleton } from '../../../components/ui/Skeleton';

interface PinnedBadgesProps {
  athleteId: string;
  maxDisplay?: number;
}

/**
 * Display pinned achievement badges on athlete profiles
 * Shows max 3-5 badges (default 5)
 */
export function PinnedBadges({ athleteId, maxDisplay = 5 }: PinnedBadgesProps) {
  const { data: pinned, isLoading } = usePinnedAchievements(athleteId);

  if (isLoading) {
    return (
      <div className="flex gap-2">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="w-10 h-10 rounded-full" />
        ))}
      </div>
    );
  }

  if (!pinned || pinned.length === 0) {
    return null;
  }

  const displayedBadges = pinned.slice(0, maxDisplay);

  return (
    <div className="flex items-center gap-2">
      {displayedBadges.map((achievement) => (
        <AchievementBadge
          key={achievement.id}
          name={achievement.name}
          rarity={achievement.rarity}
          icon={achievement.icon}
          isUnlocked={true}
          size="sm"
        />
      ))}
      {pinned.length > maxDisplay && (
        <span className="text-xs text-txt-tertiary">
          +{pinned.length - maxDisplay} more
        </span>
      )}
    </div>
  );
}

export default PinnedBadges;
