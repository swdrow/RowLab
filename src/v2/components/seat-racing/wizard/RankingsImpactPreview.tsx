/**
 * RankingsImpactPreview - Before/after rankings comparison
 *
 * Shows projected ranking changes if the session is submitted.
 * Helps coaches understand impact before committing to the session.
 *
 * Features:
 * - Two-column layout: Current vs Projected rankings
 * - Colored indicators for rank changes (green up, red down)
 * - ELO delta display (+12, -8, etc.)
 * - Animated entry from right
 * - Fallback when preview unavailable
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { SPRING_CONFIG } from '@/v2/utils/animations';
import type { Athlete } from '@/v2/types/athletes';

interface RankingsImpactPreviewProps {
  sessionData: any; // Form data from wizard
  currentRankings?: Array<{ athleteId: string; rating: number; rank: number }>;
}

interface AthleteRanking {
  athleteId: string;
  name: string;
  currentRating: number;
  currentRank: number;
  projectedRating: number;
  projectedRank: number;
  ratingDelta: number;
  rankDelta: number;
}

/**
 * Simulate ELO changes based on session results
 * This is a simplified client-side calculation - the real calculation happens server-side
 */
function simulateELOChanges(
  sessionData: any,
  currentRankings: Array<{ athleteId: string; rating: number; rank: number }>
): AthleteRanking[] | null {
  // If no pieces or boats, can't calculate
  if (!sessionData.pieces || sessionData.pieces.length === 0) {
    return null;
  }

  // Extract all athletes and their boat performances
  const athletePerformances = new Map<
    string,
    { finishes: number[]; wins: number; races: number }
  >();

  sessionData.pieces.forEach((piece: any) => {
    if (!piece.boats || piece.boats.length < 2) return;

    // Sort boats by finish time
    const boatsWithTimes = piece.boats
      .filter((b: any) => b.finishTimeSeconds && b.assignments && b.assignments.length > 0)
      .sort((a: any, b: any) => a.finishTimeSeconds - b.finishTimeSeconds);

    if (boatsWithTimes.length < 2) return;

    // Assign points based on finish order (1st = 0, 2nd = 1, etc.)
    boatsWithTimes.forEach((boat: any, boatRank: number) => {
      boat.assignments.forEach((assignment: any) => {
        const athleteId = assignment.athleteId;
        if (!athletePerformances.has(athleteId)) {
          athletePerformances.set(athleteId, { finishes: [], wins: 0, races: 0 });
        }
        const perf = athletePerformances.get(athleteId)!;
        perf.finishes.push(boatRank);
        perf.races += 1;
        if (boatRank === 0) perf.wins += 1;
      });
    });
  });

  // If no valid races, can't calculate
  if (athletePerformances.size === 0) {
    return null;
  }

  // Calculate ELO changes (simplified K-factor = 32)
  const K = 32;
  const projectedRatings = new Map<string, number>();

  currentRankings.forEach((ranking) => {
    const perf = athletePerformances.get(ranking.athleteId);
    if (!perf) {
      projectedRatings.set(ranking.athleteId, ranking.rating);
      return;
    }

    // Calculate average finish position
    const avgFinish = perf.finishes.reduce((a, b) => a + b, 0) / perf.finishes.length;
    // Convert to expected score (0 = best, normalize to 0-1 scale)
    const expectedScore = 1 - avgFinish / 3; // Assume max 4 boats
    // Simplified ELO change: positive for good performance, negative for bad
    const actualScore = perf.wins / perf.races;
    const ratingChange = K * (actualScore - expectedScore);

    projectedRatings.set(ranking.athleteId, ranking.rating + ratingChange);
  });

  // Build comparison list
  const comparisons: AthleteRanking[] = currentRankings
    .filter((ranking) => projectedRatings.has(ranking.athleteId))
    .map((ranking) => {
      const projectedRating = projectedRatings.get(ranking.athleteId)!;
      return {
        athleteId: ranking.athleteId,
        name: ranking.athleteId, // Will be replaced with actual name in parent
        currentRating: ranking.rating,
        currentRank: ranking.rank,
        projectedRating,
        projectedRank: 0, // Calculated below
        ratingDelta: projectedRating - ranking.rating,
        rankDelta: 0, // Calculated below
      };
    });

  // Sort by projected rating to get new ranks
  comparisons.sort((a, b) => b.projectedRating - a.projectedRating);
  comparisons.forEach((comp, index) => {
    comp.projectedRank = index + 1;
    comp.rankDelta = comp.currentRank - comp.projectedRank; // Positive = moved up
  });

  return comparisons;
}

