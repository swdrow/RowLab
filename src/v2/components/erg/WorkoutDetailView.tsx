/**
 * WorkoutDetailView Component
 * Phase 37-05: Detailed workout view with summary card and per-split breakdown table
 *
 * Shows:
 * - Summary card at top with key metrics (distance, time, pace, watts, HR, drag factor)
 * - Machine type badge for non-rower ergs
 * - C2 badge if synced from Concept2
 * - Per-split table with pace, watts, stroke rate, HR for each split
 */

import React from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWorkoutDetail } from '@v2/hooks/useErgWorkouts';
import { MACHINE_TYPE_LABELS } from '@v2/types/workouts';
import type { WorkoutSplit } from '@v2/types/workouts';

interface WorkoutDetailViewProps {
  workoutId: string | null;
  onClose: () => void;
}

/**
 * Format pace from tenths of seconds per 500m to "M:SS.T" format
 */
function formatPace(tenths: number | null): string {
  if (!tenths) return '—';
  const totalSeconds = tenths / 10;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toFixed(1).padStart(4, '0')}`;
}

/**
 * Format duration from total seconds to "M:SS.T" or "H:MM:SS" format
 */
function formatDuration(seconds: number | null): string {
  if (!seconds) return '—';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toFixed(1).padStart(4, '0')}`;
  }
  return `${minutes}:${secs.toFixed(1).padStart(4, '0')}`;
}

/**
 * Format distance with comma separator
 */
function formatDistance(meters: number | null): string {
  if (!meters) return '—';
  return meters.toLocaleString() + 'm';
}

/**
 * Summary card with key workout metrics
 */
