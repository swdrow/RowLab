import { useState, useMemo } from 'react';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { TrendingUp, Medal, Trophy, Award } from 'lucide-react';
import type { RankingSource } from '../../types/regatta';
import { useBoatClassRankings } from '../../hooks/useTeamRankings';
import { getBoatClasses } from '../../utils/marginCalculations';

type RankingsViewProps = {
  onSelectTeam?: (teamName: string, boatClass: string) => void;
};

const SOURCE_BADGES: Record<RankingSource, { label: string; color: string }> = {
  row2k: { label: 'Row2k', color: 'bg-blue-500/10 text-blue-600' },
  usrowing: { label: 'USRowing', color: 'bg-red-500/10 text-red-600' },
  regattacentral: { label: 'RegattaCentral', color: 'bg-purple-500/10 text-purple-600' },
  manual: { label: 'Manual', color: 'bg-gray-500/10 text-gray-600' },
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
    return rankings.find(r => r.teamName === 'Our Team'); // Replace with actual team name lookup
  }, [rankings]);

  return (
    <div className="space-y-6">
      {/* Boat class selector */}
      <div>
        <label className="block text-sm font-medium text-txt-secondary mb-2">
          Select Boat Class
        </label>
        <div className="flex flex-wrap gap-2">
          {boatClasses.map(bc => (
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
              {boatClasses.find(bc => bc.value === selectedBoatClass)?.label} Rankings
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
            <div className="divide-y divide-bdr-subtle">
              {rankings.map((team, index) => (
                <RankingRow
                  key={`${team.teamId}-${team.boatClass}`}
                  rank={team.rank || index + 1}
                  teamName={team.teamName || 'Unknown'}
                  speed={team.adjustedSpeed}
                  sampleCount={team.sampleCount}
                  lastUpdated={team.lastCalculatedAt}
                  isOwnTeam={team.teamName === 'Our Team'} // Replace with actual check
                  onClick={() => onSelectTeam?.(team.teamName || '', selectedBoatClass!)}
                />
              ))}
            </div>
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
            <div className="w-2 h-2 rounded-full bg-green-500" />
            High confidence (10+ races)
          </span>
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            Medium (5-9 races)
          </span>
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            Low (&lt;5 races)
          </span>
        </div>
      )}
    </div>
  );
}

// Individual ranking row
function RankingRow({
  rank,
  teamName,
  speed,
  sampleCount,
  lastUpdated,
  isOwnTeam,
  onClick,
}: {
  rank: number;
  teamName: string;
  speed: number | null;
  sampleCount: number;
  lastUpdated: string;
  isOwnTeam: boolean;
  onClick?: () => void;
}) {
  // Confidence color
  const getConfidenceColor = () => {
    if (sampleCount >= 10) return 'bg-green-500';
    if (sampleCount >= 5) return 'bg-amber-500';
    return 'bg-red-500';
  };

  // Rank badge
  const RankBadge = () => {
    if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
    if (rank === 3) return <Award className="w-5 h-5 text-amber-600" />;
    return <span className="text-lg font-bold text-txt-tertiary">{rank}</span>;
  };

  return (
    <div
      className={`flex items-center gap-4 px-4 py-3 hover:bg-surface-hover transition-colors cursor-pointer ${
        isOwnTeam ? 'bg-accent-primary/5' : ''
      }`}
      onClick={onClick}
    >
      {/* Rank */}
      <div className="w-8 flex justify-center">
        <RankBadge />
      </div>

      {/* Team name */}
      <div className="flex-1 min-w-0">
        <p className={`font-medium truncate ${isOwnTeam ? 'text-accent-primary' : 'text-txt-primary'}`}>
          {teamName}
          {isOwnTeam && <span className="text-xs ml-2">(Your Team)</span>}
        </p>
      </div>

      {/* Speed estimate */}
      {speed && (
        <div className="text-right">
          <p className="text-sm font-mono text-txt-primary">
            {speed.toFixed(3)} m/s
          </p>
        </div>
      )}

      {/* Confidence indicator */}
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${getConfidenceColor()}`} />
        <span className="text-xs text-txt-tertiary w-16">
          {sampleCount} races
        </span>
      </div>

      {/* Last updated */}
      <div className="text-xs text-txt-tertiary w-24 text-right" title={format(parseISO(lastUpdated), 'PPp')}>
        {formatDistanceToNow(parseISO(lastUpdated), { addSuffix: true })}
      </div>
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
    <span className="text-xs text-txt-tertiary" title={format(parseISO(date), 'PPp')}>
      Updated {age} ago
    </span>
  );
}
