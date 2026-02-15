/**
 * Full workout detail page.
 *
 * Hero header with 4 key metrics, source attribution, prev/next navigation,
 * splits table + chart, notes section, C2 logbook link, and edit trigger.
 */

import { useContext } from 'react';
import { useNavigate, useParams } from '@tanstack/react-router';
import { format } from 'date-fns';
import {
  Waves,
  Mountain,
  Bike,
  Footprints,
  Dumbbell,
  Heart,
  Activity,
  Zap,
  Pencil,
  Watch,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  ArrowLeft,
  type LucideIcon,
} from 'lucide-react';

import { useWorkoutDetail } from '../hooks/useWorkoutDetail';
import { WorkoutPageContext } from '../WorkoutPageContext';
import { SPORT_CONFIG, SOURCE_CONFIG, type SportType, type SourceType } from '../constants';
import { getSportFromWorkout } from '../utils';
import { formatDistance, formatDuration, formatPace, formatRelativeDate } from '@/lib/format';
import { GradientBorder } from '@/components/ui/GradientBorder';
import { SplitsTable } from './SplitsTable';
import { SplitsChart } from './SplitsChart';
import type { Workout } from '../types';

/* ------------------------------------------------------------------ */
/* Sport color → CSS variable resolution for glow                      */
/* ------------------------------------------------------------------ */

/**
 * Resolve the SPORT_CONFIG color token to a CSS variable string.
 * Used for dynamic sport-colored glow shadows on the hero.
 */
function sportColorVar(sport: SportType): string {
  const token = SPORT_CONFIG[sport].color;
  return `var(--color-${token})`;
}

/* ------------------------------------------------------------------ */
/* Icon map                                                            */
/* ------------------------------------------------------------------ */

const ICON_MAP: Record<string, LucideIcon> = {
  Waves,
  Mountain,
  Bike,
  Footprints,
  Dumbbell,
  Heart,
  Activity,
  Zap,
  Pencil,
  Watch,
};

function resolveSportIcon(sport: SportType): LucideIcon {
  return ICON_MAP[SPORT_CONFIG[sport].icon] ?? Activity;
}

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

const DASH = '\u2014';

/* ------------------------------------------------------------------ */
/* Navigation helper                                                   */
/* ------------------------------------------------------------------ */

/** Navigate within /workouts subtree using type assertion pattern (per Phase 46-02 decision) */
function useWorkoutNavigate() {
  const navigate = useNavigate();
  return {
    toList: () => navigate({ to: '/workouts' as '/' }),
    toDetail: (id: string) => navigate({ to: `/workouts/${id}` as '/' }),
  };
}

/* ------------------------------------------------------------------ */
/* WorkoutDetail                                                       */
/* ------------------------------------------------------------------ */

