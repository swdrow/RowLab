import { useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  type TooltipProps,
} from 'recharts';
import { ConfidenceRing } from './ConfidenceRing';
import { SPRING_CONFIG, SLIDE_PANEL_VARIANTS } from '@v2/utils/animations';
import { useAthleteRatingHistory, useAthleteRatings } from '@v2/hooks/useAthleteRatings';
import { useSeatRaceSessions } from '@v2/hooks/useSeatRaceSessions';
import type { RatingWithAthlete } from '@v2/types/seatRacing';

export interface RankingDetailPanelProps {
  athleteId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Custom tooltip for ELO history chart
 */
function ELOTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;

  return (
    <div className="bg-bg-raised border border-bdr-default rounded-lg shadow-lg px-3 py-2">
      <p className="text-xs text-txt-secondary mb-1">{data.formattedDate}</p>
      <p className="text-sm font-mono font-semibold text-txt-primary">
        ELO: {Math.round(data.elo)}
      </p>
    </div>
  );
}

/**
 * Format relative date (Today, Yesterday, N days ago)
 */
function formatRelativeDate(date: string | Date): string {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
}

/**
 * Skeleton loader for panel content
 */
function PanelSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="space-y-3">
        <div className="h-8 bg-bg-hover rounded w-2/3" />
        <div className="h-6 bg-bg-hover rounded w-1/3" />
        <div className="h-16 bg-bg-hover rounded-full w-16" />
      </div>

      {/* Chart skeleton */}
      <div className="h-48 bg-bg-hover rounded" />

      {/* Breakdown skeleton */}
      <div className="space-y-2">
        <div className="h-6 bg-bg-hover rounded w-1/4" />
        <div className="h-4 bg-bg-hover rounded" />
        <div className="h-4 bg-bg-hover rounded" />
        <div className="h-4 bg-bg-hover rounded" />
      </div>
    </div>
  );
}

/**
 * Slide-out panel showing detailed athlete ranking information
 *
 * Displays:
 * - Athlete name, current ELO, rank, confidence
 * - ELO history line chart (smooth monotone with dots)
 * - Composite factor breakdown (read-only)
 * - Recent seat race sessions list
 *
 * Animations use spring physics per V3 design system.
 */
