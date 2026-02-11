import { Link } from 'react-router-dom';
import { Ranking } from '@phosphor-icons/react';
import { useAthleteRatings } from '../../../../hooks/useAthleteRatings';
import { useAuth } from '../../../../contexts/AuthContext';
import type { WidgetProps } from '../../types';

const TOP_COUNT = 10;

const RANK_MEDAL_COLORS: Record<number, string> = {
  1: 'text-amber-500',
  2: 'text-gray-400',
  3: 'text-amber-700',
};

function formatAthleteName(athlete: { firstName: string; lastName: string }): string {
  return `${athlete.firstName} ${athlete.lastName}`;
}

function RankBadge({ rank }: { rank: number }) {
  const color = RANK_MEDAL_COLORS[rank] ?? 'text-ink-muted';
  return <span className={`w-6 text-right font-semibold text-sm ${color}`}>#{rank}</span>;
}

function RatingRow({
  rank,
  athleteName,
  rating,
  isCurrentUser,
}: {
  rank: number;
  athleteName: string;
  rating: number;
  isCurrentUser: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
        isCurrentUser
          ? 'bg-accent-copper/10 border border-accent-primary/20'
          : 'bg-ink-base border border-transparent'
      }`}
    >
      <div className="flex items-center gap-3">
        <RankBadge rank={rank} />
        <span
          className={`text-sm ${isCurrentUser ? 'font-semibold text-accent-copper' : 'text-ink-bright'}`}
        >
          {athleteName}
        </span>
      </div>
      <span className="text-sm font-mono text-ink-muted">{Math.round(rating)}</span>
    </div>
  );
}

export function TeamLeaderboardWidget(_props: WidgetProps) {
  const { ratings, isLoading } = useAthleteRatings();
  const { user } = useAuth();
  const currentUserId = user?.id ?? null;

  const topRatings = ratings.slice(0, TOP_COUNT);

  // Find current user's position if they are not in the top 10
  const currentUserIndex = ratings.findIndex((r) => r.athleteId === currentUserId);
  const currentUserInTop = currentUserIndex >= 0 && currentUserIndex < TOP_COUNT;
  const currentUserRating = currentUserIndex >= 0 ? ratings[currentUserIndex] : null;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-ink-bright flex items-center gap-2">
          <Ranking className="w-5 h-5 text-accent-copper" />
          Team Leaderboard
        </h3>
        <Link to="/app/rankings" className="text-sm text-accent-copper hover:underline">
          View all
        </Link>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 bg-ink-base rounded-lg animate-pulse" />
            ))}
          </div>
        ) : topRatings.length === 0 ? (
          <div className="text-center py-8 text-ink-muted">
            <Ranking className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No rankings available yet</p>
          </div>
        ) : (
          <div className="space-y-1">
            {topRatings.map((entry, index) => (
              <RatingRow
                key={entry.athleteId}
                rank={index + 1}
                athleteName={formatAthleteName(entry.athlete)}
                rating={entry.ratingValue}
                isCurrentUser={entry.athleteId === currentUserId}
              />
            ))}

            {/* Show current user below top 10 if they are ranked but not visible */}
            {!currentUserInTop && currentUserRating && (
              <>
                <div className="flex items-center justify-center py-1 text-ink-muted text-xs">
                  &middot;&middot;&middot;
                </div>
                <RatingRow
                  rank={currentUserIndex + 1}
                  athleteName={formatAthleteName(currentUserRating.athlete)}
                  rating={currentUserRating.ratingValue}
                  isCurrentUser
                />
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
