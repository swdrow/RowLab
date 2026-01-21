import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, ChevronDown, X, BarChart3, Loader2, AlertCircle } from 'lucide-react';
import { useCombinedScoringStore } from '../../store/combinedScoringStore';
import useAuthStore from '../../store/authStore';
import SpotlightCard from '../ui/SpotlightCard';

/**
 * Get color class based on score value
 * 80+: green, 60-79: amber, <60: red
 */
function getScoreColor(score) {
  if (score === null || score === undefined) return 'text-text-muted';
  if (score >= 80) return 'text-blade-blue';
  if (score >= 60) return 'text-warning-orange';
  return 'text-danger-red';
}

/**
 * Get background color class for score badges
 */
function getScoreBgColor(score) {
  if (score === null || score === undefined) return 'bg-void-elevated border-white/[0.06]';
  if (score >= 80) return 'bg-blade-blue/10 border-blade-blue/20';
  if (score >= 60) return 'bg-warning-orange/10 border-warning-orange/20';
  return 'bg-danger-red/10 border-danger-red/20';
}

/**
 * Confidence badge component
 */
function ConfidenceBadge({ confidence }) {
  if (confidence === null || confidence === undefined) {
    return (
      <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-text-muted/10 text-text-muted border border-text-muted/20">
        N/A
      </span>
    );
  }

  if (confidence >= 0.8) {
    return (
      <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-blade-blue/10 text-blade-blue border border-blade-blue/20">
        High
      </span>
    );
  }
  if (confidence >= 0.5) {
    return (
      <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-warning-orange/10 text-warning-orange border border-warning-orange/20">
        Medium
      </span>
    );
  }
  return (
    <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-danger-red/10 text-danger-red border border-danger-red/20">
      Low
    </span>
  );
}

/**
 * Format score to 1 decimal place
 */
function formatScore(score) {
  if (score === null || score === undefined) return '-';
  return Number(score).toFixed(1);
}

/**
 * Skeleton loading row
 */
function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      <td className="px-4 py-4">
        <div className="h-4 w-6 bg-void-elevated rounded" />
      </td>
      <td className="px-4 py-4">
        <div className="h-4 w-32 bg-void-elevated rounded" />
      </td>
      <td className="px-4 py-4">
        <div className="h-6 w-16 bg-void-elevated rounded" />
      </td>
      <td className="px-4 py-4 hidden sm:table-cell">
        <div className="h-4 w-12 bg-void-elevated rounded" />
      </td>
      <td className="px-4 py-4 hidden md:table-cell">
        <div className="h-4 w-12 bg-void-elevated rounded" />
      </td>
      <td className="px-4 py-4 hidden lg:table-cell">
        <div className="h-4 w-12 bg-void-elevated rounded" />
      </td>
      <td className="px-4 py-4">
        <div className="h-5 w-14 bg-void-elevated rounded-full" />
      </td>
    </tr>
  );
}

/**
 * Expanded detail row showing breakdown
 */