export function RankingDetailPanel({ athleteId, isOpen, onClose }: RankingDetailPanelProps) {
  // Fetch athlete rating data
  const { ratings } = useAthleteRatings({ ratingType: 'seat_race_elo' });
  const { history, isLoading: isLoadingHistory } = useAthleteRatingHistory(athleteId);
  const { sessions, isLoading: isLoadingSessions } = useSeatRaceSessions();

  // Find current athlete in ratings
  const athlete = useMemo(() => {
    if (!athleteId) return null;
    return ratings.find((r) => r.athlete.id === athleteId);
  }, [athleteId, ratings]);

  // Calculate rank
  const rank = useMemo(() => {
    if (!athleteId) return null;
    return ratings.findIndex((r) => r.athlete.id === athleteId) + 1;
  }, [athleteId, ratings]);

  // Prepare ELO history chart data
  const chartData = useMemo(() => {
    if (!history || history.length === 0) return [];

    return history.map((rating) => ({
      date: new Date(rating.updatedAt || rating.createdAt || Date.now()).toISOString(),
      formattedDate: new Date(
        rating.updatedAt || rating.createdAt || Date.now()
      ).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      elo: rating.ratingValue,
    }));
  }, [history]);

  // Get chart colors from CSS variables
  const chartColors = useMemo(() => {
    const styles = getComputedStyle(document.documentElement);
    return {
      line: styles.getPropertyValue('--data-good').trim(),
      dot: styles.getPropertyValue('--data-excellent').trim(),
      grid: styles.getPropertyValue('--bdr-subtle').trim(),
      text: styles.getPropertyValue('--txt-tertiary').trim(),
    };
  }, []);

  // Filter sessions for this athlete
  const athleteSessions = useMemo(() => {
    if (!athleteId || !sessions) return [];

    // TODO(31-03): Filter sessions by athlete participation
    // For now, return most recent 5 sessions as placeholder
    return sessions.slice(0, 5);
  }, [athleteId, sessions]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="ranking-detail-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={SPRING_CONFIG}
            onClick={onClose}
            className="fixed inset-0 bg-[var(--ink-deep)]/50 backdrop-blur-sm z-40"
          />

          {/* Panel */}
          <motion.div
            key="ranking-detail-panel"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={SLIDE_PANEL_VARIANTS}
            transition={SPRING_CONFIG}
            className="fixed right-0 top-0 h-full w-96 max-w-full md:w-96 bg-bg-base border-l border-bdr-default shadow-2xl z-50 overflow-y-auto"
          >
            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Header Section */}
              <div className="flex items-start justify-between border-b border-bdr-default pb-6">
                <div className="flex-1">
                  {athlete ? (
                    <>
                      <h2 className="text-2xl font-bold text-txt-primary mb-2">
                        {athlete.athlete.firstName} {athlete.athlete.lastName}
                      </h2>
                      <div className="flex items-center gap-4 mb-3">
                        <div className="font-mono text-3xl font-bold text-txt-primary">
                          {Math.round(athlete.ratingValue)}
                        </div>
                        {rank && (
                          <div className="px-3 py-1 bg-[var(--data-warning)]/10 text-[var(--data-warning)] rounded-full text-sm font-semibold">
                            Rank #{rank}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <ConfidenceRing
                          confidence={Math.round((athlete.confidenceScore || 0) * 100)}
                          size={48}
                        />
                        <div className="text-xs text-txt-secondary">
                          <div className="font-medium text-txt-primary">
                            {Math.round((athlete.confidenceScore || 0) * 100)}% Confidence
                          </div>
                          <div>{athlete.racesCount} pieces</div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="h-32 flex items-center justify-center text-txt-tertiary">
                      No athlete selected
                    </div>
                  )}
                </div>

                {/* Close button */}
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-bg-hover transition-colors"
                  aria-label="Close panel"
                >
                  <X className="w-5 h-5 text-txt-secondary" />
                </button>
              </div>

              {/* ELO History Chart Section */}
              <div className="border-b border-bdr-default pb-6">
                <h3 className="text-lg font-semibold text-txt-primary mb-4">ELO History</h3>

                {isLoadingHistory ? (
                  <div className="h-48 bg-bg-hover rounded animate-pulse" />
                ) : chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                      <XAxis
                        dataKey="formattedDate"
                        stroke={chartColors.text}
                        style={{ fontSize: '12px' }}
                      />
                      <YAxis stroke={chartColors.text} style={{ fontSize: '12px' }} />
                      <Tooltip content={<ELOTooltip />} />
                      <Line
                        type="monotone"
                        dataKey="elo"
                        stroke={chartColors.line}
                        strokeWidth={2}
                        dot={{
                          fill: chartColors.dot,
                          r: 4,
                          strokeWidth: 2,
                          stroke: chartColors.line,
                        }}
                        animationDuration={800}
                        animationEasing="ease-in-out"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-48 flex items-center justify-center text-txt-tertiary text-sm">
                    Not enough data for history chart
                  </div>
                )}
              </div>

              {/* Composite Factor Breakdown Section */}
              <div className="border-b border-bdr-default pb-6">
                <h3 className="text-lg font-semibold text-txt-primary mb-4">Ranking Factors</h3>

                {athlete ? (
                  <div className="space-y-4">
                    {/* Weight profile label */}
                    <div className="text-xs text-txt-secondary font-medium uppercase tracking-wide">
                      Performance-First (85/10/5)
                    </div>

                    {/* Factor bars */}
                    <div className="space-y-3">
                      {/* On-Water (ELO) */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-txt-secondary">On-Water Performance</span>
                          <span className="text-sm font-mono text-txt-primary">85%</span>
                        </div>
                        <div className="h-2 bg-bg-hover rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[var(--data-good)] rounded-full"
                            style={{ width: '85%' }}
                          />
                        </div>
                      </div>

                      {/* Erg Performance */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-txt-secondary">Erg Performance</span>
                          <span className="text-sm font-mono text-txt-primary">10%</span>
                        </div>
                        <div className="h-2 bg-bg-hover rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[var(--data-warning)] rounded-full"
                            style={{ width: '10%' }}
                          />
                        </div>
                      </div>

                      {/* Attendance */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-txt-secondary">Attendance</span>
                          <span className="text-sm font-mono text-txt-primary">5%</span>
                        </div>
                        <div className="h-2 bg-bg-hover rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[var(--accent-copper)] rounded-full"
                            style={{ width: '5%' }}
                          />
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-txt-tertiary italic">
                      Composite ranking weights (read-only display)
                    </p>
                  </div>
                ) : (
                  <div className="text-sm text-txt-tertiary">Composite ranking not calculated</div>
                )}
              </div>

              {/* Recent Sessions Section */}
              <div>
                <h3 className="text-lg font-semibold text-txt-primary mb-4">Recent Sessions</h3>

                {isLoadingSessions ? (
                  <div className="space-y-2">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-16 bg-bg-hover rounded animate-pulse" />
                    ))}
                  </div>
                ) : athleteSessions.length > 0 ? (
                  <div className="space-y-2">
                    {athleteSessions.map((session) => (
                      <div
                        key={session.id}
                        className="p-3 bg-bg-surface border border-bdr-default rounded-lg hover:bg-bg-hover transition-colors cursor-pointer"
                      >
                        <div className="flex items-start justify-between mb-1">
                          <div className="font-medium text-txt-primary text-sm">
                            {session.sessionName || 'Seat Race Session'}
                          </div>
                          <div className="text-xs text-txt-tertiary">
                            {formatRelativeDate(session.sessionDate)}
                          </div>
                        </div>
                        <div className="text-xs text-txt-secondary">
                          {session.location || 'Location not specified'}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-txt-tertiary text-center py-8">
                    No seat race sessions recorded
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
