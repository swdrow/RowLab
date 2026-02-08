import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Info } from '@phosphor-icons/react';
import { useBradleyTerryRankings } from '../../hooks/useAdvancedRankings';
import type { BradleyTerryStrength } from '../../types/advancedRanking';

interface BradleyTerryRankingsProps {
  onAthleteClick?: (athleteId: string) => void;
  showMethodology?: boolean;
}

export function BradleyTerryRankings({
  onAthleteClick,
  showMethodology = false,
}: BradleyTerryRankingsProps) {
  const [showDetails, setShowDetails] = useState(showMethodology);
  const { athletes, modelStats, convergence, isLoading, error } = useBradleyTerryRankings();

  // Calculate max strength for scaling
  const maxStrength = useMemo(() => {
    if (athletes.length === 0) return 1;
    return Math.max(...athletes.map((a) => a.confidenceInterval?.[1] || a.strength));
  }, [athletes]);

  // Get CSS variable colors for theme awareness
  const chartColors = useMemo(
    () => ({
      excellent: getComputedStyle(document.documentElement)
        .getPropertyValue('--data-excellent')
        .trim(),
      good: getComputedStyle(document.documentElement).getPropertyValue('--data-good').trim(),
      warning: getComputedStyle(document.documentElement).getPropertyValue('--data-warning').trim(),
      poor: getComputedStyle(document.documentElement).getPropertyValue('--data-poor').trim(),
    }),
    []
  );

  if (error) {
    return (
      <div className="p-4 bg-bg-surface border border-bdr-default rounded-lg text-txt-primary">
        <span style={{ color: chartColors.poor }}>
          Failed to load Bradley-Terry rankings: {error.message}
        </span>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 bg-bg-surface animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (athletes.length === 0) {
    return (
      <div className="text-center py-12 text-txt-secondary">
        <p>No seat race data available for Bradley-Terry analysis.</p>
        <p className="text-sm mt-2">
          Run at least one seat race session with results to see rankings.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Model statistics */}
      <div className="flex items-center justify-between flex-wrap gap-4 p-3 bg-bg-surface rounded-lg">
        <div className="flex items-center gap-6 text-sm text-txt-secondary">
          <span>
            <span className="font-medium text-txt-primary">{modelStats?.athleteCount || 0}</span>{' '}
            athletes
          </span>
          <span>
            <span className="font-medium text-txt-primary">
              {modelStats?.totalComparisons || 0}
            </span>{' '}
            comparisons
          </span>
          <span>
            Coverage:{' '}
            <span
              className="font-medium"
              style={{
                color:
                  (modelStats?.graphConnectivity || 0) >= 0.8
                    ? chartColors.excellent
                    : (modelStats?.graphConnectivity || 0) >= 0.5
                      ? chartColors.warning
                      : chartColors.poor,
              }}
            >
              {((modelStats?.graphConnectivity || 0) * 100).toFixed(0)}%
            </span>
          </span>
        </div>

        <button
          onClick={() => setShowDetails(!showDetails)}
          className="flex items-center gap-1 text-sm text-txt-primary hover:underline"
          style={{ color: chartColors.good }}
        >
          <Info size={16} />
          {showDetails ? 'Hide methodology' : 'Show methodology'}
        </button>
      </div>

      {/* Methodology explanation */}
      {showDetails && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          transition={{ duration: 0.3, ease: 'ease-out' }}
          className="p-4 bg-bg-surface border border-bdr-default rounded-lg text-sm text-txt-primary"
        >
          <h4 className="font-semibold mb-2">Bradley-Terry Model</h4>
          <p className="mb-2">
            The Bradley-Terry model estimates athlete strength from pairwise comparisons using
            maximum likelihood estimation. Unlike ELO, it considers all historical data
            simultaneously, producing more stable rankings.
          </p>
          <ul className="list-disc ml-4 space-y-1">
            <li>
              <strong>Strength:</strong> Relative ability (higher = faster)
            </li>
            <li>
              <strong>Confidence interval:</strong> 95% range of true strength
            </li>
            <li>
              <strong>Gradient bands:</strong> Fade from opaque (center) to transparent (edges)
              shows uncertainty
            </li>
          </ul>
          {convergence && (
            <p className="mt-2 text-xs text-txt-secondary">
              Model converged in {convergence.iterations} iterations (log-likelihood:{' '}
              {convergence.logLikelihood?.toFixed(2)})
            </p>
          )}
        </motion.div>
      )}

      {/* Rankings with confidence intervals */}
      <div className="space-y-2">
        {athletes.map((athleteStrength, idx) => (
          <AthleteStrengthRow
            key={athleteStrength.athleteId}
            rank={idx + 1}
            athlete={athleteStrength}
            maxStrength={maxStrength}
            chartColors={chartColors}
            onClick={() => onAthleteClick?.(athleteStrength.athleteId)}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 text-xs text-txt-secondary pt-4 border-t border-bdr-default">
        <div className="flex items-center gap-2">
          <div className="w-8 h-2 rounded" style={{ backgroundColor: chartColors.good }} />
          <span>Strength estimate</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-1 rounded"
            style={{ backgroundColor: chartColors.good, opacity: 0.3 }}
          />
          <span>Gradient confidence band</span>
        </div>
      </div>
    </div>
  );
}

// ============================================
// ATHLETE ROW
// ============================================

interface AthleteStrengthRowProps {
  rank: number;
  athlete: BradleyTerryStrength & {
    athlete?: { firstName: string; lastName: string; side?: string };
  };
  maxStrength: number;
  chartColors: { excellent: string; good: string; warning: string; poor: string };
  onClick?: () => void;
}

function AthleteStrengthRow({
  rank,
  athlete,
  maxStrength,
  chartColors,
  onClick,
}: AthleteStrengthRowProps) {
  const { strength, stdError, confidenceInterval, comparisonsCount } = athlete;
  const name = athlete.athlete
    ? `${athlete.athlete.firstName} ${athlete.athlete.lastName}`
    : `Athlete ${athlete.athleteId.slice(0, 8)}`;
  const side = athlete.athlete?.side;

  // Calculate bar widths as percentages
  const strengthPercent = (strength / maxStrength) * 100;
  const ciLow = confidenceInterval
    ? (confidenceInterval[0] / maxStrength) * 100
    : strengthPercent - 5;
  const ciHigh = confidenceInterval
    ? (confidenceInterval[1] / maxStrength) * 100
    : strengthPercent + 5;

  // Generate unique gradient ID for this row
  const gradientId = `confidence-gradient-${athlete.athleteId}`;

  return (
    <div
      className="group p-3 bg-bg-surface rounded-lg hover:bg-bg-surface-elevated transition-colors cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-center gap-4">
        {/* Rank */}
        <span
          className="w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold"
          style={{
            backgroundColor:
              rank === 1
                ? chartColors.warning
                : rank === 2
                  ? 'rgba(163, 163, 163, 0.2)'
                  : rank === 3
                    ? 'rgba(249, 115, 22, 0.2)'
                    : 'var(--ink-raised)',
            color: rank <= 3 ? 'var(--ink-bright)' : 'var(--ink-secondary)',
          }}
        >
          {rank}
        </span>

        {/* Name */}
        <div className="w-40">
          <div className="flex items-center gap-2">
            {side && (
              <span
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor:
                    side === 'Port'
                      ? chartColors.poor
                      : side === 'Starboard'
                        ? chartColors.excellent
                        : chartColors.good,
                }}
              />
            )}
            <span className="font-medium text-txt-primary group-hover:opacity-80">{name}</span>
          </div>
          <span className="text-xs text-txt-secondary">{comparisonsCount} comparisons</span>
        </div>

        {/* Confidence interval visualization with gradient bands */}
        <div className="flex-1 relative h-8">
          {/* SVG for gradient definition */}
          <svg width="0" height="0" style={{ position: 'absolute' }}>
            <defs>
              <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={chartColors.good} stopOpacity="0.05" />
                <stop offset="30%" stopColor={chartColors.good} stopOpacity="0.3" />
                <stop offset="50%" stopColor={chartColors.good} stopOpacity="0.6" />
                <stop offset="70%" stopColor={chartColors.good} stopOpacity="0.3" />
                <stop offset="100%" stopColor={chartColors.good} stopOpacity="0.05" />
              </linearGradient>
            </defs>
          </svg>

          {/* Gradient confidence band (replaces whiskers) */}
          {confidenceInterval && (
            <motion.div
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ duration: 0.8, ease: 'easeInOut' }}
              className="absolute top-1/2 -translate-y-1/2 h-6 rounded"
              style={{
                left: `${Math.max(0, ciLow)}%`,
                width: `${Math.min(100, ciHigh) - Math.max(0, ciLow)}%`,
                background: `url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g"><stop offset="0%" stop-color="${encodeURIComponent(chartColors.good)}" stop-opacity="0.05"/><stop offset="30%" stop-color="${encodeURIComponent(chartColors.good)}" stop-opacity="0.3"/><stop offset="50%" stop-color="${encodeURIComponent(chartColors.good)}" stop-opacity="0.6"/><stop offset="70%" stop-color="${encodeURIComponent(chartColors.good)}" stop-opacity="0.3"/><stop offset="100%" stop-color="${encodeURIComponent(chartColors.good)}" stop-opacity="0.05"/></linearGradient></defs><rect width="100%" height="100%" fill="url(%23g)"/></svg>')`,
                transformOrigin: 'left center',
              }}
            />
          )}

          {/* Strength bar */}
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${strengthPercent}%` }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
            className="absolute top-1/2 -translate-y-1/2 h-3 rounded"
            style={{
              backgroundColor: chartColors.good,
              maxWidth: `${strengthPercent}%`,
            }}
          />
        </div>

        {/* Numeric value */}
        <div className="w-24 text-right">
          <span className="font-mono text-txt-primary">{strength.toFixed(2)}</span>
          <span className="text-xs text-txt-secondary ml-1">±{stdError?.toFixed(2) || '?'}</span>
        </div>
      </div>
    </div>
  );
}

export default BradleyTerryRankings;
