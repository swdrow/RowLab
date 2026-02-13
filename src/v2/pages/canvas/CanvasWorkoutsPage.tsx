/**
 * CanvasWorkoutsPage - Workout History with Canvas design language
 *
 * Canvas design philosophy:
 * - RuledHeader for page title
 * - Table with expandable split rows (NOT CanvasDataTable - manual for custom expand behavior)
 * - ScrambleNumber for numeric values
 * - Console readout footer
 * - Monochrome chrome, data-only color
 * - Skeleton shimmer loading (NO spinners)
 *
 * Features:
 * - Workout table showing all synced C2 workouts
 * - Expandable rows for per-split detail
 * - Machine type labels (rower, bikerg, skierg)
 * - Empty state with integration link
 * - Newest-first sort
 */

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, ChevronRight, AlertCircle } from 'lucide-react';
import {
  ScrambleNumber,
  RuledHeader,
  CanvasConsoleReadout,
  CanvasButton,
} from '@v2/components/canvas';
import {
  useWorkoutHistory,
  formatPace,
  formatDuration,
  formatDistance,
  getMachineTypeLabel,
  type Workout,
} from '@v2/hooks/useWorkoutHistory';
import { FADE_IN_VARIANTS, SPRING_GENTLE } from '@v2/utils/animations';

// ============================================
// ANIMATION VARIANTS
// ============================================

const stagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.04, delayChildren: 0.08 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
  },
};

// ============================================
// CANVAS WORKOUTS PAGE
// ============================================

