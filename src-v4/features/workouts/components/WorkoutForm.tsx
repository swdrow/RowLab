/**
 * Workout creation/edit form with auto-calculate logic.
 *
 * Built with react-hook-form + zod validation.
 * Auto-calculates the third metric when any 2 of distance/time/pace are entered.
 * Sport selector uses SPORT_CONFIG for icon/label/paceUnit display.
 * Watts field only shown for erg sports (RowErg, SkiErg, BikeErg).
 */

import { useEffect, useRef, useCallback } from 'react';
import { useForm, type UseFormSetValue } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  IconWaves,
  IconMountain,
  IconBike,
  IconFootprints,
  IconDumbbell,
  IconHeart,
  IconActivity,
} from '@/components/icons';
import type { IconComponent } from '@/types/icons';

import { SPORT_CONFIG, SPORT_LIST, type SportType } from '../constants';
import { autoCalculate, getSportFromWorkout } from '../utils';
import { useCreateWorkout, useUpdateWorkout } from '../hooks/useWorkoutMutations';
import type { Workout, CreateWorkoutInput, UpdateWorkoutInput } from '../types';

/* ------------------------------------------------------------------ */
/* Icon map                                                            */
/* ------------------------------------------------------------------ */

const ICON_MAP: Record<string, IconComponent> = {
  Waves: IconWaves,
  Mountain: IconMountain,
  Bike: IconBike,
  Footprints: IconFootprints,
  Dumbbell: IconDumbbell,
  Heart: IconHeart,
  Activity: IconActivity,
};

/* ------------------------------------------------------------------ */
/* Form types (manual, avoiding zod v4 coerce inference issues)        */
/* ------------------------------------------------------------------ */

interface WorkoutFormValues {
  sport: SportType;
  date: string;
  distanceM?: number;
  durationMinutes?: number;
  durationSeconds?: number;
  paceMinutes?: number;
  paceSeconds?: number;
  avgWatts?: number;
  notes?: string;
}

const workoutFormSchema = z.object({
  sport: z.enum([
    'RowErg',
    'SkiErg',
    'BikeErg',
    'Running',
    'Cycling',
    'Swimming',
    'Strength',
    'Yoga',
    'Other',
  ]),
  date: z.string().min(1, 'Date is required'),
  distanceM: z.coerce.number().positive().optional(),
  durationMinutes: z.coerce.number().min(0).optional(),
  durationSeconds: z.coerce.number().min(0).max(59).optional(),
  paceMinutes: z.coerce.number().min(0).optional(),
  paceSeconds: z.coerce.number().min(0).max(59.9).optional(),
  avgWatts: z.coerce.number().positive().optional(),
  notes: z.string().optional(),
});

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface WorkoutFormProps {
  editingWorkout: Workout | null;
  onSuccess: () => void;
}

/* ------------------------------------------------------------------ */
/* Default values from existing workout                                */
/* ------------------------------------------------------------------ */

function getDefaults(workout: Workout | null): WorkoutFormValues {
  if (!workout) {
    return {
      sport: 'RowErg',
      date: new Date().toISOString().split('T')[0]!,
      distanceM: undefined,
      durationMinutes: undefined,
      durationSeconds: undefined,
      paceMinutes: undefined,
      paceSeconds: undefined,
      avgWatts: undefined,
      notes: '',
    };
  }

  const sport = getSportFromWorkout(workout);

  // Convert durationSeconds to minutes + seconds
  let durationMin: number | undefined;
  let durationSec: number | undefined;
  if (workout.durationSeconds != null) {
    durationMin = Math.floor(workout.durationSeconds / 60);
    durationSec = workout.durationSeconds % 60;
  }

  // Convert avgPace (tenths of seconds per 500m) to pace minutes + seconds
  let paceMin: number | undefined;
  let paceSec: number | undefined;
  if (workout.avgPace != null) {
    const totalPaceSeconds = workout.avgPace / 10;
    paceMin = Math.floor(totalPaceSeconds / 60);
    paceSec = Math.round((totalPaceSeconds % 60) * 10) / 10;
  }

  return {
    sport,
    date: workout.date.split('T')[0]!,
    distanceM: workout.distanceM ?? undefined,
    durationMinutes: durationMin,
    durationSeconds: durationSec,
    paceMinutes: paceMin,
    paceSeconds: paceSec,
    avgWatts: workout.avgWatts ?? undefined,
    notes: workout.notes ?? '',
  };
}

