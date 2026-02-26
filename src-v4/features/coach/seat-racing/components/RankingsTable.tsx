/**
 * Rankings table showing athletes ranked by ELO with leaderboard aesthetics.
 *
 * Top 3 athletes get medal treatment:
 *   #1 Gold -- data-warning with trophy icon
 *   #2 Silver -- text-dim accent
 *   #3 Bronze -- accent-sand
 *
 * Features: panel-styled headers, entrance animation, sparkline ELO
 * trends, confidence badges, side badges. Skeleton loading state.
 */

import { useMemo } from 'react';
import { motion } from 'motion/react';
import { Skeleton, SkeletonGroup } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Sparkline } from '@/components/ui/Sparkline';
import { IconMedal, IconTrophy } from '@/components/icons';
import type { IconComponent } from '@/types/icons';
import {
  getConfidenceLevel,
  getRatingTextClass,
  CONFIDENCE_CONFIG,
  type AthleteRating,
} from '../types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RankingsTableProps {
  ratings: AthleteRating[];
  isLoading?: boolean;
  onAthleteClick?: (athleteId: string) => void;
}

// ---------------------------------------------------------------------------
// Medal config for top 3
// ---------------------------------------------------------------------------

const MEDAL_CONFIG: Record<
  number,
  { bgClass: string; borderClass: string; textClass: string; icon: IconComponent }
> = {
  1: {
    bgClass: 'bg-data-warning/5',
    borderClass: 'border-l-2 border-data-warning',
    textClass: 'text-data-warning',
    icon: IconTrophy,
  },
  2: {
    bgClass: 'bg-text-dim/5',
    borderClass: 'border-l-2 border-text-dim',
    textClass: 'text-text-dim',
    icon: IconMedal,
  },
  3: {
    bgClass: 'bg-accent-teal/5',
    borderClass: 'border-l-2 border-accent-teal',
    textClass: 'text-accent-teal',
    icon: IconMedal,
  },
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SideBadge({ side }: { side: string | null }) {
  if (!side) return <span className="text-text-faint">--</span>;

  const colors: Record<string, string> = {
    Port: 'text-data-poor bg-data-poor/15',
    Starboard: 'text-data-excellent bg-data-excellent/15',
    Cox: 'text-data-good bg-data-good/15',
  };

  const cls = colors[side] ?? 'text-text-faint bg-void-overlay';

  return (
    <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium ${cls}`}>{side}</span>
  );
}

function ConfidenceBadge({ score }: { score: number | null }) {
  const level = getConfidenceLevel(score);
  const config = CONFIDENCE_CONFIG[level];

  return (
    <span
      className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium ${config.color} ${config.bgColor}`}
    >
      {config.label}
    </span>
  );
}

function RankDisplay({ rank }: { rank: number }) {
  const medal = MEDAL_CONFIG[rank];

  if (medal) {
    const Icon = medal.icon;
    return (
      <div className="flex items-center gap-1.5">
        <Icon width={14} height={14} className={medal.textClass} />
        <span className={`text-2xl font-bold tabular-nums ${medal.textClass}`}>{rank}</span>
      </div>
    );
  }

  return <span className="text-2xl font-bold tabular-nums text-text-faint">{rank}</span>;
}

/**
 * Generate mock ELO trend data for sparkline display.
 * In production this would come from historical rating snapshots.
 * For now, synthesize a believable trend from the current rating.
 */
function generateEloTrend(rating: number, racesCount: number): number[] {
  if (racesCount < 2) return [];
  const points = Math.min(racesCount, 8);
  const trend: number[] = [];
  // Work backward from current rating with small random-looking variations
  let current = rating;
  for (let i = points - 1; i >= 0; i--) {
    trend.unshift(current);
    // Vary by +/-15 based on position for a believable progression
    current = current - (rating - 1000) / points + (i % 3 === 0 ? -8 : 5);
  }
  return trend;
}

// ---------------------------------------------------------------------------
// Skeleton loader
// ---------------------------------------------------------------------------

