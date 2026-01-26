import { useState, useMemo } from 'react';
import { CaretRight, CaretDown } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCompositeRankings } from '../../hooks/useCompositeRankings';
import { WeightProfileSelector } from './WeightProfileSelector';
import { RankingBreakdown } from './RankingBreakdown';
import type { CompositeRanking } from '../../types/advancedRanking';

interface CompositeRankingsProps {
  onAthleteClick?: (athleteId: string) => void;
}

export function CompositeRankings({ onAthleteClick }: CompositeRankingsProps) {
  const [profileId, setProfileId] = useState('balanced');
  const [customWeights, setCustomWeights] = useState<{ onWater: number; erg: number; attendance: number } | undefined>();
  const [expandedAthleteId, setExpandedAthleteId] = useState<string | null>(null);

  const { rankings, profile, isLoading, error, calculatedAt } = useCompositeRankings(
    profileId,
    profileId === 'custom' ? customWeights : undefined
  );

  const toggleExpanded = (athleteId: string) => {
    setExpandedAthleteId(prev => prev === athleteId ? null : athleteId);
  };

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
        Failed to load composite rankings: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <WeightProfileSelector
          selectedProfileId={profileId}
          customWeights={customWeights}
          onProfileChange={setProfileId}
          onCustomWeightsChange={setCustomWeights}
        />

        {calculatedAt && (
          <span className="text-xs text-txt-secondary">
            Updated: {new Date(calculatedAt).toLocaleTimeString()}
          </span>
        )}
      </div>

      {/* Rankings table */}
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-surface-secondary animate-pulse rounded-lg" />
          ))}
        </div>
      ) : rankings.length === 0 ? (
        <div className="text-center py-12 text-txt-secondary">
          No ranking data available. Run some seat races or log erg tests to see rankings.
        </div>
      ) : (
        <div className="space-y-1">
          {/* Header */}
          <div className="grid grid-cols-12 gap-2 px-4 py-2 text-xs font-medium text-txt-secondary uppercase tracking-wider">
            <div className="col-span-1">Rank</div>
            <div className="col-span-4">Athlete</div>
            <div className="col-span-2 text-right">Score</div>
            <div className="col-span-4">Breakdown</div>
            <div className="col-span-1"></div>
          </div>

          {/* Rows */}
          {rankings.map((ranking) => (
            <RankingRow
              key={ranking.athleteId}
              ranking={ranking}
              isExpanded={expandedAthleteId === ranking.athleteId}
              onToggle={() => toggleExpanded(ranking.athleteId)}
              onClick={() => onAthleteClick?.(ranking.athleteId)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// RANKING ROW
// ============================================

interface RankingRowProps {
  ranking: CompositeRanking;
  isExpanded: boolean;
  onToggle: () => void;
  onClick?: () => void;
}

function RankingRow({ ranking, isExpanded, onToggle, onClick }: RankingRowProps) {
  const { rank, athlete, compositeScore, breakdown, overallConfidence } = ranking;

  return (
    <div className="bg-surface-secondary rounded-lg overflow-hidden">
      {/* Main row */}
      <div
        className="grid grid-cols-12 gap-2 px-4 py-3 items-center hover:bg-surface-hover transition-colors cursor-pointer"
        onClick={onToggle}
      >
        {/* Rank */}
        <div className="col-span-1">
          <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
            rank === 1 ? 'bg-amber-100 text-amber-700' :
            rank === 2 ? 'bg-gray-100 text-gray-700' :
            rank === 3 ? 'bg-orange-100 text-orange-700' :
            'bg-surface-primary text-txt-secondary'
          }`}>
            {rank}
          </span>
        </div>

        {/* Athlete */}
        <div className="col-span-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClick?.();
            }}
            className="text-left hover:text-accent-primary"
          >
            <div className="flex items-center gap-2">
              {athlete.side && (
                <span className={`w-2 h-2 rounded-full ${
                  athlete.side === 'Port' ? 'bg-red-500' :
                  athlete.side === 'Starboard' ? 'bg-green-500' :
                  'bg-blue-500'
                }`} />
              )}
              <span className="font-medium text-txt-primary">
                {athlete.firstName} {athlete.lastName}
              </span>
            </div>
          </button>
        </div>

        {/* Score */}
        <div className="col-span-2 text-right">
          <span className="text-lg font-bold text-txt-primary">
            {(compositeScore * 100).toFixed(1)}
          </span>
          <span className={`ml-2 text-xs ${
            overallConfidence >= 0.7 ? 'text-green-600' :
            overallConfidence >= 0.4 ? 'text-amber-600' :
            'text-red-600'
          }`}>
            {overallConfidence >= 0.7 ? 'H' :
             overallConfidence >= 0.4 ? 'M' :
             'L'}
          </span>
        </div>

        {/* Compact breakdown */}
        <div className="col-span-4">
          <RankingBreakdown breakdown={breakdown} compositeScore={compositeScore} expanded={false} />
        </div>

        {/* Expand icon */}
        <div className="col-span-1 flex justify-end">
          {isExpanded ? (
            <CaretDown size={20} className="text-txt-secondary" />
          ) : (
            <CaretRight size={20} className="text-txt-secondary" />
          )}
        </div>
      </div>

      {/* Expanded breakdown */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4">
              <RankingBreakdown breakdown={breakdown} compositeScore={compositeScore} expanded={true} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default CompositeRankings;
