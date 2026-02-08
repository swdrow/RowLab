import { useState, useMemo } from 'react';
import { AnimatePresence, LayoutGroup } from 'framer-motion';
import { TrendingUp, Medal } from 'lucide-react';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import type { RankingSource } from '../../types/regatta';
import { useBoatClassRankings } from '../../hooks/useTeamRankings';
import { getBoatClasses } from '../../utils/marginCalculations';
import { RankingRow } from './RankingRow';
import { RankingsSkeleton } from '../../features/regatta/components/RankingsSkeleton';

type RankingsViewProps = {
  onSelectTeam?: (teamName: string, boatClass: string) => void;
};

const SOURCE_BADGES: Record<RankingSource, { label: string; color: string }> = {
  row2k: { label: 'Row2k', color: 'bg-data-good/10 text-data-good' },
  usrowing: { label: 'USRowing', color: 'bg-data-poor/10 text-data-poor' },
  regattacentral: { label: 'RegattaCentral', color: 'bg-chart-2/10 text-chart-2' },
  manual: { label: 'Manual', color: 'bg-ink-muted/10 text-ink-tertiary' },
};

export function RankingsView({ onSelectTeam }: RankingsViewProps) {
  const [selectedBoatClass, setSelectedBoatClass] = useState<string | null>(null);
  const boatClasses = getBoatClasses();
  const { data: rankings, isLoading: loadingRankings } = useBoatClassRankings(
    selectedBoatClass || undefined
  );

  // Find our team in rankings
  const ourRanking = useMemo(() => {
    if (!rankings) return null;
    return rankings.find((r) => r.teamName === 'Our Team');
  }, [rankings]);

  return (
    <div className="space-y-6">
      {/* Boat class selector */}
      <div>
        <label className="block text-xs font-semibold text-ink-secondary uppercase tracking-[0.1em] mb-3">
          Select Boat Class
        </label>
        <div className="flex flex-wrap gap-2">
          {boatClasses.map((bc) => (
            <button
              key={bc.value}
              onClick={() => setSelectedBoatClass(bc.value)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150 ${
                selectedBoatClass === bc.value
                  ? 'bg-gradient-to-b from-accent-copper to-accent-copper-hover text-white shadow-glow-copper'
                  : 'bg-ink-well text-ink-secondary border border-ink-border hover:bg-ink-hover hover:text-ink-primary hover:border-accent-copper/20'
              }`}
            >
              {bc.label}
            </button>
          ))}
        </div>
      </div>

      {/* Rankings table */}
      {selectedBoatClass && (
        <div className="rounded-2xl bg-ink-raised overflow-hidden shadow-card border border-ink-border">
          {/* Header with copper accent */}
          <div className="relative px-5 py-4 border-b border-ink-border flex items-center justify-between">
            <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-accent-copper/50 to-transparent" />
            <h3 className="font-display font-semibold text-ink-bright text-lg">
              {boatClasses.find((bc) => bc.value === selectedBoatClass)?.label} Rankings
            </h3>
            {ourRanking && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent-copper/[0.10] ring-1 ring-accent-copper/25 shadow-glow-copper">
                <Medal className="w-4 h-4 text-accent-copper" />
                <span className="text-sm font-bold text-accent-copper tabular-nums">
                  Ranked #{ourRanking.rank}
                </span>
              </div>
            )}
          </div>

          {/* Table header row */}
          <div className="flex items-center gap-4 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-muted border-b border-ink-border bg-ink-deep/30">
            <div className="w-10 text-center">#</div>
            <div className="w-14">Trend</div>
            <div className="flex-1">Team</div>
            <div className="text-right w-24">Speed</div>
            <div className="w-20 text-center">Conf.</div>
            <div className="w-24 text-right">Updated</div>
          </div>

          {loadingRankings ? (
            <div className="p-4">
              <RankingsSkeleton />
            </div>
          ) : rankings && rankings.length > 0 ? (
            <LayoutGroup>
              <AnimatePresence initial={false}>
                <div>
                  {rankings.map((team, index) => (
                    <RankingRow
                      key={team.teamId || `${team.teamName}-${team.boatClass}`}
                      rank={team.rank || index + 1}
                      teamName={team.teamName || 'Unknown'}
                      speed={team.adjustedSpeed}
                      boatClass={selectedBoatClass}
                      previousRank={(team as any).previousRank}
                      sampleCount={team.sampleCount}
                      lastUpdated={team.lastCalculatedAt}
                      isOwnTeam={team.teamName === 'Our Team'}
                      onClick={() => onSelectTeam?.(team.teamName || '', selectedBoatClass!)}
                      {...(index < 20 ? {} : { layout: false })}
                    />
                  ))}
                </div>
              </AnimatePresence>
            </LayoutGroup>
          ) : (
            <div className="relative py-16 text-center overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-accent-copper/[0.03] to-transparent pointer-events-none" />
              <TrendingUp
                className="w-14 h-14 mx-auto mb-4 text-accent-copper/30"
                strokeWidth={1}
              />
              <p className="text-lg font-display font-semibold text-ink-primary">
                No rankings data for this boat class
              </p>
              <p className="text-sm text-ink-tertiary mt-1.5">
                Add race results to generate rankings
              </p>
            </div>
          )}
        </div>
      )}

      {/* Confidence legend */}
      {selectedBoatClass && rankings && rankings.length > 0 && (
        <div className="flex items-center gap-6 text-xs text-ink-tertiary px-1">
          <span className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-data-excellent shadow-[0_0_6px_rgba(34,197,94,0.4)]" />
            High confidence (10+ races)
          </span>
          <span className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-data-warning shadow-[0_0_6px_rgba(245,158,11,0.4)]" />
            Medium (5-9 races)
          </span>
          <span className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-data-poor shadow-[0_0_6px_rgba(239,68,68,0.4)]" />
            Low (&lt;5 races)
          </span>
        </div>
      )}
    </div>
  );
}

// Source badge component for external rankings
export function SourceBadge({ source }: { source: RankingSource }) {
  const badge = SOURCE_BADGES[source];
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge.color}`}>
      {badge.label}
    </span>
  );
}

// Age indicator
export function AgeIndicator({ date }: { date: string }) {
  const age = formatDistanceToNow(parseISO(date), { addSuffix: false });
  return (
    <span className="text-xs text-ink-tertiary" title={format(parseISO(date), 'PPp')}>
      Updated {age} ago
    </span>
  );
}