/* ------------------------------------------------------------------ */
/* Auto-calculate hook                                                 */
/* ------------------------------------------------------------------ */

function useAutoCalculate(
  getValues: () => WorkoutFormValues,
  setValue: UseFormSetValue<WorkoutFormValues>
) {
  const skipRef = useRef(false);

  return useCallback(() => {
    if (skipRef.current) {
      skipRef.current = false;
      return;
    }

    const values = getValues();
    const distanceM = values.distanceM && values.distanceM > 0 ? values.distanceM : undefined;

    const durMin = values.durationMinutes ?? 0;
    const durSec = values.durationSeconds ?? 0;
    const totalDuration = durMin > 0 || durSec > 0 ? durMin * 60 + durSec : undefined;

    const paceMin = values.paceMinutes ?? 0;
    const paceSec = values.paceSeconds ?? 0;
    const totalPaceTenths =
      paceMin > 0 || paceSec > 0 ? Math.round((paceMin * 60 + paceSec) * 10) : undefined;

    const result = autoCalculate(distanceM, totalDuration, totalPaceTenths);

    skipRef.current = true;

    if (result.distanceM != null) {
      setValue('distanceM', result.distanceM, { shouldValidate: false });
    }
    if (result.durationSeconds != null) {
      const mins = Math.floor(result.durationSeconds / 60);
      const secs = result.durationSeconds % 60;
      setValue('durationMinutes', mins, { shouldValidate: false });
      setValue('durationSeconds', secs, { shouldValidate: false });
    }
    if (result.avgPace != null) {
      const totalSecs = result.avgPace / 10;
      const pMins = Math.floor(totalSecs / 60);
      const pSecs = Math.round((totalSecs % 60) * 10) / 10;
      setValue('paceMinutes', pMins, { shouldValidate: false });
      setValue('paceSeconds', pSecs, { shouldValidate: false });
    }
  }, [getValues, setValue]);
}

/* ------------------------------------------------------------------ */
/* WorkoutForm                                                         */
/* ------------------------------------------------------------------ */

