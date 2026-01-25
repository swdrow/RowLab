// src/v2/components/training/assignments/AthleteWorkoutView.tsx

import React, { useMemo, useState } from 'react';
import { format, parseISO, isToday, isPast, isFuture, startOfWeek, endOfWeek, addWeeks } from 'date-fns';
import { useAthleteAssignments, useMarkWorkoutComplete } from '../../../hooks/useAssignments';
import { getWorkoutTypeColor } from '../../../utils/calendarHelpers';
import type { PlannedWorkout, WorkoutCompletion } from '../../../types/training';

interface AthleteWorkoutViewProps {
  athleteId: string;
  athleteName?: string;
  className?: string;
}

interface WorkoutWithStatus extends PlannedWorkout {
  completion?: WorkoutCompletion;
  isCompleted: boolean;
  isPastDue: boolean;
  isUpcoming: boolean;
}

/**
 * Athlete view of their assigned training plan workouts.
 * Shows upcoming workouts and allows marking as completed.
 */
export function AthleteWorkoutView({
  athleteId,
  athleteName,
  className = '',
}: AthleteWorkoutViewProps) {
  const [weekOffset, setWeekOffset] = useState(0);

  const currentDate = new Date();
  const weekStart = startOfWeek(addWeeks(currentDate, weekOffset), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });

  const { workouts, completions, isLoading, error } = useAthleteAssignments(
    athleteId,
    weekStart,
    weekEnd
  );
  const { markComplete, isMarking } = useMarkWorkoutComplete();

  // Merge workouts with completion status
  const workoutsWithStatus: WorkoutWithStatus[] = useMemo(() => {
    const completionMap = new Map(
      completions.map((c) => [c.plannedWorkoutId, c])
    );

    return workouts
      .filter((w) => w.scheduledDate)
      .map((workout) => {
        const completion = completionMap.get(workout.id);
        const workoutDate = parseISO(workout.scheduledDate!);

        return {
          ...workout,
          completion,
          isCompleted: !!completion,
          isPastDue: isPast(workoutDate) && !isToday(workoutDate) && !completion,
          isUpcoming: isFuture(workoutDate) || isToday(workoutDate),
        };
      })
      .sort((a, b) => {
        const dateA = parseISO(a.scheduledDate!);
        const dateB = parseISO(b.scheduledDate!);
        return dateA.getTime() - dateB.getTime();
      });
  }, [workouts, completions]);

  const handleMarkComplete = (workout: WorkoutWithStatus) => {
    markComplete({
      planId: workout.planId,
      workoutId: workout.id,
      athleteId,
      compliance: 1.0,
    });
  };

  // Group workouts by day
  const workoutsByDay = useMemo(() => {
    const grouped: Record<string, WorkoutWithStatus[]> = {};
    for (const workout of workoutsWithStatus) {
      const day = format(parseISO(workout.scheduledDate!), 'yyyy-MM-dd');
      if (!grouped[day]) grouped[day] = [];
      grouped[day].push(workout);
    }
    return grouped;
  }, [workoutsWithStatus]);

  const navigateWeek = (direction: 'prev' | 'next') => {
    setWeekOffset((prev) => direction === 'next' ? prev + 1 : prev - 1);
  };

  if (error) {
    return (
      <div className="text-center py-8 text-txt-tertiary">
        Failed to load workouts
      </div>
    );
  }

  return (
    <div className={`athlete-workout-view ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-txt-primary">
            {athleteName ? `${athleteName}'s Workouts` : 'My Workouts'}
          </h2>
          <p className="text-sm text-txt-secondary">
            {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigateWeek('prev')}
            className="p-2 text-txt-secondary hover:text-txt-primary transition-colors"
            aria-label="Previous week"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => setWeekOffset(0)}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors
              ${weekOffset === 0
                ? 'bg-accent-primary text-white'
                : 'text-txt-secondary hover:text-txt-primary'
              }`}
          >
            This Week
          </button>
          <button
            onClick={() => navigateWeek('next')}
            className="p-2 text-txt-secondary hover:text-txt-primary transition-colors"
            aria-label="Next week"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Workout List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-primary" />
        </div>
      ) : workoutsWithStatus.length === 0 ? (
        <div className="text-center py-12 text-txt-tertiary">
          <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p>No workouts scheduled for this week</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(workoutsByDay).map(([day, dayWorkouts]) => {
            const dayDate = parseISO(day);
            const isCurrentDay = isToday(dayDate);

            return (
              <div key={day}>
                <h3 className={`text-sm font-medium mb-2 ${
                  isCurrentDay ? 'text-accent-primary' : 'text-txt-secondary'
                }`}>
                  {isCurrentDay ? 'Today' : format(dayDate, 'EEEE, MMM d')}
                </h3>

                <div className="space-y-2">
                  {dayWorkouts.map((workout) => (
                    <div
                      key={workout.id}
                      className={`p-4 rounded-lg border transition-all
                        ${workout.isCompleted
                          ? 'bg-accent-success/10 border-accent-success/30'
                          : workout.isPastDue
                            ? 'bg-accent-destructive/10 border-accent-destructive/30'
                            : 'bg-surface-elevated border-bdr-default'
                        }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-2 h-2 rounded-full flex-shrink-0"
                              style={{ backgroundColor: getWorkoutTypeColor(workout.type) }}
                            />
                            <h4 className="font-medium text-txt-primary truncate">
                              {workout.name}
                            </h4>
                          </div>

                          {workout.description && (
                            <p className="text-sm text-txt-tertiary mt-1 line-clamp-2">
                              {workout.description}
                            </p>
                          )}

                          <div className="flex flex-wrap gap-3 mt-2 text-xs text-txt-secondary">
                            {workout.duration && (
                              <span>{Math.round(workout.duration / 60)} min</span>
                            )}
                            {workout.distance && (
                              <span>{workout.distance.toLocaleString()}m</span>
                            )}
                            {workout.intensity && (
                              <span className="capitalize">{workout.intensity}</span>
                            )}
                            {workout.estimatedTSS && (
                              <span>TSS: {workout.estimatedTSS}</span>
                            )}
                          </div>
                        </div>

                        <div className="flex-shrink-0">
                          {workout.isCompleted ? (
                            <div className="flex items-center gap-1 text-accent-success">
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              <span className="text-sm font-medium">Done</span>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleMarkComplete(workout)}
                              disabled={isMarking}
                              className="px-3 py-1.5 text-sm font-medium text-accent-primary
                                         border border-accent-primary rounded-md
                                         hover:bg-accent-primary hover:text-white
                                         disabled:opacity-50 transition-colors"
                            >
                              Mark Complete
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Summary */}
      {workoutsWithStatus.length > 0 && (
        <div className="mt-6 p-4 bg-surface-sunken rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <span className="text-txt-secondary">Week Summary</span>
            <span className="font-medium text-txt-primary">
              {workoutsWithStatus.filter((w) => w.isCompleted).length} / {workoutsWithStatus.length} completed
            </span>
          </div>
          <div className="mt-2 h-2 bg-surface-default rounded-full overflow-hidden">
            <div
              className="h-full bg-accent-success transition-all"
              style={{
                width: `${(workoutsWithStatus.filter((w) => w.isCompleted).length / workoutsWithStatus.length) * 100}%`,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default AthleteWorkoutView;
