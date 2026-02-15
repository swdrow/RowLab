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

import { Trophy, Target, Flame, Hash, Sparkles } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { motion } from 'motion/react';

import { GlassCard } from '@/components/ui/GlassCard';
import { formatRelativeDate } from '@/lib/format';
import { listItemVariants } from '@/lib/animations';
import type { Achievement } from '../types';

/** Category icon mapping */
const CATEGORY_ICONS: Record<Achievement['category'], LucideIcon> = {
  distance: Target,
  consistency: Flame,
  count: Hash,
  variety: Sparkles,
};

/** Rarity color mapping using design tokens */
const RARITY_COLORS: Record<Achievement['rarity'], { text: string; bg: string; border: string }> = {
  Common: {
    text: 'text-ink-secondary',
    bg: 'bg-ink-secondary/10',
    border: 'border-ink-secondary/20',
  },
  Rare: {
    text: 'text-blue-400',
    bg: 'bg-blue-400/10',
    border: 'border-blue-400/20',
  },
  Epic: {
    text: 'text-accent-copper',
    bg: 'bg-accent-copper/10',
    border: 'border-accent-copper/20',
  },
  Legendary: {
    text: 'text-amber-400',
    bg: 'bg-amber-400/10',
    border: 'border-amber-400/20',
  },
};

/** Rarity glow wrapper classes for unlocked cards */
const RARITY_GLOW: Record<Achievement['rarity'], string> = {
  Common: '',
  Rare: 'ring-1 ring-blue-400/20',
  Epic: 'ring-1 ring-accent-copper/30 shadow-[0_0_20px_-5px_oklch(0.62_0.12_55/0.2)]',
  Legendary: '', // Legendary uses a separate animated overlay
};

interface AchievementCardProps {
  achievement: Achievement;
  compact?: boolean;
}

export function AchievementCard({ achievement, compact = false }: AchievementCardProps) {
  const { name, description, category, rarity, target, progress, unlocked, unlockedAt } =
    achievement;

  const Icon = CATEGORY_ICONS[category] ?? Trophy;
  const rarityStyle = RARITY_COLORS[rarity];
  const progressPercent = target > 0 ? Math.min((progress / target) * 100, 100) : 0;

  if (unlocked) {
    const isLegendary = rarity === 'Legendary';
    const glowClass = RARITY_GLOW[rarity];

    const card = (
      <GlassCard
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
            <Icon size={compact ? 16 : 20} className={rarityStyle.text} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3
                className={`font-semibold text-ink-primary truncate ${compact ? 'text-sm' : 'text-base'}`}
              >
                {name}
              </h3>
              <span
                className={`flex-shrink-0 text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded-full border ${rarityStyle.text} ${rarityStyle.bg} ${rarityStyle.border}`}
              >
                {isLegendary && <Sparkles size={8} className="inline-block mr-0.5 -mt-px" />}
                {rarity}
              </span>
            </div>
            <p className="text-ink-secondary text-xs mt-0.5 line-clamp-2">{description}</p>
            {unlockedAt && (
              <p className="text-ink-muted text-[11px] mt-1.5">
                Unlocked {formatRelativeDate(unlockedAt)}
              </p>
            )}
          </div>
        </div>
      </GlassCard>
    );

    // Legendary: wrap with animated glow ring overlay
    if (isLegendary) {
      return (
        <motion.div variants={listItemVariants}>
          <div className="relative rounded-2xl">
            <div
              className="absolute -inset-px rounded-2xl bg-gradient-to-b from-amber-400/30 via-amber-400/10 to-amber-400/0 animate-legendary-glow pointer-events-none"
              aria-hidden="true"
            />
            {card}
          </div>
        </motion.div>
      );
    }

    return <motion.div variants={listItemVariants}>{card}</motion.div>;
  }

  // Locked variant
  return (
    <motion.div variants={listItemVariants}>
      <GlassCard padding={compact ? 'sm' : 'md'} className="opacity-60">
        <div className="flex items-start gap-3">
          {/* Dimmed grayscale icon */}
          <div
            className={`flex-shrink-0 flex items-center justify-center rounded-lg bg-ink-well ${compact ? 'h-9 w-9' : 'h-11 w-11'}`}
          >
            <Icon size={compact ? 16 : 20} className="text-ink-muted" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3
              className={`font-medium text-ink-secondary truncate ${compact ? 'text-sm' : 'text-base'}`}
            >
              {name}
            </h3>
            <p className="text-ink-muted text-xs mt-0.5 line-clamp-1">{description}</p>

            {/* Progress bar */}
            <div className="mt-2">
              <div className="w-full h-1.5 bg-ink-border/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent-copper rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="text-ink-muted text-[11px] mt-1">
                {progress} / {target} ({Math.round(progressPercent)}%)
              </p>
            </div>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}