export function WorkoutForm({ editingWorkout, onSuccess }: WorkoutFormProps) {
  const createWorkout = useCreateWorkout();
  const updateWorkout = useUpdateWorkout();
  const isEdit = editingWorkout != null;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    getValues,
  } = useForm<WorkoutFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(workoutFormSchema) as any,
    defaultValues: getDefaults(editingWorkout),
  });

  const doAutoCalc = useAutoCalculate(getValues, setValue);

  // Watch for changes to trigger auto-calculate
  const watchedDistance = watch('distanceM');
  const watchedDurMin = watch('durationMinutes');
  const watchedDurSec = watch('durationSeconds');
  const watchedPaceMin = watch('paceMinutes');
  const watchedPaceSec = watch('paceSeconds');
  const watchedSport = watch('sport');

  useEffect(() => {
    doAutoCalc();
  }, [watchedDistance, watchedDurMin, watchedDurSec, watchedPaceMin, watchedPaceSec, doAutoCalc]);

  const isErgSport =
    watchedSport === 'RowErg' || watchedSport === 'SkiErg' || watchedSport === 'BikeErg';
  const paceUnit = SPORT_CONFIG[watchedSport]?.paceUnit ?? '/500m';
  const submitError = createWorkout.error || updateWorkout.error;
  const isPending = createWorkout.isPending || updateWorkout.isPending;

  const onSubmit = async (values: WorkoutFormValues) => {
    const config = SPORT_CONFIG[values.sport];

    const durMin = values.durationMinutes ?? 0;
    const durSec = values.durationSeconds ?? 0;
    const totalDuration = durMin > 0 || durSec > 0 ? durMin * 60 + durSec : undefined;

    const paceMin = values.paceMinutes ?? 0;
    const paceSec = values.paceSeconds ?? 0;
    const totalPaceTenths =
      paceMin > 0 || paceSec > 0 ? Math.round((paceMin * 60 + paceSec) * 10) : undefined;

    try {
      if (isEdit && editingWorkout) {
        const data: UpdateWorkoutInput = {
          type: config.type,
          machineType: config.machineType,
          date: values.date,
          distanceM: values.distanceM,
          durationSeconds: totalDuration,
          avgPace: totalPaceTenths,
          avgWatts: values.avgWatts,
          notes: values.notes,
        };
        await updateWorkout.mutateAsync({ id: editingWorkout.id, data });
      } else {
        const data: CreateWorkoutInput = {
          type: config.type,
          machineType: config.machineType,
          date: values.date,
          distanceM: values.distanceM,
          durationSeconds: totalDuration,
          avgPace: totalPaceTenths,
          avgWatts: values.avgWatts,
          notes: values.notes,
        };
        await createWorkout.mutateAsync(data);
      }
      onSuccess();
    } catch {
      // Error state handled by mutation error
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 pt-4">
      {/* Sport selector */}
      <div>
        <label className="text-xs font-medium text-text-dim uppercase tracking-wider mb-2 block">
          Sport
        </label>
        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
          {SPORT_LIST.map((sport: SportType) => {
            const config = SPORT_CONFIG[sport];
            const Icon = ICON_MAP[config.icon] ?? IconActivity;
            const isActive = watchedSport === sport;

            return (
              <button
                key={sport}
                type="button"
                onClick={() => setValue('sport', sport)}
                className={`flex flex-col items-center gap-1 min-w-[60px] py-2 px-2 rounded-lg text-xs transition-all shrink-0 ${
                  isActive
                    ? 'bg-void-raised ring-2 ring-accent-teal text-text-bright'
                    : 'bg-void-deep text-text-dim hover:bg-void-overlay hover:text-text-default'
                }`}
              >
                <Icon width={18} height={18} className={isActive ? `text-${config.color}` : ''} />
                <span className="truncate">{config.label}</span>
              </button>
            );
          })}
        </div>
        {errors.sport && <p className="text-accent-coral text-xs mt-1">{errors.sport.message}</p>}
      </div>

      {/* Date */}
      <div>
        <label
          htmlFor="workout-date"
          className="text-xs font-medium text-text-dim uppercase tracking-wider mb-1.5 block"
        >
          Date
        </label>
        <input
          id="workout-date"
          type="date"
          {...register('date')}
          className="w-full bg-void-deep border border-edge-default rounded-md text-text-bright text-sm px-3 py-2 focus:ring-2 focus:ring-accent focus:border-accent-teal outline-none"
        />
        {errors.date && <p className="text-accent-coral text-xs mt-1">{errors.date.message}</p>}
      </div>

      {/* Distance */}
      <div>
        <label
          htmlFor="workout-distance"
          className="text-xs font-medium text-text-dim uppercase tracking-wider mb-1.5 block"
        >
          Distance (m)
        </label>
        <input
          id="workout-distance"
          type="number"
          step="1"
          placeholder="e.g. 2000"
          {...register('distanceM', { valueAsNumber: true })}
          className="w-full bg-void-deep border border-edge-default rounded-md text-text-bright placeholder:text-text-faint text-sm px-3 py-2 focus:ring-2 focus:ring-accent focus:border-accent-teal outline-none font-mono tabular-nums"
        />
      </div>

      {/* Duration */}
      <div>
        <label className="text-xs font-medium text-text-dim uppercase tracking-wider mb-1.5 block">
          Time
        </label>
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <input
              type="number"
              step="1"
              min="0"
              placeholder="0"
              {...register('durationMinutes', { valueAsNumber: true })}
              className="w-full bg-void-deep border border-edge-default rounded-md text-text-bright placeholder:text-text-faint text-sm pl-3 pr-10 py-2 focus:ring-2 focus:ring-accent focus:border-accent-teal outline-none font-mono tabular-nums"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-faint">
              min
            </span>
          </div>
          <span className="text-text-faint font-mono">:</span>
          <div className="flex-1 relative">
            <input
              type="number"
              step="1"
              min="0"
              max="59"
              placeholder="00"
              {...register('durationSeconds', { valueAsNumber: true })}
              className="w-full bg-void-deep border border-edge-default rounded-md text-text-bright placeholder:text-text-faint text-sm pl-3 pr-10 py-2 focus:ring-2 focus:ring-accent focus:border-accent-teal outline-none font-mono tabular-nums"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-faint">
              sec
            </span>
          </div>
        </div>
      </div>

      {/* Pace */}
      <div>
        <label className="text-xs font-medium text-text-dim uppercase tracking-wider mb-1.5 block">
          Pace {paceUnit && <span className="text-text-faint normal-case">({paceUnit})</span>}
        </label>
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <input
              type="number"
              step="1"
              min="0"
              placeholder="0"
              {...register('paceMinutes', { valueAsNumber: true })}
              className="w-full bg-void-deep border border-edge-default rounded-md text-text-bright placeholder:text-text-faint text-sm pl-3 pr-10 py-2 focus:ring-2 focus:ring-accent focus:border-accent-teal outline-none font-mono tabular-nums"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-faint">
              min
            </span>
          </div>
          <span className="text-text-faint font-mono">:</span>
          <div className="flex-1 relative">
            <input
              type="number"
              step="0.1"
              min="0"
              max="59.9"
              placeholder="00.0"
              {...register('paceSeconds', { valueAsNumber: true })}
              className="w-full bg-void-deep border border-edge-default rounded-md text-text-bright placeholder:text-text-faint text-sm pl-3 pr-10 py-2 focus:ring-2 focus:ring-accent focus:border-accent-teal outline-none font-mono tabular-nums"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-faint">
              sec
            </span>
          </div>
        </div>
      </div>

      {/* Watts (erg sports only) */}
      {isErgSport && (
        <div>
          <label
            htmlFor="workout-watts"
            className="text-xs font-medium text-text-dim uppercase tracking-wider mb-1.5 block"
          >
            Watts
          </label>
          <input
            id="workout-watts"
            type="number"
            step="1"
            min="0"
            placeholder="e.g. 250"
            {...register('avgWatts', { valueAsNumber: true })}
            className="w-full bg-void-deep border border-edge-default rounded-md text-text-bright placeholder:text-text-faint text-sm px-3 py-2 focus:ring-2 focus:ring-accent focus:border-accent-teal outline-none font-mono tabular-nums"
          />
        </div>
      )}

      {/* Notes */}
      <div>
        <label
          htmlFor="workout-notes"
          className="text-xs font-medium text-text-dim uppercase tracking-wider mb-1.5 block"
        >
          Notes
        </label>
        <textarea
          id="workout-notes"
          rows={3}
          placeholder="How did it feel?"
          {...register('notes')}
          className="w-full bg-void-deep border border-edge-default rounded-md text-text-bright placeholder:text-text-faint text-sm px-3 py-2 focus:ring-2 focus:ring-accent focus:border-accent-teal outline-none resize-none"
        />
      </div>

      {/* Error message */}
      {submitError && (
        <p className="text-accent-coral text-sm">
          {submitError.message ?? 'Failed to save workout'}
        </p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-accent-teal hover:bg-accent-teal-hover text-void-deep font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50"
      >
        {isPending ? 'Saving...' : 'Save Workout'}
      </button>
    </form>
  );
}
