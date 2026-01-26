// src/v2/types/training.ts

// ============================================
// PERIODIZATION
// ============================================

export type PeriodizationPhase = 'base' | 'build' | 'peak' | 'taper';

export interface PeriodizationBlock {
  id: string;
  phase: PeriodizationPhase;
  name: string;
  startDate: string; // ISO date
  endDate: string;
  weeklyTSSTarget?: number;
  focusAreas: string[];
  templateId?: string;
  color: string; // For calendar visualization
}

// ============================================
// WORKOUTS
// ============================================

export type WorkoutType = 'erg' | 'row' | 'cross_train' | 'strength' | 'recovery';
export type IntensityLevel = 'easy' | 'moderate' | 'hard' | 'max';

export interface Exercise {
  id: string;
  name: string;
  sets?: number;
  reps?: number;
  duration?: number; // seconds
  distance?: number; // meters
  intensity?: string; // e.g., "70% FTP", "Rate 22"
  notes?: string;
}

export interface PlannedWorkout {
  id: string;
  planId: string;
  name: string;
  type: WorkoutType;
  description?: string;
  scheduledDate?: string; // ISO date
  dayOfWeek?: number; // 0-6 for recurring
  weekNumber?: number; // For periodization
  duration?: number; // seconds
  distance?: number; // meters
  targetPace?: number; // seconds per 500m
  targetHeartRate?: number;
  intensity?: IntensityLevel;
  exercises?: Exercise[];
  estimatedTSS?: number;
  recurrenceRule?: string; // RRULE format
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface WorkoutFormData {
  name: string;
  type: WorkoutType;
  description?: string;
  scheduledDate?: string;
  duration?: number;
  distance?: number;
  targetPace?: number;
  targetHeartRate?: number;
  intensity?: IntensityLevel;
  exercises?: Omit<Exercise, 'id'>[];
  estimatedTSS?: number;
}

// ============================================
// TRAINING PLANS
// ============================================

export interface TrainingPlan {
  id: string;
  name: string;
  description?: string;
  teamId: string;
  createdBy: string;
  startDate?: string;
  endDate?: string;
  phase?: PeriodizationPhase;
  isTemplate: boolean;
  workouts?: PlannedWorkout[];
  createdAt: string;
  updatedAt: string;
}

export interface TrainingPlanFormData {
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  phase?: PeriodizationPhase;
  isTemplate?: boolean;
}

// ============================================
// ASSIGNMENTS & COMPLETIONS
// ============================================

export type AssignmentStatus = 'active' | 'completed' | 'cancelled';

export interface WorkoutAssignment {
  id: string;
  planId: string;
  athleteId: string;
  assignedBy: string;
  assignedAt: string;
  startDate: string;
  endDate?: string;
  status: AssignmentStatus;
  plan?: TrainingPlan;
}

export interface WorkoutCompletion {
  id: string;
  plannedWorkoutId: string;
  athleteId: string;
  workoutId?: string;
  completedAt: string;
  compliance?: number; // 0-1
  notes?: string;
  plannedWorkout?: PlannedWorkout;
}

// ============================================
// CALENDAR EVENTS
// ============================================

export type CalendarEventType = 'workout' | 'recruit_visit' | 'session';

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  type?: CalendarEventType;
  resource?: {
    // Workout fields
    workoutId?: string;
    planId?: string;
    type?: WorkoutType;
    intensity?: IntensityLevel;
    tss?: number;
    isRecurring?: boolean;
    parentId?: string;
    blockId?: string;
    blockPhase?: PeriodizationPhase;

    // Recruit visit fields
    visitId?: string;
    recruitName?: string;
    hostAthleteId?: string;
    hostAthleteName?: string;
    visitStatus?: 'scheduled' | 'completed' | 'cancelled';
  };
}

// ============================================
// CALENDAR EVENT HELPERS
// ============================================

import type { RecruitVisit } from './recruiting';

/**
 * Convert a RecruitVisit to a CalendarEvent for calendar display
 */
export function recruitVisitToCalendarEvent(visit: RecruitVisit): CalendarEvent {
  const [startHour, startMin] = visit.startTime.split(':').map(Number);
  const [endHour, endMin] = visit.endTime.split(':').map(Number);

  const startDate = new Date(visit.date);
  startDate.setHours(startHour, startMin, 0, 0);

  const endDate = new Date(visit.date);
  endDate.setHours(endHour, endMin, 0, 0);

  return {
    id: `recruit-${visit.id}`,
    title: `Recruit: ${visit.recruitName}`,
    start: startDate,
    end: endDate,
    allDay: false,
    type: 'recruit_visit',
    resource: {
      visitId: visit.id,
      recruitName: visit.recruitName,
      hostAthleteId: visit.hostAthleteId,
      hostAthleteName: visit.hostAthlete
        ? `${visit.hostAthlete.firstName} ${visit.hostAthlete.lastName}`
        : undefined,
      visitStatus: visit.status,
    },
  };
}

// ============================================
// TSS CALCULATION
// ============================================

export interface WorkoutData {
  durationSeconds: number;
  avgWatts?: number;
  avgHeartRate?: number;
  ftp?: number; // Functional Threshold Power
  fthr?: number; // Functional Threshold Heart Rate
}

export interface WeeklyLoad {
  week: string;
  weekStart: string;
  tss: number;
  volume: number; // minutes
  workoutCount: number;
}

// ============================================
// NCAA COMPLIANCE
// ============================================

export type ActivityType = 'practice' | 'competition' | 'strength' | 'film' | 'voluntary';

export interface PracticeSession {
  id: string;
  athleteId: string;
  date: string; // ISO date
  durationMinutes: number;
  isCompetition: boolean;
  activityType: ActivityType;
  isCountable: boolean; // Coach-marked as CARA
  notes?: string;
}

export interface NCAAAuditEntry {
  athleteId: string;
  athleteName: string;
  weekStart: string;
  dailyHours: Record<string, number>; // ISO date -> hours
  weeklyTotal: number;
  isNearLimit: boolean; // >= 18 hours
  isOverLimit: boolean; // > 20 hours
  sessions: PracticeSession[];
}

export interface NCAAComplianceReport {
  weekStart: string;
  weekEnd: string;
  teamId: string;
  entries: NCAAAuditEntry[];
  athletesNearLimit: number;
  athletesOverLimit: number;
  generatedAt: string;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface TrainingApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}