export function CanvasWorkoutsPage() {
  // Expanded row state (stores workout IDs)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Fetch workouts
  const { workouts, isLoading, error, refetch } = useWorkoutHistory();

  // Toggle row expansion
  const toggleRow = (workoutId: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(workoutId)) {
        next.delete(workoutId);
      } else {
        next.add(workoutId);
      }
      return next;
    });
  };

  // Sort workouts newest first
  const sortedWorkouts = [...workouts].sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  // Calculate stats
  const totalWorkouts = sortedWorkouts.length;
  const totalDistance = sortedWorkouts.reduce((sum, w) => sum + (w.distanceM || 0), 0);
  const totalTime = sortedWorkouts.reduce((sum, w) => sum + (w.durationSeconds || 0), 0);

  // ============================================
  // LOADING STATE
  // ============================================

  if (isLoading) {
    return (
      <div className="h-full flex flex-col bg-void">
        <div className="px-4 lg:px-6 pt-8 pb-6 border-b border-white/[0.06]">
          <div className="max-w-7xl mx-auto">
            <RuledHeader>WORKOUT HISTORY</RuledHeader>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
            <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-2">
              {[...Array(8)].map((_, i) => (
                <motion.div key={i} variants={fadeUp}>
                  <div className="h-12 bg-ink-well/30 animate-pulse" />
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // ERROR STATE
  // ============================================

  if (error) {
    return (
      <div className="h-full flex flex-col bg-void">
        <div className="px-4 lg:px-6 pt-8 pb-6 border-b border-white/[0.06]">
          <div className="max-w-7xl mx-auto">
            <RuledHeader>WORKOUT HISTORY</RuledHeader>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4 max-w-md px-6">
            <AlertCircle className="w-12 h-12 text-data-warning mx-auto" />
            <div>
              <p className="text-sm font-mono text-ink-secondary uppercase tracking-wider mb-2">
                ERROR LOADING WORKOUTS
              </p>
              <p className="text-sm text-ink-muted">
                {error instanceof Error ? error.message : 'Failed to load workouts'}
              </p>
            </div>
            <CanvasButton variant="secondary" onClick={() => refetch()}>
              RETRY
            </CanvasButton>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // EMPTY STATE
  // ============================================

  if (totalWorkouts === 0) {
    return (
      <div className="h-full flex flex-col bg-void">
        <div className="px-4 lg:px-6 pt-8 pb-6 border-b border-white/[0.06]">
          <div className="max-w-7xl mx-auto">
            <RuledHeader>WORKOUT HISTORY</RuledHeader>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4 max-w-md px-6">
            <p className="text-sm font-mono text-ink-secondary uppercase tracking-wider">
              NO WORKOUTS SYNCED YET
            </p>
            <p className="text-sm text-ink-muted">
              Connect your Concept2 account in Settings → Integrations to sync your workouts.
            </p>
          </div>
        </div>

        <div className="border-t border-white/[0.06] px-4 lg:px-6 py-3 bg-ink-well/20">
          <div className="max-w-7xl mx-auto">
            <CanvasConsoleReadout items={[{ label: 'WORKOUTS', value: '0' }]} />
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // WORKOUTS TABLE
  // ============================================

  return (
    <div className="h-full flex flex-col bg-void">
      {/* Page header */}
      <div className="px-4 lg:px-6 pt-8 pb-6 border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto">
          <RuledHeader>WORKOUT HISTORY</RuledHeader>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
          <div className="border border-white/[0.06]">
            {/* Table Header */}
            <div className="grid grid-cols-[40px_1fr_120px_100px_100px_120px_100px_80px_100px] gap-4 px-4 py-3 bg-ink-well/30 border-b border-white/[0.06]">
              <div></div>
              <div className="text-[10px] font-mono text-ink-secondary uppercase tracking-wider">
                DATE
              </div>
              <div className="text-[10px] font-mono text-ink-secondary uppercase tracking-wider">
                TYPE
              </div>
              <div className="text-[10px] font-mono text-ink-secondary uppercase tracking-wider text-right">
                DISTANCE
              </div>
              <div className="text-[10px] font-mono text-ink-secondary uppercase tracking-wider text-right">
                TIME
              </div>
              <div className="text-[10px] font-mono text-ink-secondary uppercase tracking-wider text-right">
                PACE
              </div>
              <div className="text-[10px] font-mono text-ink-secondary uppercase tracking-wider text-right">
                WATTS
              </div>
              <div className="text-[10px] font-mono text-ink-secondary uppercase tracking-wider text-right">
                AVG SR
              </div>
              <div className="text-[10px] font-mono text-ink-secondary uppercase tracking-wider">
                SOURCE
              </div>
            </div>

            {/* Table Rows */}
            <AnimatePresence mode="sync">
              {sortedWorkouts.map((workout, idx) => (
                <WorkoutRow
                  key={workout.id}
                  workout={workout}
                  isExpanded={expandedRows.has(workout.id)}
                  onToggle={() => toggleRow(workout.id)}
                  index={idx}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Console readout footer */}
      <div className="border-t border-white/[0.06] px-4 lg:px-6 py-3 bg-ink-well/20">
        <div className="max-w-7xl mx-auto">
          <CanvasConsoleReadout
            items={[
              { label: 'WORKOUTS', value: totalWorkouts.toString() },
              { label: 'TOTAL DISTANCE', value: formatDistance(totalDistance) },
              { label: 'TOTAL TIME', value: formatDuration(totalTime) },
            ]}
          />
        </div>
      </div>
    </div>
  );
}

// ============================================
// WORKOUT ROW COMPONENT
// ============================================

interface WorkoutRowProps {
  workout: Workout;
  isExpanded: boolean;
  onToggle: () => void;
  index: number;
}

function WorkoutRow({ workout, isExpanded, onToggle, index }: WorkoutRowProps) {
  const workoutDate = new Date(workout.date);
  const formattedDate = workoutDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const sourceLabel = workout.source === 'concept2_sync' ? 'C2 SYNC' : workout.source.toUpperCase();
  const hasSplits = workout.splits && workout.splits.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2, delay: index * 0.02 }}
      className="border-b border-white/[0.06] last:border-b-0"
    >
      {/* Main Row */}
      <button
        onClick={onToggle}
        className="w-full grid grid-cols-[40px_1fr_120px_100px_100px_120px_100px_80px_100px] gap-4 px-4 py-3 hover:bg-ink-well/20 transition-colors text-left"
        disabled={!hasSplits}
      >
        <div className="flex items-center">
          {hasSplits ? (
            isExpanded ? (
              <ChevronDown className="w-4 h-4 text-ink-secondary" />
            ) : (
              <ChevronRight className="w-4 h-4 text-ink-secondary" />
            )
          ) : (
            <div className="w-4" />
          )}
        </div>

        <div className="font-mono text-sm text-ink-bright">{formattedDate}</div>

        <div className="font-mono text-xs text-ink-secondary uppercase">
          {getMachineTypeLabel(workout.machineType)}
        </div>

        <div className="font-mono text-sm text-ink-bright text-right">
          {formatDistance(workout.distanceM)}
        </div>

        <div className="font-mono text-sm text-ink-bright text-right">
          {formatDuration(workout.durationSeconds)}
        </div>

        <div className="font-mono text-sm text-data-good text-right">
          {formatPace(workout.avgPace, workout.machineType)}
        </div>

        <div className="font-mono text-sm text-data-good text-right">
          {workout.avgWatts ? <ScrambleNumber value={workout.avgWatts} /> : '—'}
        </div>

        <div className="font-mono text-sm text-ink-bright text-right">
          {workout.strokeRate || '—'}
        </div>

        <div className="font-mono text-[10px] text-ink-muted uppercase">{sourceLabel}</div>
      </button>

      {/* Expanded Split View */}
      <AnimatePresence>
        {isExpanded && hasSplits && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={SPRING_GENTLE}
            className="overflow-hidden"
          >
            <div className="bg-ink-raised px-4 py-4 border-t border-white/[0.06]">
              <p className="text-[10px] font-mono text-ink-secondary uppercase tracking-wider mb-3">
                SPLIT DETAIL
              </p>

              {/* Splits Sub-Table */}
              <div className="space-y-1">
                {/* Splits Header */}
                <div className="grid grid-cols-[60px_100px_100px_120px_100px_80px_80px] gap-3 px-3 py-2 bg-void/50">
                  <div className="text-[9px] font-mono text-ink-secondary uppercase">SPLIT</div>
                  <div className="text-[9px] font-mono text-ink-secondary uppercase text-right">
                    DISTANCE
                  </div>
                  <div className="text-[9px] font-mono text-ink-secondary uppercase text-right">
                    TIME
                  </div>
                  <div className="text-[9px] font-mono text-ink-secondary uppercase text-right">
                    PACE
                  </div>
                  <div className="text-[9px] font-mono text-ink-secondary uppercase text-right">
                    WATTS
                  </div>
                  <div className="text-[9px] font-mono text-ink-secondary uppercase text-right">
                    SR
                  </div>
                  <div className="text-[9px] font-mono text-ink-secondary uppercase text-right">
                    HR
                  </div>
                </div>

                {/* Splits Rows */}
                {workout.splits!.map((split) => (
                  <div
                    key={split.id}
                    className="grid grid-cols-[60px_100px_100px_120px_100px_80px_80px] gap-3 px-3 py-2 hover:bg-void/30 transition-colors"
                  >
                    <div className="font-mono text-xs text-ink-secondary">#{split.splitNumber}</div>
                    <div className="font-mono text-xs text-ink-bright text-right">
                      {formatDistance(split.distanceM)}
                    </div>
                    <div className="font-mono text-xs text-ink-bright text-right">
                      {formatDuration(split.timeSeconds)}
                    </div>
                    <div className="font-mono text-xs text-data-good text-right">
                      {formatPace(split.pace, workout.machineType)}
                    </div>
                    <div className="font-mono text-xs text-data-good text-right">
                      {split.watts ? <ScrambleNumber value={split.watts} /> : '—'}
                    </div>
                    <div className="font-mono text-xs text-ink-bright text-right">
                      {split.strokeRate || '—'}
                    </div>
                    <div className="font-mono text-xs text-ink-bright text-right">
                      {split.heartRate || '—'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default CanvasWorkoutsPage;
