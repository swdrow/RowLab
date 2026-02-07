import { Link } from 'react-router-dom';
import { ChartBar, Trophy } from '@phosphor-icons/react';
import { useErgLeaderboard } from '../../../../hooks/useErgTests';
import type { WidgetProps } from '../../types';

/**
 * Format seconds to mm:ss.d display (e.g. 420 -> "7:00.0")
 */
function formatErgTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;
  const wholeSeconds = Math.floor(remainingSeconds);
  const tenths = Math.floor((remainingSeconds - wholeSeconds) * 10);
  return `${minutes}:${String(wholeSeconds).padStart(2, '0')}.${tenths}`;
}

export function ErgLeaderboardWidget(_props: WidgetProps) {
  const { leaderboard, isLoading } = useErgLeaderboard('2k', 5);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-txt-primary flex items-center gap-2">
          <ChartBar className="w-5 h-5 text-accent-primary" />
          Erg Leaderboard
        </h3>
        <Link to="/app/erg-tests" className="text-sm text-accent-primary hover:underline">
          View all
        </Link>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 bg-surface-default rounded-lg animate-pulse" />
            ))}
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="text-center py-8 text-txt-muted">
            <ChartBar className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No erg test data yet</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {leaderboard.map((entry, index) => {
              const rank = entry.rank ?? index + 1;
              const isFirst = rank === 1;
              const athleteName = entry.athlete
                ? `${entry.athlete.firstName} ${entry.athlete.lastName}`
                : 'Unknown Athlete';

              return (
                <div
                  key={entry.id}
                  className={`flex items-center gap-3 p-2.5 rounded-lg transition-colors
                    ${
                      isFirst
                        ? 'bg-accent-primary/5 border border-accent-primary/20'
                        : 'bg-surface-default border border-bdr-default'
                    }`}
                >
                  <span
                    className={`w-7 h-7 flex items-center justify-center rounded-full text-sm shrink-0
                      ${
                        isFirst
                          ? 'bg-accent-primary/15 text-accent-primary font-bold'
                          : 'bg-surface-default text-txt-muted font-medium'
                      }`}
                  >
                    {isFirst ? <Trophy className="w-4 h-4" weight="fill" /> : rank}
                  </span>
                  <div className="flex-1 min-w-0">
                    <span
                      className={`text-sm truncate block ${isFirst ? 'font-semibold text-txt-primary' : 'text-txt-secondary'}`}
                    >
                      {athleteName}
                    </span>
                  </div>
                  <span
                    className={`text-sm tabular-nums shrink-0 ${isFirst ? 'font-semibold text-accent-primary' : 'text-txt-muted'}`}
                  >
                    {formatErgTime(entry.timeSeconds)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
