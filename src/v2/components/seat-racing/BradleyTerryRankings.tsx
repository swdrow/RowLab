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
  showMethodology = false
}: BradleyTerryRankingsProps) {
  const [showDetails, setShowDetails] = useState(showMethodology);
  const { athletes, modelStats, convergence, isLoading, error } = useBradleyTerryRankings();

  // Calculate max strength for scaling
  const maxStrength = useMemo(() => {
    if (athletes.length === 0) return 1;
    return Math.max(...athletes.map(a => a.confidenceInterval?.[1] || a.strength));
  }, [athletes]);

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
        Failed to load Bradley-Terry rankings: {error.message}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 bg-surface-secondary animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (athletes.length === 0) {
    return (
      <div className="text-center py-12 text-txt-secondary">
        <p>No seat race data available for Bradley-Terry analysis.</p>
        <p className="text-sm mt-2">Run at least one seat race session with results to see rankings.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Model statistics */}
      <div className="flex items-center justify-between flex-wrap gap-4 p-3 bg-surface-secondary rounded-lg">
        <div className="flex items-center gap-6 text-sm text-txt-secondary">
          <span>
            <span className="font-medium text-txt-primary">{modelStats?.athleteCount || 0}</span> athletes
          </span>
          <span>
            <span className="font-medium text-txt-primary">{modelStats?.totalComparisons || 0}</span> comparisons
          </span>
          <span>
            Coverage: <span className={`font-medium ${
              (modelStats?.graphConnectivity || 0) >= 0.8 ? 'text-green-600' :
              (modelStats?.graphConnectivity || 0) >= 0.5 ? 'text-amber-600' :
              'text-red-600'
            }`}>
              {((modelStats?.graphConnectivity || 0) * 100).toFixed(0)}%
            </span>
          </span>
        </div>

        <button
          onClick={() => setShowDetails(!showDetails)}
          className="flex items-center gap-1 text-sm text-accent-primary hover:underline"
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
          className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800"
        >
          <h4 className="font-semibold mb-2">Bradley-Terry Model</h4>
          <p className="mb-2">
            The Bradley-Terry model estimates athlete strength from pairwise comparisons using
            maximum likelihood estimation. Unlike ELO, it considers all historical data simultaneously,
            producing more stable rankings.
          </p>
          <ul className="list-disc ml-4 space-y-1">
            <li><strong>Strength:</strong> Relative ability (higher = faster)</li>
            <li><strong>Confidence interval:</strong> 95% range of true strength</li>
            <li><strong>Overlapping bars:</strong> Difference may not be statistically significant</li>
          </ul>
          {convergence && (
            <p className="mt-2 text-xs">
              Model converged in {convergence.iterations} iterations
              (log-likelihood: {convergence.logLikelihood?.toFixed(2)})
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
            onClick={() => onAthleteClick?.(athleteStrength.athleteId)}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 text-xs text-txt-secondary pt-4 border-t border-bdr-primary">
        <div className="flex items-center gap-2">
          <div className="w-8 h-2 bg-accent-primary rounded" />
          <span>Strength estimate</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-1 bg-accent-primary/30 rounded" />
          <span>95% confidence interval</span>
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
  athlete: BradleyTerryStrength & { athlete?: { firstName: string; lastName: string; side?: string } };
  maxStrength: number;
  onClick?: () => void;
}

function AthleteStrengthRow({ rank, athlete, maxStrength, onClick }: AthleteStrengthRowProps) {
  const { strength, stdError, confidenceInterval, comparisonsCount } = athlete;
  const name = athlete.athlete
    ? `${athlete.athlete.firstName} ${athlete.athlete.lastName}`
    : `Athlete ${athlete.athleteId.slice(0, 8)}`;
  const side = athlete.athlete?.side;

  // Calculate bar widths as percentages
  const strengthPercent = (strength / maxStrength) * 100;
  const ciLow = confidenceInterval ? (confidenceInterval[0] / maxStrength) * 100 : strengthPercent - 5;
  const ciHigh = confidenceInterval ? (confidenceInterval[1] / maxStrength) * 100 : strengthPercent + 5;

  return (
    <div
      className="group p-3 bg-surface-secondary rounded-lg hover:bg-surface-hover transition-colors cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-center gap-4">
        {/* Rank */}
        <span className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold ${
          rank === 1 ? 'bg-amber-100 text-amber-700' :
          rank === 2 ? 'bg-gray-100 text-gray-700' :
          rank === 3 ? 'bg-orange-100 text-orange-700' :
          'bg-surface-primary text-txt-secondary'
        }`}>
          {rank}
        </span>

        {/* Name */}
        <div className="w-40">
          <div className="flex items-center gap-2">
            {side && (
              <span className={`w-2 h-2 rounded-full ${
                side === 'Port' ? 'bg-red-500' :
                side === 'Starboard' ? 'bg-green-500' :
                'bg-blue-500'
              }`} />
            )}
            <span className="font-medium text-txt-primary group-hover:text-accent-primary">
              {name}
            </span>
          </div>
          <span className="text-xs text-txt-secondary">
            {comparisonsCount} comparisons
          </span>
        </div>

        {/* Confidence interval visualization */}
        <div className="flex-1 relative h-8">
          {/* CI bar (background) */}
          <div
            className="absolute top-1/2 -translate-y-1/2 h-2 bg-accent-primary/20 rounded"
            style={{
              left: `${Math.max(0, ciLow)}%`,
              width: `${Math.min(100, ciHigh) - Math.max(0, ciLow)}%`
            }}
          />

          {/* Strength point */}
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${strengthPercent}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="absolute top-1/2 -translate-y-1/2 h-4 bg-accent-primary rounded"
            style={{ maxWidth: `${strengthPercent}%` }}
          />

          {/* Error whiskers */}
          {confidenceInterval && (
            <>
              {/* Left whisker */}
              <div
                className="absolute top-1/2 -translate-y-1/2 w-0.5 h-3 bg-accent-primary/60"
                style={{ left: `${Math.max(0, ciLow)}%` }}
              />
              {/* Right whisker */}
              <div
                className="absolute top-1/2 -translate-y-1/2 w-0.5 h-3 bg-accent-primary/60"
                style={{ left: `${Math.min(100, ciHigh)}%` }}
              />
            </>
          )}
        </div>

        {/* Numeric value */}
        <div className="w-24 text-right">
          <span className="font-mono text-txt-primary">{strength.toFixed(2)}</span>
          <span className="text-xs text-txt-secondary ml-1">
            ±{stdError?.toFixed(2) || '?'}
          </span>
        </div>
      </div>
    </div>
  );
}

export default BradleyTerryRankings;
