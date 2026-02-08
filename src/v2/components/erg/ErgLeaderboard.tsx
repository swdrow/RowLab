import { useState, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Trophy, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useErgLeaderboard } from '@v2/hooks/useErgTests';
import { FADE_IN_VARIANTS, SPRING_GENTLE } from '@v2/utils/animations';
import type { TestType, ErgLeaderboardEntry } from '@v2/types/ergTests';

const TEST_TYPES: { value: TestType; label: string }[] = [
  { value: '2k', label: '2K' },
  { value: '6k', label: '6K' },
  { value: '30min', label: '30min' },
  { value: '500m', label: '500m' },
];

/**
 * Format seconds to mm:ss.s display
 */
function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;
  const wholeSeconds = Math.floor(remainingSeconds);
  const tenths = Math.floor((remainingSeconds - wholeSeconds) * 10);
  return `${minutes}:${String(wholeSeconds).padStart(2, '0')}.${tenths}`;
}

/**
 * Format split/500m pace
 */
function formatSplit(splitSeconds: number | null): string | null {
  if (!splitSeconds) return null;
  return formatTime(splitSeconds);
}

/**
 * Get rank accent classes for top 3
 */
function getRankClasses(rank: number) {
  switch (rank) {
    case 1:
      return {
        text: 'text-accent-gold',
        border: 'border-l-accent-gold',
        bg: 'bg-accent-gold/5',
      };
    case 2:
      return {
        text: 'text-txt-secondary',
        border: 'border-l-txt-tertiary',
        bg: 'bg-bg-subtle/50',
      };
    case 3:
      return {
        text: 'text-accent-copper',
        border: 'border-l-accent-copper',
        bg: 'bg-accent-copper/5',
      };
    default:
      return {
        text: 'text-txt-tertiary',
        border: 'border-l-transparent',
        bg: '',
      };
  }
}

/**
 * Get initials from athlete name
 */
function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

/**
 * Leaderboard skeleton row
 */
function LeaderboardSkeleton() {
  return (
    <div className="space-y-2 p-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-lg">
          <div className="w-7 h-7 rounded-full bg-bg-subtle animate-pulse" />
          <div className="w-8 h-8 rounded-full bg-bg-subtle animate-pulse" />
          <div className="flex-1 space-y-1.5">
            <div className="h-4 w-24 bg-bg-subtle rounded animate-pulse" />
            <div className="h-3 w-16 bg-bg-subtle rounded animate-pulse" />
          </div>
          <div className="h-5 w-16 bg-bg-subtle rounded animate-pulse" />
        </div>
      ))}
    </div>
  );
}

export interface ErgLeaderboardProps {
  /** Class name for the container */
  className?: string;
}

/**
 * Improved erg leaderboard with test type tabs and trend indicators.
 * Shows ranked athletes for the selected test type with glass card styling.
 */
export function ErgLeaderboard({ className = '' }: ErgLeaderboardProps) {
  const [selectedTestType, setSelectedTestType] = useState<TestType>('2k');
  const { leaderboard, isLoading } = useErgLeaderboard(selectedTestType, 20);

  // Derive trend indicators - compare athlete's test to their previous one
  // The leaderboard only returns best tests, so trend is inferred from rank position
  // For a proper trend we'd need historical data - for now we show dash (no change)
  // This is a display-ready placeholder; full trend requires per-athlete history API

  return (
    <div
      className={`bg-bg-surface border border-bdr-default rounded-2xl overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-4">
        <h2 className="text-lg font-semibold text-txt-primary mb-4">Leaderboard</h2>

        {/* Test type tabs */}
        <div className="flex gap-1 p-1 bg-bg-subtle rounded-lg">
          {TEST_TYPES.map((tt) => (
            <button
              key={tt.value}
              onClick={() => setSelectedTestType(tt.value)}
              className={`
                flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors
                ${
                  selectedTestType === tt.value
                    ? 'bg-interactive-primary text-white shadow-sm'
                    : 'bg-transparent text-txt-secondary hover:bg-bg-active hover:text-txt-primary'
                }
              `}
            >
              {tt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <LeaderboardSkeleton />
      ) : leaderboard.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
          <Trophy size={32} className="text-txt-tertiary mb-3 opacity-50" />
          <p className="text-sm text-txt-secondary">
            No tests recorded for {selectedTestType.toUpperCase()}
          </p>
          <p className="text-xs text-txt-tertiary mt-1">Add erg tests to see the leaderboard</p>
        </div>
      ) : (
        <div className="px-3 pb-3">
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedTestType}
              variants={FADE_IN_VARIANTS}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={SPRING_GENTLE}
              className="space-y-1"
            >
              {leaderboard.map((entry, index) => {
                const rank = entry.rank ?? index + 1;
                const rankClasses = getRankClasses(rank);
                const athleteName = entry.athlete
                  ? `${entry.athlete.firstName} ${entry.athlete.lastName}`
                  : 'Unknown Athlete';
                const initials = entry.athlete
                  ? getInitials(entry.athlete.firstName, entry.athlete.lastName)
                  : '??';
                const split = formatSplit(entry.splitSeconds);

                return (
                  <motion.div
                    key={entry.id}
                    variants={FADE_IN_VARIANTS}
                    initial="hidden"
                    animate="visible"
                    transition={{ ...SPRING_GENTLE, delay: index * 0.03 }}
                    className={`
                      flex items-center gap-3 p-3 rounded-lg border-l-2 transition-colors
                      hover:bg-bg-active
                      ${rankClasses.border} ${rankClasses.bg}
                    `}
                  >
                    {/* Rank */}
                    <div className="w-7 flex-shrink-0 text-center">
                      {rank <= 3 ? (
                        <span className={`text-sm font-bold ${rankClasses.text}`}>
                          {rank === 1 ? (
                            <Trophy size={18} className="inline text-accent-gold" />
                          ) : (
                            rank
                          )}
                        </span>
                      ) : (
                        <span className="text-sm text-txt-tertiary">{rank}</span>
                      )}
                    </div>

                    {/* Avatar */}
                    <div
                      className={`
                        w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0
                        ${rank <= 3 ? 'bg-interactive-primary/10 text-interactive-primary' : 'bg-bg-subtle text-txt-secondary'}
                      `}
                    >
                      {initials}
                    </div>

                    {/* Athlete info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-txt-primary truncate">{athleteName}</p>
                      <div className="flex items-center gap-2 text-xs text-txt-tertiary">
                        {split && <span>Split: {split}</span>}
                        {entry.watts && <span>{entry.watts}W</span>}
                      </div>
                    </div>

                    {/* Time */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="font-mono tabular-nums text-sm font-medium text-txt-primary">
                        {formatTime(entry.timeSeconds)}
                      </span>

                      {/* Trend indicator - dash for now (no historical comparison available) */}
                      <span className="text-txt-tertiary">
                        <Minus size={14} />
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

export default ErgLeaderboard;
