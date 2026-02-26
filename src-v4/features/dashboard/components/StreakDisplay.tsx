/**
 * StreakDisplay — current and longest workout streak.
 */
import { Card } from '@/components/ui/Card';
import type { StatsData } from '../types';

interface StreakDisplayProps {
  streak: StatsData['streak'];
}

export function StreakDisplay({ streak }: StreakDisplayProps) {
  if (streak.current === 0 && streak.longest === 0) return null;

  return (
    <Card padding="md">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[10px] font-medium uppercase tracking-widest text-text-faint">
            Current Streak
          </span>
          <span className="font-mono text-xl font-bold text-accent-coral">
            {streak.current}
            <span className="text-xs text-text-dim ml-0.5">days</span>
          </span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[10px] font-medium uppercase tracking-widest text-text-faint">
            Longest
          </span>
          <span className="font-mono text-sm text-text-dim">{streak.longest} days</span>
        </div>
      </div>
    </Card>
  );
}
