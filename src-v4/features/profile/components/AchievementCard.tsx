/**
 * Single achievement card with locked/unlocked variants.
 * Unlocked: full-color icon, name, description, rarity badge, date.
 * Locked: dimmed, grayscale, progress bar, requirements text.
 *
 * Rarity glow tiers (unlocked only):
 * - Legendary: animated pulse glow ring (amber)
 * - Epic: static copper glow ring
 * - Rare: subtle blue border ring
 * - Common: no extra styling
 */

import { IconTrophy, IconTarget, IconFlame, IconHash, IconSparkles } from '@/components/icons';
import type { IconComponent } from '@/types/icons';
import { Card } from '@/components/ui/Card';
import { formatRelativeDate } from '@/lib/format';
import type { Achievement } from '../types';

/** Category icon mapping */
const CATEGORY_ICONS: Record<Achievement['category'], IconComponent> = {
  distance: IconTarget,
  consistency: IconFlame,
  count: IconHash,
  variety: IconSparkles,
};

/** Rarity color mapping using design tokens */
const RARITY_COLORS: Record<Achievement['rarity'], { text: string; bg: string; border: string }> = {
  Common: {
    text: 'text-text-dim',
    bg: 'bg-text-dim/10',
    border: 'border-text-dim/20',
  },
  Rare: {
    text: 'text-accent-teal-primary',
    bg: 'bg-accent-teal-primary/10',
    border: 'border-accent-teal-primary/20',
  },
  Epic: {
    text: 'text-accent-teal',
    bg: 'bg-accent-teal/10',
    border: 'border-accent-teal/20',
  },
  Legendary: {
    text: 'text-data-warning',
    bg: 'bg-data-warning/10',
    border: 'border-data-warning/20',
  },
};

/** Rarity glow wrapper classes for unlocked cards */
const RARITY_GLOW: Record<Achievement['rarity'], string> = {
  Common: '',
  Rare: 'ring-1 ring-accent-teal/20',
  Epic: 'ring-1 ring-accent-teal/30 shadow-focus',
  Legendary: '', // Legendary uses a separate animated overlay
};

interface AchievementCardProps {
  achievement: Achievement;
  compact?: boolean;
}

export function AchievementCard({ achievement, compact = false }: AchievementCardProps) {
  const { name, description, category, rarity, target, progress, unlocked, unlockedAt } =
    achievement;

  const Icon = CATEGORY_ICONS[category] ?? IconTrophy;
  const rarityStyle = RARITY_COLORS[rarity];
  const progressPercent = target > 0 ? Math.min((progress / target) * 100, 100) : 0;

  if (unlocked) {
    const isLegendary = rarity === 'Legendary';
    const glowClass = RARITY_GLOW[rarity];

    const card = (
      <Card
        padding={compact ? 'sm' : 'md'}
        className={`relative overflow-hidden ${glowClass}`}
        glow={isLegendary}
      >
        {/* Rarity accent glow */}
        <div
          className={`absolute top-0 left-0 w-full h-0.5 ${rarityStyle.bg}`}
          aria-hidden="true"
        />

        <div className="flex items-start gap-3">
          {/* Icon */}
          <div
            className={`flex-shrink-0 flex items-center justify-center rounded-lg ${rarityStyle.bg} ${compact ? 'h-9 w-9' : 'h-11 w-11'}`}
          >
            <Icon
              width={compact ? 16 : 20}
              height={compact ? 16 : 20}
              className={rarityStyle.text}
            />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3
                className={`font-display font-semibold text-text-bright truncate ${compact ? 'text-sm' : 'text-base'}`}
              >
                {name}
              </h3>
              <span
                className={`flex-shrink-0 text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded-full border ${rarityStyle.text} ${rarityStyle.bg} ${rarityStyle.border}`}
              >
                {isLegendary && (
                  <IconSparkles width={8} height={8} className="inline-block mr-0.5 -mt-px" />
                )}
                {rarity}
              </span>
            </div>
            <p className="text-text-dim text-xs mt-0.5 line-clamp-2">{description}</p>
            {unlockedAt && (
              <p className="text-accent-ivory text-[11px] mt-1.5">
                Unlocked {formatRelativeDate(unlockedAt)}
              </p>
            )}
          </div>
        </div>
      </Card>
    );

    // Legendary: wrap with animated glow ring overlay
    if (isLegendary) {
      return (
        <div>
          <div className="relative rounded-2xl">
            <div
              className="absolute -inset-px rounded-2xl bg-gradient-to-b from-data-warning/30 via-data-warning/10 to-data-warning/0 animate-legendary-glow pointer-events-none"
              aria-hidden="true"
            />
            {card}
          </div>
        </div>
      );
    }

    return <div>{card}</div>;
  }

  // Locked variant
  return (
    <div>
      <Card padding={compact ? 'sm' : 'md'} className="opacity-60">
        <div className="flex items-start gap-3">
          {/* Dimmed grayscale icon */}
          <div
            className={`flex-shrink-0 flex items-center justify-center rounded-lg bg-void-deep ${compact ? 'h-9 w-9' : 'h-11 w-11'}`}
          >
            <Icon
              width={compact ? 16 : 20}
              height={compact ? 16 : 20}
              className="text-text-faint"
            />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3
              className={`font-display font-medium text-text-dim truncate ${compact ? 'text-sm' : 'text-base'}`}
            >
              {name}
            </h3>
            <p className="text-text-faint text-xs mt-0.5 line-clamp-1">{description}</p>

            {/* Progress bar */}
            <div className="mt-2">
              <div className="w-full h-1.5 bg-edge-default/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent-teal rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="text-text-faint text-[11px] mt-1">
                {progress} / {target} ({Math.round(progressPercent)}%)
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
