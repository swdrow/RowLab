import { Pin, PinOff, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { AchievementBadge } from './AchievementBadge';
import { ProgressBar } from './ProgressBar';
import type { AchievementWithProgress } from '../../../types/gamification';

interface AchievementCardProps {
  achievement: AchievementWithProgress;
  onTogglePin?: (id: string) => void;
  isPinning?: boolean;
}

export function AchievementCard({
  achievement,
  onTogglePin,
  isPinning = false,
}: AchievementCardProps) {
  const {
    id,
    name,
    description,
    category,
    rarity,
    icon,
    progress,
    target,
    percentComplete,
    isUnlocked,
    isPinned,
    unlockedAt,
  } = achievement;

  return (
    <motion.div
      layout
      className={`
        p-4 rounded-lg border
        ${
          isUnlocked
            ? 'bg-surface-elevated border-bdr-default'
            : 'bg-surface border-bdr-secondary opacity-75'
        }
      `}
    >
      <div className="flex items-start gap-4">
        <AchievementBadge
          name={name}
          rarity={rarity}
          icon={icon}
          isUnlocked={isUnlocked}
          size="lg"
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-txt-primary truncate">{name}</h3>
              {isUnlocked && <Check size={16} className="text-data-excellent flex-shrink-0" />}
            </div>

            {isUnlocked && onTogglePin && (
              <button
                onClick={() => onTogglePin(id)}
                disabled={isPinning}
                className={`
                  p-1.5 rounded transition-colors
                  ${
                    isPinned
                      ? 'text-amber-500 bg-amber-500/10 hover:bg-amber-500/20'
                      : 'text-txt-tertiary hover:text-txt-primary hover:bg-surface-hover'
                  }
                `}
                title={isPinned ? 'Unpin' : 'Pin to profile'}
              >
                {isPinned ? <Pin size={16} /> : <PinOff size={16} />}
              </button>
            )}
          </div>

          <p className="text-sm text-txt-secondary mt-1 line-clamp-2">{description}</p>

          <div className="flex items-center gap-2 mt-2">
            <span
              className={`
              text-xs px-2 py-0.5 rounded-full
              ${category === 'Erg' ? 'bg-data-good/20 text-data-good' : ''}
              ${category === 'Attendance' ? 'bg-data-excellent/20 text-data-excellent' : ''}
              ${category === 'Racing' ? 'bg-data-warning/20 text-data-warning' : ''}
            `}
            >
              {category}
            </span>
            <span
              className={`
              text-xs px-2 py-0.5 rounded-full
              ${rarity === 'Common' ? 'bg-surface-elevated text-txt-secondary' : ''}
              ${rarity === 'Rare' ? 'bg-data-good/20 text-data-good' : ''}
              ${rarity === 'Epic' ? 'bg-chart-2/20 text-chart-2' : ''}
              ${rarity === 'Legendary' ? 'bg-data-warning/20 text-data-warning' : ''}
            `}
            >
              {rarity}
            </span>
          </div>

          {!isUnlocked && (
            <div className="mt-3">
              <ProgressBar current={progress} target={target} showValues size="sm" />
            </div>
          )}

          {isUnlocked && unlockedAt && (
            <p className="text-xs text-txt-tertiary mt-2">
              Unlocked {new Date(unlockedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default AchievementCard;
