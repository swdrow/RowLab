import { useState, useMemo } from 'react';
import { AnimatePresence, LayoutGroup } from 'framer-motion';
import { TrendingUp } from 'lucide-react';
import type { RankingSource } from '../../types/regatta';
import { useBoatClassRankings } from '../../hooks/useTeamRankings';
import { getBoatClasses } from '../../utils/marginCalculations';
import { RankingRow } from './RankingRow';

type RankingsViewProps = {
  onSelectTeam?: (teamName: string, boatClass: string) => void;
};

const SOURCE_BADGES: Record<RankingSource, { label: string; color: string }> = {
  row2k: { label: 'Row2k', color: 'bg-data-good/10 text-data-good' },
  usrowing: { label: 'USRowing', color: 'bg-data-poor/10 text-data-poor' },
  regattacentral: { label: 'RegattaCentral', color: 'bg-chart-2/10 text-chart-2' },
  manual: { label: 'Manual', color: 'bg-ink-muted/10 text-txt-tertiary' },
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
    return rankings.find((r) => r.teamName === 'Our Team'); // Replace with actual team name lookup
  }, [rankings]);

  return (
    <div className="space-y-6">
      {/* Boat class selector */}
      <div>
        <label className="block text-sm font-medium text-txt-secondary mb-2">
          Select Boat Class
        </label>
        <div className="flex flex-wrap gap-2">
          {boatClasses.map((bc) => (
            <button
              key={bc.value}
              onClick={() => setSelectedBoatClass(bc.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                selectedBoatClass === bc.value
                  ? 'bg-accent-primary text-white'
                  : 'bg-surface-elevated text-txt-secondary hover:bg-surface-hover'
              }`}
            >
              {bc.label}
            </button>
          ))}
        </div>
      </div>

      {/* Rankings table */}
      {selectedBoatClass && (
        <div className="bg-surface-elevated rounded-xl border border-bdr-default overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-bdr-default flex items-center justify-between">
            <h3 className="font-semibold text-txt-primary">
              {boatClasses.find((bc) => bc.value === selectedBoatClass)?.label} Rankings
            </h3>
            {ourRanking && (
              <div className="flex items-center gap-2">
                <Medal className="w-4 h-4 text-accent-primary" />
                <span className="text-sm font-medium text-txt-primary">
                  Ranked #{ourRanking.rank}
                </span>
              </div>
            )}
          </div>

          {loadingRankings ? (
            <div className="p-8 text-center">
              <div className="w-6 h-6 border-2 border-accent-primary border-t-transparent rounded-full animate-spin mx-auto" />
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
                      previousRank={team.previousRank}
                      sampleCount={team.sampleCount}
                      lastUpdated={team.lastCalculatedAt}
                      isOwnTeam={team.teamName === 'Our Team'} // Replace with actual check
                      onClick={() => onSelectTeam?.(team.teamName || '', selectedBoatClass!)}
                      {...(index < 20 ? {} : { layout: false })} // Performance optimization: only animate top 20
                    />
                  ))}
                </div>
              </AnimatePresence>
            </LayoutGroup>
          ) : (
            <div className="p-8 text-center text-txt-secondary">
              <TrendingUp className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p>No rankings data for this boat class</p>
              <p className="text-sm text-txt-tertiary mt-1">
                Add race results to generate rankings
              </p>
            </div>
          )}
        </div>
      )}

      {/* Confidence legend */}
      {selectedBoatClass && rankings && rankings.length > 0 && (
        <div className="flex items-center gap-6 text-xs text-txt-tertiary">
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-data-excellent" />
            High confidence (10+ races)
          </span>
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-data-warning" />
            Medium (5-9 races)
          </span>
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-data-poor" />
            Low (&lt;5 races)
          </span>
        </div>
      )}
    </div>
  );
}

// RankingRow component now imported from ./RankingRow.tsx

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
    <span className="text-xs text-txt-tertiary" title={format(parseISO(date), 'PPp')}>
      Updated {age} ago
    </span>
  );
}
