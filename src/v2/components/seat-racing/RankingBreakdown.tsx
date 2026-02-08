import { motion } from 'framer-motion';
import type { RankingComponent } from '../../types/advancedRanking';

interface RankingBreakdownProps {
  breakdown: RankingComponent[];
  compositeScore: number;
  expanded?: boolean;
}

export function RankingBreakdown({ breakdown, compositeScore, expanded = false }: RankingBreakdownProps) {
  const getSourceColor = (source: string): string => {
    switch (source) {
      case 'onWater': return 'bg-[var(--data-good)]';
      case 'erg': return 'bg-[var(--data-warning)]';
      case 'attendance': return 'bg-[var(--data-excellent)]';
      default: return 'bg-[var(--ink-muted)]';
    }
  };

  const getSourceLabel = (source: string): string => {
    switch (source) {
      case 'onWater': return 'On-Water';
      case 'erg': return 'Erg';
      case 'attendance': return 'Attendance';
      default: return source;
    }
  };

  if (!expanded) {
    // Compact horizontal bar
    return (
      <div className="flex items-center gap-1 w-24">
        {breakdown.map((component) => (
          <div
            key={component.source}
            className={`h-2 rounded-sm ${getSourceColor(component.source)}`}
            style={{ width: `${component.weight * 100}%` }}
            title={`${getSourceLabel(component.source)}: ${(component.normalizedScore * 100).toFixed(0)}%`}
          />
        ))}
      </div>
    );
  }

  // Expanded detailed view
  return (
    <div className="space-y-3 p-4 bg-surface-secondary rounded-lg">
      {/* Composite score header */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-txt-primary">Composite Score</span>
        <span className="text-lg font-bold text-txt-primary">
          {(compositeScore * 100).toFixed(1)}
        </span>
      </div>

      {/* Factor breakdown */}
      <div className="space-y-2">
        {breakdown.map((component) => (
          <div key={component.source} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${getSourceColor(component.source)}`} />
                <span className="text-txt-primary">{getSourceLabel(component.source)}</span>
                <span className="text-xs text-txt-secondary">
                  ({(component.weight * 100).toFixed(0)}% weight)
                </span>
              </div>
              <span className="font-medium text-txt-primary">
                {(component.contribution * 100).toFixed(1)}
              </span>
            </div>

            {/* Progress bar */}
            <div className="relative h-2 bg-surface-primary rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${component.normalizedScore * 100}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className={`absolute inset-y-0 left-0 rounded-full ${getSourceColor(component.source)}`}
              />
            </div>

            {/* Details */}
            <div className="flex items-center justify-between text-xs text-txt-secondary">
              <span>
                Score: {(component.normalizedScore * 100).toFixed(0)}%
                {component.dataPoints > 0 && ` (${component.dataPoints} data points)`}
              </span>
              <span className={`${
                component.confidence >= 0.7 ? 'text-[var(--data-excellent)]' :
                component.confidence >= 0.4 ? 'text-amber-600' :
                'text-[var(--data-poor)]'
              }`}>
                {component.confidence >= 0.7 ? 'High' :
                 component.confidence >= 0.4 ? 'Medium' :
                 'Low'} confidence
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default RankingBreakdown;
