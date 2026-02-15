/**
 * Individual workout summary card with source icon, metrics, and relative date.
 * Displays workout type/machine, distance, duration, and pace in compact layout.
 * Features a sport-typed left border accent and intensity indicator for watt-based workouts.
 * Ref: DASH-02 (recent workouts).
 */

import { useNavigate } from '@tanstack/react-router';
import { PenLine, Dumbbell, Bike, Watch } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { formatDistance, formatDuration, formatPace, formatRelativeDate } from '@/lib/format';
import { SPORT_CONFIG } from '@/features/workouts/constants';
import { getSportFromWorkout } from '@/features/workouts/utils';
import type { Workout } from '../types';

// TODO(phase-47): Create workout detail route /workouts/$workoutId

/** Map SPORT_CONFIG color tokens to CSS variable references. */
const colorToCssVar: Record<string, string> = {
  'accent-copper': 'var(--color-accent-copper)',
  'data-good': 'var(--color-data-good)',
  'data-warning': 'var(--color-data-warning)',
  'data-excellent': 'var(--color-data-excellent)',
  'accent-primary': 'var(--color-accent-primary)',
  'data-poor': 'var(--color-data-poor)',
  'ink-secondary': 'var(--color-ink-secondary)',
};

function getSportColor(workout: Workout): string {
  const sport = getSportFromWorkout(workout);
  const token = SPORT_CONFIG[sport].color;
  return colorToCssVar[token] ?? 'var(--color-accent-copper)';
}

/** Intensity level from average watts. */
function getIntensityClass(avgWatts: number | null | undefined): string | null {
  if (avgWatts == null) return null;
  if (avgWatts < 150) return 'text-ink-muted';
  if (avgWatts < 200) return 'text-data-good';
  if (avgWatts < 250) return 'text-data-warning';
  return 'text-data-poor';
}

interface WorkoutCardProps {
  workout: Workout;
  className?: string;
}

const sourceConfig: Record<Workout['source'], { icon: LucideIcon; colorClass: string }> = {
  manual: { icon: PenLine, colorClass: 'text-ink-secondary' },
  concept2: { icon: Dumbbell, colorClass: 'text-accent-copper' },
  strava: { icon: Bike, colorClass: 'text-data-warning' },
  garmin: { icon: Watch, colorClass: 'text-data-good' },
};

const machineDisplayMap: Record<string, string> = {
  rower: 'Row',
  bikerg: 'Bike',
  skierg: 'Ski',
};

function getWorkoutLabel(workout: Workout): string {
  if (workout.machineType) {
    return machineDisplayMap[workout.machineType] ?? workout.machineType;
  }
  if (workout.type) {
    return workout.type;
  }
  return 'Workout';
}

function MetricChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-xs bg-ink-well px-2 py-0.5 rounded-md text-ink-secondary">
      {children}
    </span>
  );
}

export function WorkoutCard({ workout, className = '' }: WorkoutCardProps) {
  const navigate = useNavigate();
  const { icon: SourceIcon, colorClass } = sourceConfig[workout.source];
  const label = getWorkoutLabel(workout);
  const sportColor = getSportColor(workout);
  const intensityClass = getIntensityClass(workout.avgWatts);

  const formattedDistance =
    workout.distanceM != null ? formatDistance(workout.distanceM, false) : null;
  const formattedDuration =
    workout.durationSeconds != null ? formatDuration(workout.durationSeconds) : null;
  const formattedPace = workout.avgPace != null ? `${formatPace(workout.avgPace)}/500m` : null;

  const handleClick = () => {
    navigate({ to: `/workouts/${workout.id}` as '/' });
  };

  return (
    <GlassCard
      padding="sm"
      hover
      interactive
      className={`cursor-pointer border-l-[3px] ${className}`}
      style={{ borderLeftColor: sportColor }}
    >
      <button
        type="button"
        onClick={handleClick}
        className="flex items-center gap-3 w-full text-left"
        aria-label={`${label} workout on ${formatRelativeDate(workout.date)}`}
      >
        {/* Source icon */}
        <div
          className="w-8 h-8 rounded-full bg-ink-well flex items-center justify-center shrink-0"
          aria-hidden="true"
        >
          <SourceIcon size={16} className={colorClass} />
        </div>

        {/* Center info */}
        <div className="flex-1 min-w-0">
          {/* Top line: workout type + date */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-ink-primary truncate">{label}</span>
            <span className="text-xs text-ink-tertiary shrink-0">
              {formatRelativeDate(workout.date)}
            </span>
          </div>

          {/* Bottom line: metric chips + intensity dot */}
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            {formattedDistance && <MetricChip>{formattedDistance}</MetricChip>}
            {formattedDuration && (
              <MetricChip>
                <span className="inline-flex items-center gap-1">
                  {formattedDuration}
                  {intensityClass && (
                    <span
                      className={`inline-block w-1.5 h-1.5 rounded-full ${intensityClass} bg-current`}
                      aria-label="Intensity indicator"
                    />
                  )}
                </span>
              </MetricChip>
            )}
            {formattedPace && <MetricChip>{formattedPace}</MetricChip>}
          </div>
        </div>
      </button>
    </GlassCard>
  );
}
