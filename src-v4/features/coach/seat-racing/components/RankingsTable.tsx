/**
 * Rankings table showing athletes ranked by ELO with confidence badges.
 *
 * Sorted by rating descending. Confidence badges use color tokens
 * matching the design system data colors. Side badges show Port/Starboard.
 * Skeleton loading state (no spinners per design standard).
 */

import { useMemo } from 'react';
import { Trophy } from 'lucide-react';
import { Skeleton, SkeletonGroup } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
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
// Sub-components
// ---------------------------------------------------------------------------

function SideBadge({ side }: { side: string | null }) {
  if (!side) return <span className="text-ink-muted">--</span>;

  const colors: Record<string, string> = {
    Port: 'text-data-poor bg-data-poor/15',
    Starboard: 'text-data-excellent bg-data-excellent/15',
    Cox: 'text-data-good bg-data-good/15',
  };

  const cls = colors[side] ?? 'text-ink-muted bg-ink-hover';

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

function RankBadge({ rank }: { rank: number }) {
  if (rank <= 3) {
    return <span className="font-bold text-accent-copper tabular-nums">{rank}</span>;
  }
  return <span className="text-ink-secondary tabular-nums">{rank}</span>;
}

// ---------------------------------------------------------------------------
// Skeleton loader
// ---------------------------------------------------------------------------

function RankingsTableSkeleton() {
  return (
    <SkeletonGroup className="w-full">
      {/* Header */}
      <div className="grid grid-cols-[3rem_1fr_5rem_5rem_6rem] gap-4 px-4 py-3">
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
        icon={Trophy}
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
          <tr className="border-b border-ink-border">
            <th className="px-4 py-3 text-left text-xs font-medium text-ink-muted uppercase tracking-wider w-12">
              #
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-ink-muted uppercase tracking-wider">
              Athlete
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-ink-muted uppercase tracking-wider">
              Side
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-ink-muted uppercase tracking-wider">
              ELO
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-ink-muted uppercase tracking-wider">
              Pieces
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-ink-muted uppercase tracking-wider">
              Confidence
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-well">
          {sorted.map((rating, index) => {
            const rank = index + 1;
            const ratingClass = getRatingTextClass(rating.ratingValue);

            return (
              <tr
                key={rating.id}
                className="hover:bg-ink-hover/50 transition-colors cursor-pointer"
                onClick={() => onAthleteClick?.(rating.athleteId)}
              >
                <td className="px-4 py-3">
                  <RankBadge rank={rank} />
                </td>
                <td className="px-4 py-3">
                  <span className="font-medium text-ink-primary">
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
                <td className="px-4 py-3 text-right">
                  <span className="font-mono text-ink-secondary">{rating.racesCount}</span>
                </td>
                <td className="px-4 py-3">
                  <ConfidenceBadge score={rating.confidenceScore} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