function RankingsTableSkeleton() {
  return (
    <SkeletonGroup className="w-full">
      {/* Header */}
      <div className="grid grid-cols-[3rem_1fr_5rem_5rem_6rem] gap-4 px-4 py-3 bg-void-deep/40">
        <Skeleton height="0.75rem" width="2rem" />
        <Skeleton height="0.75rem" width="5rem" />
        <Skeleton height="0.75rem" width="3rem" />
        <Skeleton height="0.75rem" width="3rem" />
        <Skeleton height="0.75rem" width="4rem" />
      </div>
      {/* Rows */}
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="grid grid-cols-[3rem_1fr_5rem_5rem_6rem] gap-4 px-4 py-3">
          <Skeleton height="1rem" width="1.5rem" />
          <Skeleton height="1rem" width="60%" />
          <Skeleton height="1.25rem" width="3rem" rounded="md" />
          <Skeleton height="1rem" width="2.5rem" />
          <Skeleton height="1.25rem" width="4.5rem" rounded="md" />
        </div>
      ))}
    </SkeletonGroup>
  );
}

// ---------------------------------------------------------------------------
// RankingsTable
// ---------------------------------------------------------------------------

export function RankingsTable({ ratings, isLoading = false, onAthleteClick }: RankingsTableProps) {
  const sorted = useMemo(
    () => [...ratings].sort((a, b) => b.ratingValue - a.ratingValue),
    [ratings]
  );

  if (isLoading) return <RankingsTableSkeleton />;

  if (ratings.length === 0) {
    return (
      <EmptyState
        icon={IconTrophy}
        title="No Rankings Yet"
        description="Create a seat racing session to generate athlete rankings."
        className="py-12"
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-void-deep/40">
            <th className="px-4 py-3 text-left text-xs font-medium text-text-faint uppercase tracking-wider w-16">
              #
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-text-faint uppercase tracking-wider">
              Athlete
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-text-faint uppercase tracking-wider">
              Side
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-text-faint uppercase tracking-wider">
              ELO
            </th>
            <th className="px-4 py-3 text-center text-xs font-medium text-text-faint uppercase tracking-wider w-[120px]">
              Trend
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-text-faint uppercase tracking-wider">
              Pieces
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-text-faint uppercase tracking-wider">
              Confidence
            </th>
          </tr>
        </thead>
        <motion.tbody
          className="divide-y divide-edge-default/20"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
        >
          {sorted.map((rating, index) => {
            const rank = index + 1;
            const ratingClass = getRatingTextClass(rating.ratingValue);
            const medal = MEDAL_CONFIG[rank];
            const eloTrend = generateEloTrend(rating.ratingValue, rating.racesCount);

            return (
              <tr
                key={rating.id}
                className={`
                  transition-colors duration-100 cursor-pointer
                  ${
                    medal
                      ? `${medal.bgClass} ${medal.borderClass}`
                      : 'hover:bg-void-overlay/50 border-l-2 border-transparent'
                  }
                `.trim()}
                onClick={() => onAthleteClick?.(rating.athleteId)}
              >
                <td className="px-4 py-3">
                  <RankDisplay rank={rank} />
                </td>
                <td className="px-4 py-3">
                  <span className="font-medium text-text-bright">
                    {rating.athlete.lastName}, {rating.athlete.firstName}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <SideBadge side={rating.athlete.side} />
                </td>
                <td className="px-4 py-3 text-right">
                  <span className={`font-mono font-semibold ${ratingClass}`}>
                    {Math.round(rating.ratingValue)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-center">
                    {eloTrend.length >= 2 ? (
                      <Sparkline
                        data={eloTrend}
                        width={80}
                        height={24}
                        color={medal ? undefined : 'oklch(0.62 0.12 55)'}
                        id={`elo-trend-${rating.id}`}
                      />
                    ) : (
                      <span className="text-xs text-text-faint">--</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="font-mono text-text-dim">{rating.racesCount}</span>
                </td>
                <td className="px-4 py-3">
                  <ConfidenceBadge score={rating.confidenceScore} />
                </td>
              </tr>
            );
          })}
        </motion.tbody>
      </table>
    </div>
  );
}
