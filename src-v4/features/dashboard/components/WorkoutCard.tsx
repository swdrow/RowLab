/**
 * Individual workout summary card with source icon, metrics, and relative date.
 * Displays workout type/machine, distance, duration, and pace in compact layout.
 * Features a sport-typed left border accent and intensity indicator for watt-based workouts.
 * Ref: DASH-02 (recent workouts).
 */

import { useNavigate } from '@tanstack/react-router';
import { IconPencil, IconDumbbell, IconBike, IconWatch } from '@/components/icons';
import type { IconComponent } from '@/types/icons';
import { Card } from '@/components/ui/Card';
import { formatDistance, formatDuration, formatPace, formatRelativeDate } from '@/lib/format';
import { SPORT_CONFIG } from '@/features/workouts/constants';
import { getSportFromWorkout, parseIntervalPattern } from '@/features/workouts/utils';
import type { Workout } from '../types';

// TODO(phase-47): Create workout detail route /workouts/$workoutId

/** Map SPORT_CONFIG color tokens to CSS variable references. */
const colorToCssVar: Record<string, string> = {
  'machine-rower': 'var(--color-machine-rower)',
  'machine-bike': 'var(--color-machine-bike)',
  'machine-ski': 'var(--color-machine-ski)',
  'machine-otw': 'var(--color-machine-otw)',
  'data-good': 'var(--color-data-good)',
  'data-warning': 'var(--color-data-warning)',
  'data-excellent': 'var(--color-data-excellent)',
  'data-poor': 'var(--color-data-poor)',
  'text-dim': 'var(--color-text-dim)',
  'accent-teal': 'var(--color-accent-teal)',
};

function getSportColor(workout: Workout): string {
  const sport = getSportFromWorkout(workout);
  const token = SPORT_CONFIG[sport].color;
  return colorToCssVar[token] ?? 'var(--color-accent-teal)';
}

/** Intensity level from average watts. */
function getIntensityClass(avgWatts: number | null | undefined): string | null {
  if (avgWatts == null) return null;
  if (avgWatts < 150) return 'text-text-faint';
  if (avgWatts < 200) return 'text-data-good';
  if (avgWatts < 250) return 'text-data-warning';
  return 'text-data-poor';
}

interface WorkoutCardProps {
  workout: Workout;
  className?: string;
}

const sourceConfig: Record<Workout['source'], { icon: IconComponent; colorClass: string }> = {
  manual: { icon: IconPencil, colorClass: 'text-text-dim' },
  concept2: { icon: IconDumbbell, colorClass: 'text-accent-teal' },
  strava: { icon: IconBike, colorClass: 'text-data-warning' },
  garmin: { icon: IconWatch, colorClass: 'text-data-good' },
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
    <span className="text-xs font-mono tabular-nums bg-void-deep px-2 py-0.5 rounded-md text-text-dim">
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
  const intervalInfo = parseIntervalPattern(workout.splits, workout.workoutType);

  const formattedDistance =
    workout.distanceM != null ? formatDistance(workout.distanceM, false) : null;
  const formattedDuration =
    workout.durationSeconds != null ? formatDuration(workout.durationSeconds) : null;
  const paceUnit = workout.machineType === 'bikerg' ? '/1000m' : '/500m';
  const formattedPace =
    workout.avgPace != null
      ? `${formatPace(workout.avgPace, workout.machineType)}${paceUnit}`
      : null;

  const handleClick = () => {
    navigate({ to: `/workouts/${workout.id}` as '/' });
  };

  return (
    <Card
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
          className="w-8 h-8 rounded-full bg-void-deep flex items-center justify-center shrink-0"
          aria-hidden="true"
        >
          <SourceIcon width={16} height={16} className={colorClass} />
        </div>

        {/* Center info */}
        <div className="flex-1 min-w-0">
          {/* Top line: workout type + interval badge + date */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              {intervalInfo.isInterval ? (
                <>
                  <span className="text-sm font-medium text-accent-teal font-mono whitespace-nowrap">
                    {intervalInfo.pattern}
                  </span>
                  <span className="text-xs text-text-faint truncate">{label}</span>
                </>
              ) : (
                <span className="text-sm font-medium text-text-bright truncate">{label}</span>
              )}
            </div>
            <span className="text-xs text-accent-sand shrink-0">
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
    </Card>
  );
}
