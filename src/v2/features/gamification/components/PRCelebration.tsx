import { motion } from 'framer-motion';
import { Trophy, TrendingUp, Award } from 'lucide-react';
import { SPRING_CONFIG } from '@v2/utils/animations';
import { PRSparkline } from './PRSparkline';
import type { PRContext, PRCelebrationData } from '../../../types/gamification';

interface PRCelebrationProps {
  data: PRCelebrationData;
  compact?: boolean;
}

/**
 * Format time in seconds to mm:ss.s or h:mm:ss.s
 */
function formatTime(seconds: number): string {
  if (seconds >= 3600) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = (seconds % 60).toFixed(1);
    return `${h}:${m.toString().padStart(2, '0')}:${s.padStart(4, '0')}`;
  }
  const m = Math.floor(seconds / 60);
  const s = (seconds % 60).toFixed(1);
  return `${m}:${s.padStart(4, '0')}`;
}

/**
 * Get the most significant PR scope to display
 */
function getPrimaryScopeLabel(contexts: PRContext[]): string {
  const prContexts = contexts.filter((c) => c.isPR);
  if (prContexts.find((c) => c.scope === 'all-time')) return 'All-Time PR';
  if (prContexts.find((c) => c.scope === 'season')) return 'Season PR';
  if (prContexts.find((c) => c.scope === 'training-block')) return 'Block PR';
  return 'PR';
}

/**
 * PR celebration toast - tasteful slide-in notification, not disruptive
 * Per plan: "Tasteful toast notification, not confetti modal"
 * Warm gold accent color, auto-dismissible, understated celebration
 */
export function PRCelebration({ data, compact = false }: PRCelebrationProps) {
  const { testType, result, contexts, trendData, athleteId } = data;

  const isPR = contexts.some((c) => c.isPR);
  const prContext = contexts.find((c) => c.isPR);
  const improvement = prContext?.improvement;

  if (!isPR) {
    return null;
  }

  const scopeLabel = getPrimaryScopeLabel(contexts);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`
        rounded-lg border border-accent-primary/30 bg-surface-elevated backdrop-blur-sm shadow-glow
        ${compact ? 'p-2' : 'p-4'}
      `}
    >
      <div className="flex items-center gap-3">
        {/* Trophy icon with subtle animation */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="flex-shrink-0"
        >
          <div className="w-10 h-10 rounded-full bg-accent-primary/20 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-accent-primary" />
          </div>
        </motion.div>

        {/* PR info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-lg font-bold text-accent-primary">
              {formatTime(result)}
            </span>

            {improvement && improvement > 0 && (
              <span className="flex items-center gap-0.5 text-sm text-green-600 dark:text-green-400">
                <TrendingUp size={14} />-{improvement.toFixed(1)}s
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs font-medium text-accent-primary flex items-center gap-1">
              <Award size={12} />
              {scopeLabel}
            </span>
            <span className="text-xs text-txt-tertiary">{testType.toUpperCase()}</span>
          </div>
        </div>

        {/* Sparkline trend */}
        {!compact && trendData && trendData.length >= 2 && (
          <div className="flex-shrink-0">
            <PRSparkline athleteId={athleteId} testType={testType} width={60} height={28} />
          </div>
        )}
      </div>

      {/* Additional PR scopes */}
      {!compact && contexts.filter((c) => c.isPR && c.scope !== 'all-time').length > 0 && (
        <div className="mt-2 pt-2 border-t border-bdr-secondary">
          <div className="flex flex-wrap gap-2">
            {contexts
              .filter((c) => c.isPR && c.scope !== 'all-time')
              .map((c) => (
                <span
                  key={c.scope}
                  className="text-xs px-2 py-0.5 rounded-full bg-accent-primary/10 text-accent-primary"
                >
                  {c.scope === 'season' ? `Season PR` : 'Block PR'}
                  {c.improvement && ` (-${c.improvement.toFixed(1)}s)`}
                </span>
              ))}
          </div>
        </div>
      )}

      {/* Team rank if available */}
      {!compact && prContext?.rank && (
        <p className="text-xs text-txt-tertiary mt-2">Team rank: #{prContext.rank}</p>
      )}
    </motion.div>
  );
}

export default PRCelebration;
