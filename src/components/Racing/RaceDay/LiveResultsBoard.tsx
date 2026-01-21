import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy,
  Medal,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  Ship,
} from 'lucide-react';

interface RaceResult {
  id: number;
  teamName: string;
  isOwnTeam?: boolean;
  finishTimeSeconds: number | null;
  place: number | null;
  marginBackSeconds?: number | null;
  rawSpeed?: number | null;
}

interface Race {
  id: number;
  eventName: string;
  boatClass: string;
  distanceMeters: number;
  results?: RaceResult[];
}

interface LiveResultsBoardProps {
  /** Race to display results for */
  race: Race | null;
  /** Show full board or compact */
  variant?: 'full' | 'compact';
  /** Maximum results to show */
  maxDisplay?: number;
  /** Highlight own team */
  highlightOwnTeam?: boolean;
}

/**
 * LiveResultsBoard - Real-time race results display
 *
 * Precision Instrument design:
 * - Podium-style top 3 display
 * - Animated result updates
 * - Time and margin calculations
 * - Own team highlighting
 */
export function LiveResultsBoard({
  race,
  variant = 'full',
  maxDisplay = 10,
  highlightOwnTeam = true,
}: LiveResultsBoardProps) {
  // Sort and limit results
  const sortedResults = useMemo(() => {
    if (!race?.results) return [];
    return [...race.results]
      .sort((a, b) => (a.place ?? 999) - (b.place ?? 999))
      .slice(0, maxDisplay);
  }, [race?.results, maxDisplay]);

  // Format time display
  const formatTime = (seconds: number | null): string => {
    if (seconds === null) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toFixed(1).padStart(4, '0')}`;
  };

  // Format margin display
  const formatMargin = (seconds: number | null | undefined): string => {
    if (seconds === null || seconds === undefined || seconds === 0) return '';
    return `+${seconds.toFixed(1)}s`;
  };

  // Get placement styling
  const getPlaceStyle = (place: number | null) => {
    switch (place) {
      case 1:
        return {
          bg: 'bg-gradient-to-r from-warning-orange/20 to-warning-orange/10',
          border: 'border-warning-orange/40',
          text: 'text-warning-orange',
          icon: <Trophy className="w-4 h-4" />,
        };
      case 2:
        return {
          bg: 'bg-gradient-to-r from-text-muted/20 to-text-muted/10',
          border: 'border-text-muted/40',
          text: 'text-text-secondary',
          icon: <Medal className="w-4 h-4" />,
        };
      case 3:
        return {
          bg: 'bg-gradient-to-r from-warning-orange/10 to-transparent',
          border: 'border-warning-orange/20',
          text: 'text-warning-orange/70',
          icon: <Medal className="w-4 h-4" />,
        };
      default:
        return {
          bg: 'bg-void-surface/60',
          border: 'border-white/[0.06]',
          text: 'text-text-muted',
          icon: null,
        };
    }
  };

  if (!race) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-14 h-14 mb-4 rounded-2xl bg-void-elevated border border-white/[0.06] flex items-center justify-center">
          <Trophy className="w-7 h-7 text-text-muted" />
        </div>
        <p className="text-text-primary font-medium mb-1">No race selected</p>
        <p className="text-text-muted text-sm">Select a race to view results.</p>
      </div>
    );
  }

  if (sortedResults.length === 0) {
    return (
      <div className="rounded-xl bg-void-surface/60 border border-white/[0.06] p-6">
        {/* Race header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-blade-blue/10 border border-blade-blue/20 flex items-center justify-center">
            <Ship className="w-5 h-5 text-blade-blue" />
          </div>
          <div>
            <h3 className="font-medium text-text-primary">{race.eventName}</h3>
            <p className="text-xs text-text-muted">
              {race.boatClass} • {race.distanceMeters}m
            </p>
          </div>
        </div>

        {/* No results message */}
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Clock className="w-8 h-8 text-text-muted mb-3" />
          <p className="text-text-secondary font-medium mb-1">Waiting for results</p>
          <p className="text-text-muted text-sm">Results will appear here as they're entered.</p>
        </div>
      </div>
    );
  }

  const isCompact = variant === 'compact';

  return (
    <div className="rounded-xl bg-void-surface/60 border border-white/[0.06] overflow-hidden">
      {/* Race header */}
      <div className="flex items-center justify-between gap-3 p-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blade-blue/10 border border-blade-blue/20 flex items-center justify-center">
            <Ship className="w-5 h-5 text-blade-blue" />
          </div>
          <div>
            <h3 className="font-medium text-text-primary">{race.eventName}</h3>
            <p className="text-xs text-text-muted">
              {race.boatClass} • {race.distanceMeters}m • {sortedResults.length} results
            </p>
          </div>
        </div>
        {sortedResults.length > 0 && (
          <span className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider bg-success-green/10 text-success-green rounded-full border border-success-green/20">
            Final
          </span>
        )}
      </div>

      {/* Results table */}
      <div className="divide-y divide-white/[0.04]">
        <AnimatePresence mode="popLayout">
          {sortedResults.map((result, index) => {
            const style = getPlaceStyle(result.place);
            const isOwn = highlightOwnTeam && result.isOwnTeam;

            return (
              <motion.div
                key={result.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.03, ease: [0.2, 0.8, 0.2, 1] }}
                className={`
                  flex items-center gap-4 px-4 py-3 transition-colors
                  ${style.bg}
                  ${isOwn ? 'ring-1 ring-inset ring-blade-blue/40' : ''}
                `}
              >
                {/* Place */}
                <div className={`w-8 text-center font-bold ${style.text}`}>
                  {style.icon || (
                    <span className="text-lg">{result.place ?? '-'}</span>
                  )}
                </div>

                {/* Team name */}
                <div className="flex-1 min-w-0">
                  <p className={`font-medium truncate ${isOwn ? 'text-blade-blue' : 'text-text-primary'}`}>
                    {result.teamName}
                    {isOwn && (
                      <span className="ml-2 text-[10px] uppercase tracking-wider bg-blade-blue/20 text-blade-blue px-1.5 py-0.5 rounded">
                        You
                      </span>
                    )}
                  </p>
                </div>

                {/* Time */}
                <div className="text-right">
                  <p className="font-mono text-sm text-text-primary">
                    {formatTime(result.finishTimeSeconds)}
                  </p>
                  {!isCompact && result.marginBackSeconds !== null && result.marginBackSeconds !== undefined && result.marginBackSeconds > 0 && (
                    <p className="text-xs text-text-muted font-mono">
                      {formatMargin(result.marginBackSeconds)}
                    </p>
                  )}
                </div>

                {/* Speed (full variant only) */}
                {!isCompact && result.rawSpeed && (
                  <div className="w-16 text-right">
                    <p className="text-xs text-text-muted">
                      {result.rawSpeed.toFixed(2)} m/s
                    </p>
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Footer with stats */}
      {!isCompact && sortedResults.length > 0 && (
        <div className="px-4 py-3 bg-void-deep/50 border-t border-white/[0.06]">
          <div className="flex items-center justify-between text-xs text-text-muted">
            <span>
              Winning time: {formatTime(sortedResults[0]?.finishTimeSeconds ?? null)}
            </span>
            <span>
              Margin 1st-2nd:{' '}
              {sortedResults.length > 1
                ? formatMargin(sortedResults[1]?.marginBackSeconds)
                : 'N/A'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default LiveResultsBoard;
