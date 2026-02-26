/**
 * Training streak indicator with flame icon and pulse animation.
 * Shows consecutive training day count, or "No active streak" when zero.
 */

import { IconFlame } from '@/components/icons';

interface StreakIndicatorProps {
  current: number;
  longest: number;
  className?: string;
}

export function StreakIndicator({ current, longest, className = '' }: StreakIndicatorProps) {
  if (current === 0) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <IconFlame width={16} height={16} className="text-text-faint" aria-hidden="true" />
        <span className="text-sm text-text-faint">No active streak</span>
      </div>
    );
  }

  const isPersonalBest = current === longest && current > 0;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <IconFlame width={16} height={16} className="text-data-warning streak-flame" aria-hidden="true" />
      <span className="text-sm font-medium text-text-dim">{current} day streak</span>
      {isPersonalBest && (
        <span className="text-xs font-medium text-data-warning bg-data-warning/10 px-2 py-0.5 rounded-full">
          Personal best!
        </span>
      )}

      <style>{`
        @keyframes flamePulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.85; transform: scale(1.08); }
        }
        .streak-flame {
          animation: flamePulse 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