function SummaryCard({
  workout,
}: {
  workout: NonNullable<ReturnType<typeof useWorkoutDetail>['data']>;
}) {
  const athleteName = workout.athlete
    ? `${workout.athlete.firstName} ${workout.athlete.lastName}`
    : 'Unknown Athlete';

  const workoutDate = new Date(workout.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="relative overflow-hidden bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/50">
      {/* Noise texture overlay */}
      <div className="absolute inset-0 opacity-5 pointer-events-none mix-blend-overlay" />

      {/* Gradient border accent */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      <div className="relative z-10 p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold text-txt-primary">{athleteName}</h3>
            <p className="text-sm text-txt-tertiary">{workoutDate}</p>
          </div>
          <div className="flex items-center gap-2">
            {workout.source === 'concept2' && (
              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-semibold bg-[#1a1a2e]/80 text-[#00b4d8] border border-[#00b4d8]/30">
                C2
              </span>
            )}
            {workout.machineType && workout.machineType !== 'rower' && (
              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-data-warning/10 text-data-warning border border-data-warning/30">
                {MACHINE_TYPE_LABELS[workout.machineType]}
              </span>
            )}
          </div>
        </div>

        {/* Metrics grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-txt-tertiary mb-1">Distance</p>
            <p className="text-lg font-semibold text-txt-primary">
              {formatDistance(workout.distanceM)}
            </p>
          </div>
          <div>
            <p className="text-xs text-txt-tertiary mb-1">Time</p>
            <p className="text-lg font-semibold font-mono text-txt-primary">
              {formatDuration(workout.durationSeconds)}
            </p>
          </div>
          <div>
            <p className="text-xs text-txt-tertiary mb-1">Avg Pace</p>
            <p className="text-lg font-semibold font-mono text-txt-primary">
              {formatPace(workout.avgPace)}
              <span className="text-xs text-txt-tertiary ml-1">/500m</span>
            </p>
          </div>
          <div>
            <p className="text-xs text-txt-tertiary mb-1">Avg Watts</p>
            <p className="text-lg font-semibold text-txt-primary">
              {workout.avgWatts ? `${workout.avgWatts}W` : '—'}
            </p>
          </div>
          {workout.avgHeartRate && (
            <div>
              <p className="text-xs text-txt-tertiary mb-1">Avg HR</p>
              <p className="text-lg font-semibold text-txt-primary">
                {workout.avgHeartRate}
                <span className="text-xs text-txt-tertiary ml-1">bpm</span>
              </p>
            </div>
          )}
          {workout.dragFactor && (
            <div>
              <p className="text-xs text-txt-tertiary mb-1">Drag Factor</p>
              <p className="text-lg font-semibold text-txt-primary">{workout.dragFactor}</p>
            </div>
          )}
          {workout.strokeRate && (
            <div>
              <p className="text-xs text-txt-tertiary mb-1">Stroke Rate</p>
              <p className="text-lg font-semibold text-txt-primary">
                {workout.strokeRate}
                <span className="text-xs text-txt-tertiary ml-1">spm</span>
              </p>
            </div>
          )}
        </div>

        {/* Notes */}
        {workout.notes && (
          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-xs text-txt-tertiary mb-2">Notes</p>
            <p className="text-sm text-txt-secondary">{workout.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Splits table with per-split breakdown
 */
function SplitsTable({ splits }: { splits: WorkoutSplit[] }) {
  if (!splits || splits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-txt-secondary">
        <p className="text-sm">No split data available for this workout</p>
      </div>
    );
  }

  // Find best/worst pace for highlighting
  const paces = splits.map((s) => s.pace).filter((p): p is number => p !== null);
  const bestPace = paces.length > 0 ? Math.min(...paces) : null;
  const worstPace = paces.length > 0 ? Math.max(...paces) : null;

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-white/10">
            <th className="px-4 py-3 text-left text-xs font-medium text-txt-tertiary uppercase">
              Split #
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-txt-tertiary uppercase">
              Distance
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-txt-tertiary uppercase">
              Time
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-txt-tertiary uppercase">
              Pace
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-txt-tertiary uppercase">
              Watts
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-txt-tertiary uppercase">
              S/R
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-txt-tertiary uppercase">
              HR
            </th>
          </tr>
        </thead>
        <tbody>
          {splits.map((split) => {
            const isBest = split.pace === bestPace && bestPace !== null;
            const isWorst = split.pace === worstPace && worstPace !== null && splits.length > 1;

            return (
              <tr
                key={split.id}
                className={`border-b border-white/5 transition-colors ${
                  isBest ? 'bg-data-good/5' : isWorst ? 'bg-data-poor/5' : 'hover:bg-white/[0.02]'
                }`}
              >
                <td className="px-4 py-3 text-sm text-txt-primary">{split.splitNumber}</td>
                <td className="px-4 py-3 text-sm text-txt-secondary">
                  {formatDistance(split.distanceM)}
                </td>
                <td className="px-4 py-3 text-sm font-mono text-txt-secondary">
                  {formatDuration(split.timeSeconds)}
                </td>
                <td className="px-4 py-3 text-sm font-mono text-txt-primary font-medium">
                  {formatPace(split.pace)}
                </td>
                <td className="px-4 py-3 text-sm text-txt-primary">
                  {split.watts ? `${split.watts}W` : '—'}
                </td>
                <td className="px-4 py-3 text-sm text-txt-secondary">{split.strokeRate || '—'}</td>
                <td className="px-4 py-3 text-sm text-txt-secondary">{split.heartRate || '—'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Slide-over panel with workout detail view
 */
export function WorkoutDetailView({ workoutId, onClose }: WorkoutDetailViewProps) {
  const { data: workout, isLoading, error } = useWorkoutDetail(workoutId);

  // Spring animation config (matching design system)
  const springConfig = { type: 'spring', stiffness: 300, damping: 30 };

  return (
    <AnimatePresence>
      {workoutId && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={springConfig}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Slide-over panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={springConfig}
            className="fixed right-0 top-0 bottom-0 w-full max-w-3xl bg-bg-surface border-l border-white/10 shadow-2xl z-50 overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 bg-bg-surface/95 backdrop-blur-xl border-b border-white/10 px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-txt-primary">Workout Details</h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                  aria-label="Close"
                >
                  <X size={20} className="text-txt-secondary" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {isLoading && (
                <div className="animate-pulse space-y-4">
                  <div className="h-48 bg-white/5 rounded-2xl" />
                  <div className="h-64 bg-white/5 rounded-2xl" />
                </div>
              )}

              {error && (
                <div className="p-4 bg-status-error/10 border border-status-error/30 rounded-xl">
                  <p className="text-sm text-status-error">Failed to load workout details</p>
                </div>
              )}

              {workout && (
                <>
                  <SummaryCard workout={workout} />

                  {/* Splits section */}
                  <div className="relative overflow-hidden bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/50">
                    <div className="absolute inset-0 opacity-5 pointer-events-none mix-blend-overlay" />
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                    <div className="relative z-10 p-6">
                      <h3 className="text-lg font-semibold text-txt-primary mb-4">
                        Split Breakdown
                      </h3>
                      <SplitsTable splits={workout.splits} />
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