/**
 * RankChangeIndicator - Shows rank change with colored arrow
 */
interface RankChangeIndicatorProps {
  rankDelta: number;
}

function RankChangeIndicator({ rankDelta }: RankChangeIndicatorProps) {
  if (rankDelta === 0) {
    return (
      <div className="flex items-center gap-1 text-txt-tertiary">
        <Minus className="w-4 h-4" />
        <span className="text-sm font-medium">—</span>
      </div>
    );
  }

  if (rankDelta > 0) {
    return (
      <div className="flex items-center gap-1 text-data-good">
        <ArrowUp className="w-4 h-4" />
        <span className="text-sm font-medium">+{rankDelta}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 text-data-poor">
      <ArrowDown className="w-4 h-4" />
      <span className="text-sm font-medium">{rankDelta}</span>
    </div>
  );
}

/**
 * Main RankingsImpactPreview component
 */
export function RankingsImpactPreview({
  sessionData,
  currentRankings = [],
}: RankingsImpactPreviewProps) {
  // Calculate projected rankings
  const projectedComparisons = useMemo(() => {
    if (currentRankings.length === 0) return null;
    return simulateELOChanges(sessionData, currentRankings);
  }, [sessionData, currentRankings]);

  // If no data to show
  if (!projectedComparisons || projectedComparisons.length === 0) {
    return (
      <div className="mt-6 p-6 bg-bg-elevated border border-bdr-subtle rounded-lg">
        <h4 className="font-medium text-txt-primary mb-2">Rankings Impact Preview</h4>
        <p className="text-sm text-txt-tertiary">
          Rankings preview not available. Complete all boat times and athlete assignments to see
          projected impact.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={SPRING_CONFIG}
      className="mt-6 p-6 bg-bg-elevated border border-bdr-subtle rounded-lg"
    >
      <h4 className="font-medium text-txt-primary mb-4">Rankings Impact Preview</h4>
      <p className="text-sm text-txt-secondary mb-4">
        Projected ranking changes if you submit this session:
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Current Rankings Column */}
        <div>
          <h5 className="text-xs font-semibold text-txt-tertiary uppercase tracking-wide mb-3">
            Current Rankings
          </h5>
          <div className="space-y-2">
            {projectedComparisons
              .sort((a, b) => a.currentRank - b.currentRank)
              .map((comp) => (
                <div
                  key={comp.athleteId}
                  className="flex items-center justify-between p-2 bg-bg-surface rounded-md"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-txt-tertiary w-6">
                      #{comp.currentRank}
                    </span>
                    <span className="text-sm text-txt-primary">{comp.name}</span>
                  </div>
                  <span className="text-sm font-mono text-txt-secondary">
                    {comp.currentRating.toFixed(0)}
                  </span>
                </div>
              ))}
          </div>
        </div>

        {/* Projected Rankings Column */}
        <div>
          <h5 className="text-xs font-semibold text-txt-tertiary uppercase tracking-wide mb-3">
            Projected Rankings
          </h5>
          <div className="space-y-2">
            {projectedComparisons
              .sort((a, b) => a.projectedRank - b.projectedRank)
              .map((comp, index) => {
                const hasChange = comp.rankDelta !== 0;
                return (
                  <motion.div
                    key={comp.athleteId}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ ...SPRING_CONFIG, delay: index * 0.05 }}
                    className={`flex items-center justify-between p-2 rounded-md ${
                      hasChange ? 'bg-amber-500/10' : 'bg-bg-surface'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-txt-tertiary w-6">
                        #{comp.projectedRank}
                      </span>
                      <span className="text-sm text-txt-primary">{comp.name}</span>
                      <RankChangeIndicator rankDelta={comp.rankDelta} />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono text-txt-secondary">
                        {comp.projectedRating.toFixed(0)}
                      </span>
                      <span
                        className={`text-xs font-mono ${
                          comp.ratingDelta > 0
                            ? 'text-data-good'
                            : comp.ratingDelta < 0
                              ? 'text-data-poor'
                              : 'text-txt-tertiary'
                        }`}
                      >
                        {comp.ratingDelta > 0 ? '+' : ''}
                        {comp.ratingDelta.toFixed(0)}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
          </div>
        </div>
      </div>

      <p className="text-xs text-txt-tertiary mt-4 italic">
        Note: This is a simplified preview. Actual ELO changes are calculated server-side using your
        configured K-factor and may differ slightly.
      </p>
    </motion.div>
  );
}