function DetailRow({ athlete, onClose }) {
  const breakdown = athlete.breakdown || {};

  return (
    <tr>
      <td colSpan={7} className="px-4 py-4 bg-void-deep/50 border-t border-b border-white/[0.06]">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-text-primary">
              Score Breakdown: {athlete.name || athlete.athleteName}
            </h4>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/[0.04] transition-colors"
              aria-label="Close breakdown"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Score Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Erg Score */}
            <div className={`p-4 rounded-lg border ${getScoreBgColor(athlete.ergScore)}`}>
              <div className="text-xs uppercase tracking-wider text-text-muted mb-1">
                Erg Score
              </div>
              <div className={`text-2xl font-bold ${getScoreColor(athlete.ergScore)}`}>
                {formatScore(athlete.ergScore)}
              </div>
              {breakdown.erg && (
                <div className="mt-2 text-xs text-text-secondary space-y-1">
                  {breakdown.erg.test2k && (
                    <div>2k: {breakdown.erg.test2k}</div>
                  )}
                  {breakdown.erg.wattPerKg && (
                    <div>W/kg: {breakdown.erg.wattPerKg.toFixed(2)}</div>
                  )}
                  {breakdown.erg.percentile && (
                    <div>Percentile: {breakdown.erg.percentile}%</div>
                  )}
                </div>
              )}
            </div>

            {/* Elo Score */}
            <div className={`p-4 rounded-lg border ${getScoreBgColor(athlete.eloScore)}`}>
              <div className="text-xs uppercase tracking-wider text-text-muted mb-1">
                Elo Score
              </div>
              <div className={`text-2xl font-bold ${getScoreColor(athlete.eloScore)}`}>
                {formatScore(athlete.eloScore)}
              </div>
              {breakdown.elo && (
                <div className="mt-2 text-xs text-text-secondary space-y-1">
                  {breakdown.elo.rating && (
                    <div>Rating: {Math.round(breakdown.elo.rating)}</div>
                  )}
                  {breakdown.elo.racesCompleted !== undefined && (
                    <div>Races: {breakdown.elo.racesCompleted}</div>
                  )}
                  {breakdown.elo.winRate !== undefined && (
                    <div>Win Rate: {(breakdown.elo.winRate * 100).toFixed(0)}%</div>
                  )}
                </div>
              )}
            </div>

            {/* Tech Score */}
            <div className={`p-4 rounded-lg border ${getScoreBgColor(athlete.techScore)}`}>
              <div className="text-xs uppercase tracking-wider text-text-muted mb-1">
                Telemetry Score
              </div>
              <div className={`text-2xl font-bold ${getScoreColor(athlete.techScore)}`}>
                {formatScore(athlete.techScore)}
              </div>
              {breakdown.tech && (
                <div className="mt-2 text-xs text-text-secondary space-y-1">
                  {breakdown.tech.catchAngle !== undefined && (
                    <div>Catch Angle: {breakdown.tech.catchAngle.toFixed(1)}</div>
                  )}
                  {breakdown.tech.consistency !== undefined && (
                    <div>Consistency: {(breakdown.tech.consistency * 100).toFixed(0)}%</div>
                  )}
                  {breakdown.tech.samples !== undefined && (
                    <div>Samples: {breakdown.tech.samples}</div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Weights Info */}
          {breakdown.weights && (
            <div className="text-xs text-text-muted pt-2 border-t border-white/[0.06]">
              Weights: Erg {(breakdown.weights.erg * 100).toFixed(0)}% |
              Elo {(breakdown.weights.elo * 100).toFixed(0)}% |
              Tech {(breakdown.weights.tech * 100).toFixed(0)}%
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}

/**
 * CombinedRankings Component
 * Redesigned with Precision Instrument design system
 */
export default function CombinedRankings() {
  const { rankings, loading, error, fetchRankings, recalculateTeam, clearError } = useCombinedScoringStore();
  const { activeTeamRole } = useAuthStore();

  const [expandedId, setExpandedId] = useState(null);
  const [recalculating, setRecalculating] = useState(false);

  const canRecalculate = activeTeamRole === 'COACH' || activeTeamRole === 'OWNER';

  useEffect(() => {
    fetchRankings().catch(err => {
      console.error('Failed to fetch rankings:', err);
      // Error is already handled by the store's error state
    });
  }, [fetchRankings]);

  const handleRecalculate = useCallback(async () => {
    setRecalculating(true);
    try {
      await recalculateTeam();
      await fetchRankings();
    } catch (err) {
      console.error('Recalculation failed:', err);
    } finally {
      setRecalculating(false);
    }
  }, [recalculateTeam, fetchRankings]);

  const handleRowClick = useCallback((athleteId) => {
    setExpandedId((prev) => (prev === athleteId ? null : athleteId));
  }, []);

  const handleKeyDown = useCallback((e, athleteId) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleRowClick(athleteId);
    }
  }, [handleRowClick]);

  const getRankStyle = (rank) => {
    if (rank <= 3) return 'text-warning-orange font-bold';
    return 'text-text-secondary';
  };

  // Loading state
  if (loading && rankings.length === 0) {
    return (
      <SpotlightCard>
        <div className="p-6 border-b border-white/[0.06]">
          <h2 className="text-lg font-semibold text-text-primary">Combined Rankings</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full" aria-label="Combined rankings loading">
            <thead>
              <tr className="bg-void-deep/50 border-b border-white/[0.06]">
                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider w-12">
                  #
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                  Athlete
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider w-24">
                  Combined
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-text-muted uppercase tracking-wider w-20 hidden sm:table-cell">
                  Erg
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-text-muted uppercase tracking-wider w-20 hidden md:table-cell">
                  Elo
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-text-muted uppercase tracking-wider w-20 hidden lg:table-cell">
                  Tech
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-text-muted uppercase tracking-wider w-24">
                  Confidence
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {[...Array(5)].map((_, i) => (
                <SkeletonRow key={i} />
              ))}
            </tbody>
          </table>
        </div>
      </SpotlightCard>
    );
  }

  return (
    <SpotlightCard>
      {/* Header */}
      <div className="p-6 border-b border-white/[0.06]">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">Combined Rankings</h2>
            <p className="text-sm text-text-secondary mt-1">
              Athlete rankings based on erg, seat racing, and telemetry scores
            </p>
          </div>
          {canRecalculate && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleRecalculate}
              disabled={recalculating || loading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blade-blue text-void-deep font-medium text-sm transition-all duration-150 ease-out hover:shadow-[0_0_20px_rgba(0,112,243,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {recalculating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Recalculate
            </motion.button>
          )}
        </div>
      </div>

      {/* Error display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mx-6 mt-4 p-3 bg-danger-red/10 border border-danger-red/20 rounded-lg flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-danger-red" />
              <p className="text-sm text-danger-red">{error}</p>
            </div>
            <button
              onClick={clearError}
              className="text-danger-red hover:text-danger-red/80 transition-colors"
              aria-label="Dismiss error"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state */}
      {rankings.length === 0 && !loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-center px-4">
          <div className="w-16 h-16 mb-4 rounded-2xl bg-void-elevated border border-white/[0.06] flex items-center justify-center">
            <BarChart3 className="w-8 h-8 text-text-muted" />
          </div>
          <p className="text-text-primary font-medium mb-2">No Rankings Available</p>
          <p className="text-text-secondary text-sm max-w-md mb-6">
            Add erg test data, complete seat races, or import telemetry data to generate combined athlete rankings.
          </p>
          {canRecalculate && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleRecalculate}
              disabled={recalculating}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blade-blue text-void-deep font-medium text-sm transition-all duration-150 ease-out hover:shadow-[0_0_20px_rgba(0,112,243,0.3)] disabled:opacity-50"
            >
              {recalculating && <Loader2 className="w-4 h-4 animate-spin" />}
              Generate Rankings
            </motion.button>
          )}
        </div>
      ) : (
        /* Rankings Table */
        <div className="overflow-x-auto">
          <table className="w-full" aria-label="Combined athlete rankings">
            <thead>
              <tr className="bg-void-deep/50 border-b border-white/[0.06]">
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider w-12"
                >
                  #
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider"
                >
                  Athlete
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider w-24"
                >
                  Combined
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-center text-xs font-medium text-text-muted uppercase tracking-wider w-20 hidden sm:table-cell"
                >
                  Erg
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-center text-xs font-medium text-text-muted uppercase tracking-wider w-20 hidden md:table-cell"
                >
                  Elo
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-center text-xs font-medium text-text-muted uppercase tracking-wider w-20 hidden lg:table-cell"
                >
                  Tech
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-center text-xs font-medium text-text-muted uppercase tracking-wider w-24"
                >
                  Confidence
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {rankings.map((athlete, index) => {
                const athleteId = athlete.athleteId || athlete.id;
                const isExpanded = expandedId === athleteId;
                const rank = athlete.rank || index + 1;

                return (
                  <React.Fragment key={athleteId}>
                    <tr
                      onClick={() => handleRowClick(athleteId)}
                      onKeyDown={(e) => handleKeyDown(e, athleteId)}
                      tabIndex={0}
                      role="button"
                      aria-expanded={isExpanded}
                      className={`
                        cursor-pointer transition-colors duration-200
                        hover:bg-white/[0.02]
                        focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blade-blue/30
                        ${isExpanded ? 'bg-void-deep/50' : ''}
                      `}
                    >
                      {/* Rank */}
                      <td className="px-4 py-4">
                        <span className={`text-sm font-mono ${getRankStyle(rank)}`}>
                          {rank}
                        </span>
                      </td>

                      {/* Athlete Name */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-text-primary">
                            {athlete.name || athlete.athleteName || 'Unknown'}
                          </span>
                          <ChevronDown
                            className={`w-4 h-4 text-text-muted transition-transform duration-200 ${
                              isExpanded ? 'rotate-180' : ''
                            }`}
                          />
                        </div>
                      </td>

                      {/* Combined Score */}
                      <td className="px-4 py-4">
                        <span
                          className={`text-lg font-bold ${getScoreColor(athlete.combinedScore)}`}
                        >
                          {formatScore(athlete.combinedScore)}
                        </span>
                      </td>

                      {/* Erg Score */}
                      <td className="px-4 py-4 text-center hidden sm:table-cell">
                        <span className={`text-sm ${getScoreColor(athlete.ergScore)}`}>
                          {formatScore(athlete.ergScore)}
                        </span>
                      </td>

                      {/* Elo Score */}
                      <td className="px-4 py-4 text-center hidden md:table-cell">
                        <span className={`text-sm ${getScoreColor(athlete.eloScore)}`}>
                          {formatScore(athlete.eloScore)}
                        </span>
                      </td>

                      {/* Tech Score */}
                      <td className="px-4 py-4 text-center hidden lg:table-cell">
                        <span className={`text-sm ${getScoreColor(athlete.techScore)}`}>
                          {formatScore(athlete.techScore)}
                        </span>
                      </td>

                      {/* Confidence */}
                      <td className="px-4 py-4 text-center">
                        <ConfidenceBadge confidence={athlete.confidence} />
                      </td>
                    </tr>

                    {/* Expanded Detail Row */}
                    {isExpanded && (
                      <DetailRow
                        athlete={athlete}
                        onClose={() => setExpandedId(null)}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer with legend */}
      {rankings.length > 0 && (
        <div className="px-6 py-4 border-t border-white/[0.06] bg-void-deep/30">
          <div className="flex flex-wrap items-center gap-4 text-xs text-text-muted">
            <span>Score Legend:</span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blade-blue" />
              80+ Excellent
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-warning-orange" />
              60-79 Good
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-danger-red" />
              &lt;60 Developing
            </span>
            <span className="ml-auto text-text-secondary">
              Click row to expand details
            </span>
          </div>
        </div>
      )}
    </SpotlightCard>
  );
}
