import { Trophy, Star, Zap, Crown, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import type { AchievementRarity } from '../../../types/gamification';

interface AchievementBadgeProps {
  name: string;
  rarity: AchievementRarity;
  icon?: string;
  isUnlocked: boolean;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
  onClick?: () => void;
}

/**
 * Rarity color schemes - subtle, professional, not childish
 */
const rarityStyles: Record<
  AchievementRarity,
  { bg: string; border: string; text: string; glow: string }
> = {
  Common: {
    bg: 'bg-surface',
    border: 'border-bdr-default',
    text: 'text-txt-secondary',
    glow: '',
  },
  Rare: {
    bg: 'bg-blue-50 dark:bg-blue-950',
    border: 'border-blue-400 dark:border-blue-600',
    text: 'text-blue-600 dark:text-blue-400',
    glow: 'shadow-glow',
  },
  Epic: {
    bg: 'bg-purple-50 dark:bg-purple-950',
    border: 'border-purple-400 dark:border-purple-600',
    text: 'text-purple-600 dark:text-purple-400',
    glow: 'shadow-glow',
  },
  Legendary: {
    bg: 'bg-amber-50 dark:bg-amber-950',
    border: 'border-accent-primary',
    text: 'text-accent-primary',
    glow: 'shadow-glow',
  },
};

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
};

const iconSizes = {
  sm: 16,
  md: 24,
  lg: 32,
};

/**
 * Map icon names to Lucide components
 */
function getIcon(iconName: string | undefined, size: number) {
  const icons: Record<string, typeof Trophy> = {
    Trophy,
    Star,
    Zap,
    Crown,
  };

  const IconComponent = icons[iconName || 'Trophy'] || Trophy;
  return <IconComponent size={size} />;
}

export function AchievementBadge({
  name,
  rarity,
  icon,
  isUnlocked,
  size = 'md',
  showName = false,
  onClick,
}: AchievementBadgeProps) {
  const styles = rarityStyles[rarity];
  const sizeClass = sizeClasses[size];
  const iconSize = iconSizes[size];

  return (
    <motion.div
      className="flex flex-col items-center gap-1"
      initial={isUnlocked ? { opacity: 0, scale: 0.9 } : undefined}
      animate={isUnlocked ? { opacity: 1, scale: 1 } : undefined}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      whileHover={isUnlocked ? { scale: 1.05 } : undefined}
      whileTap={isUnlocked && onClick ? { scale: 0.95 } : undefined}
    >
      <button
        onClick={onClick}
        disabled={!isUnlocked || !onClick}
        className={`
          ${sizeClass}
          rounded-full border-2 flex items-center justify-center
          transition-all duration-200
          ${isUnlocked ? styles.bg : 'bg-surface-elevated'}
          ${isUnlocked ? styles.border : 'border-bdr-secondary'}
          ${isUnlocked ? styles.glow : ''}
          ${onClick && isUnlocked ? 'cursor-pointer hover:shadow-md' : 'cursor-default'}
          ${!isUnlocked ? 'opacity-40 grayscale' : ''}
        `}
        title={name}
      >
        <span className={isUnlocked ? styles.text : 'text-txt-tertiary'}>
          {isUnlocked ? getIcon(icon, iconSize) : <Lock size={iconSize} />}
        </span>
      </button>

      {showName && (
        <span className={`text-xs text-center max-w-[80px] truncate ${styles.text}`}>{name}</span>
      )}
    </motion.div>
  );
}

export default AchievementBadge;
