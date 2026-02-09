import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, TrendingUp, TrendingDown, Minus, RefreshCw } from 'lucide-react';
import { useLeaderboard, useRefreshLeaderboard } from '../../../hooks/useChallenges';
import type { LeaderboardEntry } from '../../../types/gamification';

interface LeaderboardLiveProps {
  challengeId: string;
  isActive: boolean;
  maxDisplay?: number;
}

/**
 * Format score for display
 */
function formatScore(score: number, metric: string): string {
  if (metric === 'meters') {
    if (score >= 1000000) return `${(score / 1000000).toFixed(1)}M`;
    if (score >= 1000) return `${(score / 1000).toFixed(1)}K`;
    return score.toLocaleString();
  }
  return score.toLocaleString();
}

/**
 * Get rank change indicator
 */
function RankChange({ delta }: { delta?: number }) {
  if (!delta || delta === 0) {
    return <Minus size={14} className="text-txt-tertiary" />;
  }

  if (delta > 0) {
    return (
      <span className="flex items-center text-green-500">
        <TrendingUp size={14} />
        <span className="text-xs ml-0.5">+{delta}</span>
      </span>
    );
  }

  return (
    <span className="flex items-center text-red-500">
      <TrendingDown size={14} />
      <span className="text-xs ml-0.5">{delta}</span>
    </span>
  );
}

/**
 * Live leaderboard with 5s polling per RESEARCH.md
 */
export function LeaderboardLive({ challengeId, isActive, maxDisplay = 10 }: LeaderboardLiveProps) {
  const { data, isLoading, error, dataUpdatedAt } = useLeaderboard(challengeId, isActive);
  const refresh = useRefreshLeaderboard();

  // Track previous ranks for change animation
  const prevRanksRef = useRef<Map<string, number>>(new Map());
  const [rankChanges, setRankChanges] = useState<Map<string, number>>(new Map());

  useEffect(() => {
    if (data?.leaderboard) {
      const newChanges = new Map<string, number>();

      data.leaderboard.forEach((entry) => {
        const prevRank = prevRanksRef.current.get(entry.athleteId);
        if (prevRank !== undefined && prevRank !== entry.rank) {
          // Positive delta means improved (moved up)
          newChanges.set(entry.athleteId, prevRank - entry.rank);
        }
        prevRanksRef.current.set(entry.athleteId, entry.rank);
      });

      if (newChanges.size > 0) {
        setRankChanges(newChanges);
        // Clear changes after animation
        setTimeout(() => setRankChanges(new Map()), 3000);
      }
    }
  }, [data?.leaderboard]);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 bg-surface-elevated rounded animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return <div className="text-center py-8 text-txt-secondary">Failed to load leaderboard</div>;
  }

  const leaderboard = data?.leaderboard?.slice(0, maxDisplay) || [];
  const lastUpdated = data?.lastUpdated ? new Date(data.lastUpdated) : null;

  return (
    <div className="space-y-2">
      {/* Header with refresh */}
      <div className="flex items-center justify-between text-xs text-txt-tertiary mb-2">
        <span>{isActive ? 'Live updates every 5s' : 'Final standings'}</span>
        <button
          onClick={() => refresh.mutate(challengeId)}
          disabled={refresh.isPending}
          className="flex items-center gap-1 hover:text-txt-primary transition-colors"
        >
          <RefreshCw size={12} className={refresh.isPending ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Leaderboard */}
      <AnimatePresence mode="popLayout">
        {leaderboard.map((entry, index) => {
          const rankChange = rankChanges.get(entry.athleteId);
          const isTopThree = entry.rank <= 3;

          return (
            <motion.div
              key={entry.athleteId}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className={`
                flex items-center gap-3 p-3 rounded-lg
                ${rankChange && rankChange > 0 ? 'bg-green-50 dark:bg-green-950/30' : 'bg-surface'}
                ${isTopThree ? 'border border-bdr-default' : ''}
              `}
            >
              {/* Rank */}
              <div
                className={`
                w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                ${entry.rank === 1 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-accent-primary' : ''}
                ${entry.rank === 2 ? 'bg-slate-100 text-slate-700 dark:bg-slate-800/30 dark:text-slate-300' : ''}
                ${entry.rank === 3 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' : ''}
                ${entry.rank > 3 ? 'bg-surface-hover text-txt-secondary' : ''}
              `}
              >
                {entry.rank === 1 ? <Trophy size={16} /> : entry.rank}
              </div>

              {/* Avatar */}
              {entry.avatar ? (
                <img
                  src={entry.avatar}
                  alt={entry.athleteName}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-medium text-sm">
                  {entry.athleteName.charAt(0)}
                </div>
              )}

              {/* Name */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-txt-primary truncate">{entry.athleteName}</p>
              </div>

              {/* Rank change indicator */}
              <RankChange delta={rankChange} />

              {/* Score */}
              <div className="text-right">
                <p className="font-mono font-semibold text-txt-primary">
                  {formatScore(entry.score, 'meters')}
                </p>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {leaderboard.length === 0 && (
        <div className="text-center py-8 text-txt-secondary">No participants yet</div>
      )}

      {/* Last updated */}
      {lastUpdated && (
        <p className="text-xs text-txt-tertiary text-right mt-2">
          Updated {lastUpdated.toLocaleTimeString()}
        </p>
      )}
    </div>
  );
}

export default LeaderboardLive;
