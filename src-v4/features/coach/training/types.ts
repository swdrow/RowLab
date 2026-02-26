/**
 * Training feature types.
 *
 * Covers training plans, planned workouts, calendar events,
 * compliance tracking, and periodization blocks.
 */

// ---------------------------------------------------------------------------
// Periodization phase
// ---------------------------------------------------------------------------

export type TrainingPhase = 'Base' | 'Build' | 'Peak' | 'Taper' | 'Recovery';

// ---------------------------------------------------------------------------
// Workout type & intensity
// ---------------------------------------------------------------------------

export type WorkoutType = 'erg' | 'row' | 'cross_train' | 'strength' | 'rest';
export type Intensity = 'easy' | 'moderate' | 'hard' | 'max';

// ---------------------------------------------------------------------------
// Planned workout (within a training plan)
// ---------------------------------------------------------------------------

export interface PlanWorkout {
  id: string;
  planId: string;
  name: string;
  type: WorkoutType;
  description: string | null;
  scheduledDate: string | null;
  dayOfWeek: number | null; // 0=Sunday..6=Saturday
  weekNumber: number | null;
  duration: number | null; // seconds
  distance: number | null; // meters
  targetPace: number | null; // tenths of seconds per 500m
  targetHeartRate: number | null;
  intensity: Intensity | null;
  order: number;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Training plan
// ---------------------------------------------------------------------------

export interface TrainingPlan {
  id: string;
  teamId: string;
  name: string;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  phase: TrainingPhase | null;
  isTemplate: boolean;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  workouts?: PlanWorkout[];
  _count?: { assignments: number };
}

// ---------------------------------------------------------------------------
// Calendar event (rendered on the calendar)
// ---------------------------------------------------------------------------

export type CalendarEventType =
  | 'planned_workout'
  | 'completed_workout'
  | 'rest_day'
  | 'practice'
  | 'race';

export interface CalendarEvent {
  id: string;
  title: string;
  start: string; // ISO 8601
  end: string; // ISO 8601
  type: CalendarEventType;
  workoutType: WorkoutType | null;
  intensity: Intensity | null;
  planId: string | null;
  planName: string | null;
  isCompleted: boolean;
  athleteId: string | null;
  athleteName: string | null;
  metadata: Record<string, unknown> | null;
}

// ---------------------------------------------------------------------------
// Compliance data
// ---------------------------------------------------------------------------

export interface ComplianceData {
  athleteId: string;
  athleteName: string;
  assignmentId: string;
  planName: string;
  totalWorkouts: number;
  completedWorkouts: number;
  complianceRate: number; // 0..1
  missedWorkouts: number;
  streak: number;
  lastCompletedAt: string | null;
}

export interface WeeklyComplianceEntry {
  date: string;
  athleteId: string;
  athleteName: string;
  hoursLogged: number;
  type: string;
  isCountable: boolean;
}

export interface ComplianceReport {
  weekStart: string;
  totalAthletes: number;
  totalHours: number;
  averageHoursPerAthlete: number;
  maxHoursLimit: number;
  violations: Array<{
    athleteId: string;
    athleteName: string;
    hours: number;
    limit: number;
  }>;
}

// ---------------------------------------------------------------------------
// Periodization block
// ---------------------------------------------------------------------------

export interface PeriodizationBlock {
  id: string;
  planId: string;
  name: string;
  phase: TrainingPhase;
  startWeek: number;
  endWeek: number;
  focusArea: string | null;
  volumeMultiplier: number; // 1.0 = baseline
  intensityMultiplier: number;
}

// ---------------------------------------------------------------------------
// Training load (TSS / volume tracking)
// ---------------------------------------------------------------------------

export interface TrainingLoadWeek {
  weekStart: string;
  totalMinutes: number;
  totalDistance: number;
  sessionCount: number;
  avgIntensity: number | null;
  tss: number | null;
}

// ---------------------------------------------------------------------------
// Mutation inputs
// ---------------------------------------------------------------------------

export interface CreateTrainingPlanInput {
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  phase?: TrainingPhase;
  isTemplate?: boolean;
}

export interface UpdateTrainingPlanInput {
  name?: string;
  description?: string;
  startDate?: string | null;
  endDate?: string | null;
  phase?: TrainingPhase;
  isTemplate?: boolean;
}

export interface CreatePlannedWorkoutInput {
  name: string;
  type: WorkoutType;
  description?: string;
  scheduledDate?: string;
  dayOfWeek?: number;
  weekNumber?: number;
  duration?: number;
  distance?: number;
  targetPace?: number;
  targetHeartRate?: number;
  intensity?: Intensity;
  order?: number;
}

export interface UpdatePlannedWorkoutInput {
  name?: string;
  type?: WorkoutType;
  description?: string;
  scheduledDate?: string | null;
  dayOfWeek?: number | null;
  weekNumber?: number | null;
  duration?: number | null;
  distance?: number | null;
  targetPace?: number | null;
  targetHeartRate?: number | null;
  intensity?: Intensity;
  order?: number;
}

export interface AssignPlanInput {
  athleteIds: string[];
  startDate: string;
  endDate?: string;
}

export interface RecordCompletionInput {
  athleteId: string;
  workoutId?: string; // actual workout that fulfilled this
  compliance?: number; // 0..1
  notes?: string;
}

// ---------------------------------------------------------------------------
// Plan list filters
// ---------------------------------------------------------------------------

export interface PlanListFilters {
  isTemplate?: boolean;
  phase?: TrainingPhase;
  limit?: number;
}

export interface CalendarEventsFilters {
  startDate: string;
  endDate: string;
  athleteId?: string;
}

// ---------------------------------------------------------------------------
// Template (server-defined periodization template)
// ---------------------------------------------------------------------------

export interface PeriodizationTemplate {
  id: string;
  name: string;
  description: string;
  durationWeeks: number;
  phases: Array<{
    phase: TrainingPhase;
    weeks: number;
    focusArea: string;
  }>;
}
