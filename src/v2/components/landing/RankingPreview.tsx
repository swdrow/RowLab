import React from 'react';

/**
 * RankingPreview - Mini athlete rankings
 *
 * Shows a condensed view of Bradley-Terry style rankings.
 */
export const RankingPreview: React.FC = () => {
  const athletes = [
    { rank: 1, name: 'A. Johnson', rating: 1842 },
    { rank: 2, name: 'M. Chen', rating: 1798 },
    { rank: 3, name: 'K. Williams', rating: 1756 },
  ];

  return (
    <div className="space-y-2">
      {athletes.map((a) => (
        <div
          key={a.rank}
          className="flex items-center justify-between px-2 py-1.5 bg-ink-base/50 rounded"
        >
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-ink-secondary w-4">
              {a.rank}
            </span>
            <span className="text-sm text-ink-primary truncate">
              {a.name}
            </span>
          </div>
          <span className="text-xs font-mono text-data-good tabular-nums">
            {a.rating}
          </span>
        </div>
      ))}
    </div>
  );
};

export default RankingPreview;
