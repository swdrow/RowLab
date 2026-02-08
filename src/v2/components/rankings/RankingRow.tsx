import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, Trophy, Medal, Award } from 'lucide-react';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { SPRING_CONFIG } from '../../utils/animations';
import { RankingTrendChart } from './RankingTrendChart';

export type RankingRowProps = {
  rank: number;
  teamName: string;
  speed: number | null;
  boatClass: string;
  previousRank?: number | null;
  sampleCount?: number;
  isHighlighted?: boolean;
  isOwnTeam?: boolean;
  trendData?: Array<{ date: string; speed: number }>;
  lastUpdated?: string;
  onClick?: () => void;
};

export function RankingRow({
  rank,
  teamName,
  speed,
  boatClass,
  previousRank,
  sampleCount = 0,
  isHighlighted = false,
  isOwnTeam = false,
  trendData,
  lastUpdated,
  onClick,
}: RankingRowProps) {
  // Calculate rank change
  const rankChange = previousRank ? previousRank - rank : 0;
  const hasImproved = rankChange > 0;
  const hasDropped = rankChange < 0;

  // Confidence color based on sample count
  const getConfidenceColor = () => {
    if (sampleCount >= 10) return 'bg-data-excellent';
    if (sampleCount >= 5) return 'bg-data-warning';
    return 'bg-data-poor';
  };

  // Rank badge for top 3
  const RankBadge = () => {
    if (rank === 1) return <Trophy className="w-5 h-5 text-data-warning" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-txt-tertiary" />;
    if (rank === 3) return <Award className="w-5 h-5 text-amber-600" />;
    return <span className="text-lg font-bold text-txt-tertiary tabular-nums">{rank}</span>;
  };

  return (
    <motion.div
      layout
      transition={SPRING_CONFIG}
      initial={isHighlighted ? { backgroundColor: 'rgba(245, 158, 11, 0.1)' } : false}
      animate={{ backgroundColor: 'rgba(0, 0, 0, 0)' }}
      className={`flex items-center gap-4 px-4 py-3 hover:bg-ink-hover transition-colors cursor-pointer border-b border-ink-border ${
        isOwnTeam ? 'bg-accent-copper/5' : ''
      }`}
      onClick={onClick}
    >
      {/* Rank */}
      <div className="w-10 flex justify-center flex-shrink-0">
        <RankBadge />
      </div>

      {/* Rank change indicator */}
      <div className="w-14 flex items-center gap-1 flex-shrink-0">
        {hasImproved && (
          <>
            <TrendingUp className="w-4 h-4 text-data-excellent" />
            <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-data-excellent/10 text-data-excellent tabular-nums">
              +{rankChange}
            </span>
          </>
        )}
        {hasDropped && (
          <>
            <TrendingDown className="w-4 h-4 text-data-poor" />
            <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-data-poor/10 text-data-poor tabular-nums">
              {rankChange}
            </span>
          </>
        )}
        {!hasImproved && !hasDropped && <Minus className="w-4 h-4 text-txt-tertiary" />}
      </div>

      {/* Team name */}
      <div className="flex-1 min-w-0">
        <p
          className={`font-medium truncate ${
            isOwnTeam ? 'text-accent-copper' : 'text-txt-primary'
          }`}
        >
          {teamName}
          {isOwnTeam && <span className="text-xs ml-2 text-txt-secondary">(Your Team)</span>}
        </p>
      </div>

      {/* Speed estimate */}
      {speed !== null && (
        <div className="text-right flex-shrink-0">
          <p className="text-sm font-mono text-txt-primary tabular-nums">{speed.toFixed(3)} m/s</p>
        </div>
      )}

      {/* Trend sparkline */}
      {trendData && trendData.length > 0 && (
        <div className="flex-shrink-0">
          <RankingTrendChart data={trendData} width={80} height={32} />
        </div>
      )}

      {/* Confidence indicator */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className={`w-2 h-2 rounded-full ${getConfidenceColor()}`} />
        <span className="text-xs text-txt-tertiary w-16 tabular-nums">{sampleCount} races</span>
      </div>

      {/* Last updated */}
      {lastUpdated && (
        <div
          className="text-xs text-txt-tertiary w-24 text-right flex-shrink-0"
          title={format(parseISO(lastUpdated), 'PPp')}
        >
          {formatDistanceToNow(parseISO(lastUpdated), { addSuffix: true })}
        </div>
      )}
    </motion.div>
  );
}
