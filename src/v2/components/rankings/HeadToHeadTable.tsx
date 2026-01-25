import { format, parseISO } from 'date-fns';
import { TrendingUp, TrendingDown, Minus, Trophy, Medal } from 'lucide-react';
import { useHeadToHead } from '../../hooks/useTeamRankings';

type HeadToHeadTableProps = {
  opponent: string;
  boatClass: string;
  season?: string;
};

export function HeadToHeadTable({ opponent, boatClass, season }: HeadToHeadTableProps) {
  const { data: comparison, isLoading, error } = useHeadToHead(opponent, boatClass, season);

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="w-6 h-6 border-2 border-accent-primary border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  if (error || !comparison) {
    return (
      <div className="p-8 text-center text-txt-secondary">
        <p>Unable to load head-to-head data</p>
      </div>
    );
  }

  const record = `${comparison.wins}-${comparison.losses}`;
  const isWinning = comparison.wins > comparison.losses;
  const isTied = comparison.wins === comparison.losses;

  return (
    <div className="space-y-4">
      {/* Record summary */}
      <div className="flex items-center justify-between p-4 bg-surface-elevated rounded-lg">
        <div className="flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center ${
              isWinning
                ? 'bg-green-500/10'
                : isTied
                ? 'bg-amber-500/10'
                : 'bg-red-500/10'
            }`}
          >
            {isWinning ? (
              <TrendingUp className="w-6 h-6 text-green-500" />
            ) : isTied ? (
              <Minus className="w-6 h-6 text-amber-500" />
            ) : (
              <TrendingDown className="w-6 h-6 text-red-500" />
            )}
          </div>
          <div>
            <p className="text-sm text-txt-secondary">vs {comparison.opponent}</p>
            <p className="text-2xl font-bold text-txt-primary">{record}</p>
          </div>
        </div>

        <div className="text-right">
          <p className="text-sm text-txt-secondary">{boatClass}</p>
          <p className="text-xs text-txt-tertiary">
            {comparison.races.length} race{comparison.races.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Race history */}
      {comparison.races.length > 0 && (
        <div className="border border-bdr-default rounded-lg overflow-hidden">
          <div className="px-4 py-2 bg-surface-elevated border-b border-bdr-default">
            <h4 className="text-sm font-medium text-txt-primary">Race History</h4>
          </div>
          <div className="divide-y divide-bdr-subtle">
            {comparison.races.map((race, i) => {
              const didWin = race.ownPlace < race.opponentPlace;
              const didTie = race.ownPlace === race.opponentPlace;

              return (
                <div key={i} className="flex items-center gap-4 px-4 py-3">
                  {/* Result indicator */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      didWin
                        ? 'bg-green-500/10'
                        : didTie
                        ? 'bg-amber-500/10'
                        : 'bg-red-500/10'
                    }`}
                  >
                    {didWin ? (
                      <Trophy className="w-4 h-4 text-green-500" />
                    ) : didTie ? (
                      <Minus className="w-4 h-4 text-amber-500" />
                    ) : (
                      <Medal className="w-4 h-4 text-red-500" />
                    )}
                  </div>

                  {/* Race info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-txt-primary truncate">{race.regattaName}</p>
                    <p className="text-xs text-txt-tertiary">
                      {format(parseISO(race.date), 'MMM d, yyyy')}
                    </p>
                  </div>

                  {/* Places */}
                  <div className="text-sm">
                    <span className={`font-medium ${didWin ? 'text-green-500' : 'text-txt-primary'}`}>
                      {race.ownPlace}{getOrdinal(race.ownPlace)}
                    </span>
                    <span className="text-txt-tertiary mx-1">vs</span>
                    <span className="text-txt-primary">
                      {race.opponentPlace}{getOrdinal(race.opponentPlace)}
                    </span>
                  </div>

                  {/* Margin */}
                  {race.margin !== null && (
                    <div className="text-xs">
                      {race.margin > 0 ? (
                        <span className="text-green-500">+{race.margin.toFixed(1)}s</span>
                      ) : (
                        <span className="text-red-500">{race.margin.toFixed(1)}s</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function getOrdinal(n: number): string {
  const s: string[] = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] ?? s[v] ?? s[0] ?? 'th';
}

// Compact version for quick comparison
export function HeadToHeadSummary({ opponent, boatClass }: { opponent: string; boatClass: string }) {
  const { data: comparison } = useHeadToHead(opponent, boatClass);

  if (!comparison) return null;

  const isWinning = comparison.wins > comparison.losses;

  return (
    <div className="flex items-center gap-2">
      {isWinning ? (
        <TrendingUp className="w-4 h-4 text-green-500" />
      ) : comparison.wins === comparison.losses ? (
        <Minus className="w-4 h-4 text-amber-500" />
      ) : (
        <TrendingDown className="w-4 h-4 text-red-500" />
      )}
      <span className="text-sm font-medium">
        {comparison.wins}-{comparison.losses}
      </span>
      <span className="text-xs text-txt-tertiary">vs {opponent}</span>
    </div>
  );
}
