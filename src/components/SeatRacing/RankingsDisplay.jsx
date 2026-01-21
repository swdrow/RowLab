import { useEffect } from 'react';
import useRankingsStore from '../../store/rankingsStore';

const RankingsDisplay = () => {
  const { rankings, loading, fetchRankings, recalculateRankings } = useRankingsStore();

  useEffect(() => {
    fetchRankings();
  }, [fetchRankings]);

  const handleRecalculate = async () => {
    await recalculateRankings();
  };

  const getRatingColor = (rating) => {
    if (rating >= 1200) return 'text-blade-blue';
    if (rating >= 1000) return 'text-text-primary';
    if (rating >= 800) return 'text-warning-orange';
    return 'text-text-muted';
  };

  const getConfidenceBadge = (confidence) => {
    if (confidence >= 0.8) {
      return (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
          High
        </span>
      );
    }
    if (confidence >= 0.5) {
      return (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-white/10 text-text-secondary border border-white/10">
          Medium
        </span>
      );
    }
    return (
      <span className="px-2 py-1 text-xs font-medium rounded-full bg-white/[0.06] text-text-muted border border-white/[0.06]">
        Low
      </span>
    );
  };

  const getRankColor = (rank) => {
    if (rank <= 3) return 'text-warning-orange font-bold';
    return 'text-text-primary';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-4 border-blade-blue border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-text-secondary">Loading rankings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-void-elevated rounded-lg shadow">
      <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
        <h2 className="text-xl font-display font-semibold text-text-primary tracking-[-0.02em]">
          Athlete Rankings
        </h2>
        <button
          onClick={handleRecalculate}
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-void-deep bg-blade-blue rounded-lg hover:bg-blade-blue/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Recalculate Rankings
        </button>
      </div>

      {rankings.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center p-6">
          <svg
            className="w-16 h-16 text-text-disabled mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          <p className="text-lg font-medium text-text-primary mb-2">
            No Rankings Available
          </p>
          <p className="text-sm text-text-secondary">
            Complete some seat races to generate athlete rankings
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-void-surface">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                  Athlete
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                  Rating
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                  Races
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                  Confidence
                </th>
              </tr>
            </thead>
            <tbody className="bg-void-elevated divide-y divide-white/[0.06]">
              {rankings.map((ranking) => (
                <tr
                  key={ranking.athlete_id}
                  className="hover:bg-white/[0.04] transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-mono font-medium tabular-nums ${getRankColor(ranking.rank)}`}>
                      {ranking.rank}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-text-primary">
                      {ranking.athlete?.name || 'Unknown Athlete'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-mono font-semibold tabular-nums ${getRatingColor(ranking.elo_rating)}`}>
                      {Math.round(ranking.elo_rating)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-mono tabular-nums text-text-primary">
                      {ranking.races_completed}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getConfidenceBadge(ranking.confidence)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default RankingsDisplay;