export function WorkoutDetail() {
  const { workoutId } = useParams({ strict: false }) as { workoutId: string };
  const { data: workout, isLoading, isError } = useWorkoutDetail(workoutId);
  const nav = useWorkoutNavigate();

  // WorkoutPageContext may be null if user navigated directly to this route
  const pageCtx = useContext(WorkoutPageContext);
  const onEdit = pageCtx?.onEdit ?? null;

  if (isLoading) return null; // Handled by Suspense fallback

  if (isError || !workout) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <p className="text-ink-secondary text-base mb-4">Workout not found</p>
        <button
          type="button"
          onClick={nav.toList}
          className="text-accent-copper hover:underline text-sm"
        >
          Back to workouts
        </button>
      </div>
    );
  }

  const sport = getSportFromWorkout(workout);
  const config = SPORT_CONFIG[sport];
  const SportIcon = resolveSportIcon(sport);
  const sourceKey = (workout.source ?? 'manual') as SourceType;
  const hasSplits = workout.splits && workout.splits.length > 0;
  const workoutDate = new Date(workout.date);

  return (
    <div className="space-y-6">
      {/* Top bar: back + actions */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={nav.toList}
          className="inline-flex items-center gap-1.5 text-sm text-ink-secondary hover:text-ink-primary transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Back to workouts</span>
        </button>

        <div className="flex items-center gap-2">
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit!(workout as Workout)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-ink-secondary hover:text-ink-primary hover:bg-ink-hover rounded-lg transition-colors"
            >
              <Pencil size={14} />
              <span>Edit</span>
            </button>
          )}
        </div>
      </div>

      {/* Hero header with prev/next flanking */}
      <div className="relative flex items-stretch gap-2">
        {/* Prev arrow */}
        <div className="flex items-center">
          <button
            type="button"
            disabled={!workout.prevWorkoutId}
            onClick={() => workout.prevWorkoutId && nav.toDetail(workout.prevWorkoutId)}
            className={`p-2 rounded-lg transition-colors ${
              workout.prevWorkoutId
                ? 'text-ink-secondary hover:text-ink-primary hover:bg-ink-hover cursor-pointer'
                : 'text-ink-muted cursor-not-allowed opacity-30'
            }`}
            aria-label="Previous workout"
          >
            <ChevronLeft size={20} />
          </button>
        </div>

        {/* Hero card with gradient border and sport-colored glow */}
        <GradientBorder
          className="flex-1"
          innerBg="bg-ink-raised"
          radius="rounded-xl"
          style={{
            boxShadow: `0 0 40px -10px color-mix(in oklch, ${sportColorVar(sport)}, transparent 70%)`,
          }}
        >
          <div className="p-6">
            {/* Top row: sport + date + source */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center bg-${config.color}/12`}
                >
                  <SportIcon size={24} className={`text-${config.color}`} />
                </div>
                <div>
                  <h2 className="text-ink-primary text-lg font-display font-semibold">
                    {config.label}
                  </h2>
                  <p className="text-ink-secondary text-sm">
                    {format(workoutDate, 'EEEE, MMMM d, yyyy')}
                  </p>
                </div>
              </div>

              {/* Source badge */}
              <SourceBadge source={sourceKey} createdAt={workout.createdAt} />
            </div>

            {/* Metric grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <HeroMetric label="Distance" value={formatDistance(workout.distanceM, false)} />
              <HeroMetric label="Time" value={formatDuration(workout.durationSeconds)} />
              <HeroMetric
                label={`Pace ${config.paceUnit ?? ''}`}
                value={formatPace(workout.avgPace, workout.machineType)}
              />
              <HeroMetric
                label="Watts"
                value={workout.avgWatts != null ? String(workout.avgWatts) : DASH}
              />
            </div>
          </div>

          {/* Sport-colored separator line */}
          <div
            className="h-px w-full"
            style={{
              background: `linear-gradient(to right, transparent, color-mix(in oklch, ${sportColorVar(sport)}, transparent 70%), transparent)`,
            }}
          />
        </GradientBorder>

        {/* Next arrow */}
        <div className="flex items-center">
          <button
            type="button"
            disabled={!workout.nextWorkoutId}
            onClick={() => workout.nextWorkoutId && nav.toDetail(workout.nextWorkoutId)}
            className={`p-2 rounded-lg transition-colors ${
              workout.nextWorkoutId
                ? 'text-ink-secondary hover:text-ink-primary hover:bg-ink-hover cursor-pointer'
                : 'text-ink-muted cursor-not-allowed opacity-30'
            }`}
            aria-label="Next workout"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Splits section */}
      {hasSplits && (
        <div className="space-y-4">
          <h3 className="text-ink-primary text-lg font-medium">Splits</h3>
          <SplitsTable splits={workout.splits!} machineType={workout.machineType} />
          <SplitsChart splits={workout.splits!} machineType={workout.machineType} />
        </div>
      )}

      {/* Notes section */}
      <div className="bg-ink-raised rounded-xl border border-ink-border p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-ink-primary text-sm font-medium">Notes</h3>
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit!(workout as Workout)}
              className="p-1 rounded-md text-ink-muted hover:text-ink-secondary hover:bg-ink-hover transition-colors"
              aria-label="Edit notes"
            >
              <Pencil size={14} />
            </button>
          )}
        </div>
        {workout.notes && workout.notes.trim() ? (
          <p className="text-ink-body text-sm leading-relaxed">{workout.notes}</p>
        ) : (
          <p className="text-ink-muted italic text-sm">No notes</p>
        )}
      </div>

      {/* C2 Logbook link */}
      {sourceKey === 'concept2' && (
        <a
          href="https://log.concept2.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-accent-copper hover:underline text-sm transition-colors"
        >
          <ExternalLink size={14} />
          View on Concept2 Logbook
        </a>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Hero metric sub-component                                           */
/* ------------------------------------------------------------------ */

function HeroMetric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-2xl font-mono font-bold text-heading-gradient tabular-nums">
        {value}
      </span>
      <p className="text-[10px] uppercase tracking-widest text-ink-muted mt-1">{label}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Source badge sub-component                                          */
/* ------------------------------------------------------------------ */

function SourceBadge({ source, createdAt }: { source: SourceType; createdAt?: string }) {
  const cfg = SOURCE_CONFIG[source];
  const SourceIcon = ICON_MAP[cfg.icon] ?? Activity;

  return (
    <div className="flex items-center gap-1.5 shrink-0">
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-${cfg.color}/12 text-${cfg.color}`}
      >
        <SourceIcon size={12} />
        {cfg.label}
      </div>
      {createdAt && <span className="text-ink-muted text-xs">{formatRelativeDate(createdAt)}</span>}
    </div>
  );
}
