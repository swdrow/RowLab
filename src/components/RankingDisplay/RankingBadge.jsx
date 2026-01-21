import React from 'react';

/**
 * SKELETON COMPONENT - Ranking badge for athletes
 * Status: Awaiting ranking system definition
 *
 * This component will display athlete rankings once the ranking
 * system is defined and implemented.
 *
 * Questions to answer:
 * - Should rankings be manual entry or auto-calculated from erg data?
 * - Overall ranking, side-specific ranking, or both?
 * - How often should rankings update?
 * - What metrics determine rank (2k time, 6k time, composite score)?
 *
 * To activate:
 * 1. Define ranking methodology in PROJECT_DOCUMENTATION.md
 * 2. Add ranking field to athlete data structure
 * 3. Implement ranking calculation or manual entry system
 * 4. Display badges in AthleteCard component
 */
const RankingBadge = ({ rank, side = null, size = 'sm' }) => {
  // Size variants
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base'
  };

  // Rank tiers (gold, silver, bronze, etc.)
  const getRankColor = (rank) => {
    if (rank === 1) return 'bg-yellow-400 text-yellow-900';
    if (rank === 2) return 'bg-slate-300 text-slate-800';
    if (rank === 3) return 'bg-orange-400 text-orange-900';
    return 'bg-blade-blue text-white';
  };

  // Side-specific emoji indicators
  const getSideIcon = (side) => {
    if (side === 'port') return '⚓';
    if (side === 'starboard') return '⭐';
    return '';
  };

  if (!rank) return null;

  return (
    <div
      className={`
        ${sizeClasses[size]}
        ${getRankColor(rank)}
        rounded-full flex items-center justify-center
        font-bold shadow-sm
      `}
      title={`Rank #${rank}${side ? ` (${side})` : ''}`}
    >
      #{rank}
      {side && <span className="ml-0.5">{getSideIcon(side)}</span>}
    </div>
  );
};

export default RankingBadge;
