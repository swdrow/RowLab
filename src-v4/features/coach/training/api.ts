/**
 * Training plans API layer.
 *
 * Query option factories and mutation functions for TanStack Query.
 * Backend routes: /api/v1/training-plans/*
 *
 * Note: These endpoints use the v1 namespace (team-isolated via
 * activeTeamId from the auth token), not the v4 /api/u/ namespace.
 */
import { queryOptions } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
  TrainingPlan,
  PlanWorkout,
  CalendarEvent,
  WeeklyComplianceEntry,
  ComplianceReport,
  TrainingLoadWeek,
  PeriodizationTemplate,
  PlanListFilters,
  CalendarEventsFilters,
  CreateTrainingPlanInput,
  UpdateTrainingPlanInput,
  CreatePlannedWorkoutInput,
  UpdatePlannedWorkoutInput,
  AssignPlanInput,
  RecordCompletionInput,
} from './types';

// ---------------------------------------------------------------------------
// Query key factory
// ---------------------------------------------------------------------------

export const trainingKeys = {
  all: ['training'] as const,
  plans: () => [...trainingKeys.all, 'plans'] as const,
  planList: (filters?: PlanListFilters) =>
    [...trainingKeys.plans(), 'list', filters ?? {}] as const,
  planDetail: (planId: string) => [...trainingKeys.plans(), 'detail', planId] as const,
  templates: () => [...trainingKeys.all, 'templates'] as const,
  calendar: (filters: CalendarEventsFilters) => [...trainingKeys.all, 'calendar', filters] as const,
  compliance: () => [...trainingKeys.all, 'compliance'] as const,
  weeklyCompliance: (weekStart: string, athleteId?: string) =>
    [...trainingKeys.compliance(), 'weekly', weekStart, athleteId] as const,
  complianceReport: (weekStart: string) =>
    [...trainingKeys.compliance(), 'report', weekStart] as const,
  athletePlans: (athleteId: string) => [...trainingKeys.all, 'athletePlans', athleteId] as const,
  trainingLoad: (startDate: string, endDate: string, athleteId?: string) =>
    [...trainingKeys.all, 'load', startDate, endDate, athleteId] as const,
};

// ---------------------------------------------------------------------------
// API functions -- reads
// ---------------------------------------------------------------------------

async function fetchPlans(filters?: PlanListFilters): Promise<TrainingPlan[]> {
  const params: Record<string, string> = {};
  if (filters?.isTemplate !== undefined) params.isTemplate = String(filters.isTemplate);
  if (filters?.phase) params.phase = filters.phase;
  if (filters?.limit) params.limit = String(filters.limit);

  const res = await api.get('/api/v1/training-plans', { params });
  return res.data.data.plans as TrainingPlan[];
}

async function fetchPlanDetail(planId: string): Promise<TrainingPlan> {
  const res = await api.get(`/api/v1/training-plans/${planId}`);
  return res.data.data.plan as TrainingPlan;
}

async function fetchTemplates(): Promise<PeriodizationTemplate[]> {
  const res = await api.get('/api/v1/training-plans/templates');
  return res.data.data.templates as PeriodizationTemplate[];
}

async function fetchCalendarEvents(filters: CalendarEventsFilters): Promise<CalendarEvent[]> {
  // Calendar events are synthesized from planned workouts within a date range.
  // The backend returns planned workouts; we'll transform them into CalendarEvents.
  const params: Record<string, string> = {};
  if (filters.startDate) params.startDate = filters.startDate;
  if (filters.endDate) params.endDate = filters.endDate;
  if (filters.athleteId) params.athleteId = filters.athleteId;

  // Use the plans endpoint with date filtering. Backend may return workouts
  // with scheduledDate in range. For now, fetch all plans and filter client-side.
  const plans = await fetchPlans();
  const events: CalendarEvent[] = [];

  for (const plan of plans) {
    if (!plan.workouts) continue;
    for (const workout of plan.workouts) {
      if (!workout.scheduledDate) continue;
      const scheduledDate = workout.scheduledDate;
      if (scheduledDate < filters.startDate || scheduledDate > filters.endDate) continue;

      events.push({
        id: workout.id,
        title: workout.name,
        start: scheduledDate,
        end: scheduledDate,
        type: 'planned_workout',
        workoutType: workout.type,
        intensity: workout.intensity,
        planId: plan.id,
        planName: plan.name,
        isCompleted: false,
        athleteId: null,
        athleteName: null,
        metadata: {
          duration: workout.duration,
          distance: workout.distance,
          targetPace: workout.targetPace,
        },
      });
    }
  }

  return events;
}

async function fetchWeeklyCompliance(
  weekStart: string,
  athleteId?: string
): Promise<WeeklyComplianceEntry[]> {
  const params: Record<string, string> = { weekStart };
  if (athleteId) params.athleteId = athleteId;

  const res = await api.get('/api/v1/training-plans/compliance/weekly', { params });
  return res.data.data.entries as WeeklyComplianceEntry[];
}

async function fetchComplianceReport(weekStart: string): Promise<ComplianceReport> {
  const res = await api.get('/api/v1/training-plans/compliance/report', {
    params: { weekStart },
  });
  return res.data.data.report as ComplianceReport;
}

async function fetchAthletePlans(athleteId: string): Promise<TrainingPlan[]> {
  const res = await api.get(`/api/v1/training-plans/athlete/${athleteId}`);
  return res.data.data.plans as TrainingPlan[];
}

async function fetchTrainingLoad(
  startDate: string,
  endDate: string,
  athleteId?: string
): Promise<TrainingLoadWeek[]> {
  const params: Record<string, string> = { startDate, endDate };
  if (athleteId) params.athleteId = athleteId;

  const res = await api.get('/api/v1/training-plans/load', { params });
  return res.data.data.weeks as TrainingLoadWeek[];
}

// ---------------------------------------------------------------------------
// Query option factories
// ---------------------------------------------------------------------------

export function plansOptions(filters?: PlanListFilters) {
  return queryOptions<TrainingPlan[]>({
    queryKey: trainingKeys.planList(filters),
    queryFn: () => fetchPlans(filters),
    staleTime: 120_000,
  });
}

export function planDetailOptions(planId: string) {
  return queryOptions<TrainingPlan>({
    queryKey: trainingKeys.planDetail(planId),
    queryFn: () => fetchPlanDetail(planId),
    staleTime: 120_000,
    enabled: !!planId,
  });
}

export function templatesOptions() {
  return queryOptions<PeriodizationTemplate[]>({
    queryKey: trainingKeys.templates(),
    queryFn: fetchTemplates,
    staleTime: 300_000, // templates change rarely
  });
}

export function calendarEventsOptions(filters: CalendarEventsFilters) {
  return queryOptions<CalendarEvent[]>({
    queryKey: trainingKeys.calendar(filters),
    queryFn: () => fetchCalendarEvents(filters),
    staleTime: 60_000,
    enabled: !!filters.startDate && !!filters.endDate,
  });
}

export function weeklyComplianceOptions(weekStart: string, athleteId?: string) {
  return queryOptions<WeeklyComplianceEntry[]>({
    queryKey: trainingKeys.weeklyCompliance(weekStart, athleteId),
    queryFn: () => fetchWeeklyCompliance(weekStart, athleteId),
    staleTime: 120_000,
    enabled: !!weekStart,
  });
}

export function complianceReportOptions(weekStart: string) {
  return queryOptions<ComplianceReport>({
    queryKey: trainingKeys.complianceReport(weekStart),
    queryFn: () => fetchComplianceReport(weekStart),
    staleTime: 120_000,
    enabled: !!weekStart,
  });
}

export function athletePlansOptions(athleteId: string) {
  return queryOptions<TrainingPlan[]>({
    queryKey: trainingKeys.athletePlans(athleteId),
    queryFn: () => fetchAthletePlans(athleteId),
    staleTime: 120_000,
    enabled: !!athleteId,
  });
}

export function trainingLoadOptions(startDate: string, endDate: string, athleteId?: string) {
  return queryOptions<TrainingLoadWeek[]>({
    queryKey: trainingKeys.trainingLoad(startDate, endDate, athleteId),
    queryFn: () => fetchTrainingLoad(startDate, endDate, athleteId),
    staleTime: 120_000,
    enabled: !!startDate && !!endDate,
  });
}

// ---------------------------------------------------------------------------
// Mutation functions (consumed by useMutation in components)
// ---------------------------------------------------------------------------

export async function createPlan(input: CreateTrainingPlanInput): Promise<TrainingPlan> {
  const res = await api.post('/api/v1/training-plans', input);
  return res.data.data.plan as TrainingPlan;
}

export async function updatePlan(
  planId: string,
  input: UpdateTrainingPlanInput
): Promise<TrainingPlan> {
  const res = await api.put(`/api/v1/training-plans/${planId}`, input);
  return res.data.data.plan as TrainingPlan;
}

export async function deletePlan(planId: string): Promise<void> {
  await api.delete(`/api/v1/training-plans/${planId}`);
}

export async function duplicatePlan(planId: string): Promise<TrainingPlan> {
  const res = await api.post(`/api/v1/training-plans/${planId}/duplicate`);
  return res.data.data.plan as TrainingPlan;
}

export async function createFromTemplate(
  templateId: string,
  name?: string,
  startDate?: string
): Promise<TrainingPlan> {
  const res = await api.post('/api/v1/training-plans/from-template', {
    templateId,
    name,
    startDate,
  });
  return res.data.data.plan as TrainingPlan;
}

export async function addWorkoutToPlan(
  planId: string,
  input: CreatePlannedWorkoutInput
): Promise<PlanWorkout> {
  const res = await api.post(`/api/v1/training-plans/${planId}/workouts`, input);
  return res.data.data.workout as PlanWorkout;
}

export async function updatePlannedWorkout(
  planId: string,
  workoutId: string,
  input: UpdatePlannedWorkoutInput
): Promise<PlanWorkout> {
  const res = await api.put(`/api/v1/training-plans/${planId}/workouts/${workoutId}`, input);
  return res.data.data.workout as PlanWorkout;
}

export async function deletePlannedWorkout(planId: string, workoutId: string): Promise<void> {
  await api.delete(`/api/v1/training-plans/${planId}/workouts/${workoutId}`);
}

export async function assignPlanToAthletes(planId: string, input: AssignPlanInput): Promise<void> {
  await api.post(`/api/v1/training-plans/${planId}/assign`, input);
}

export async function removeAssignment(planId: string, assignmentId: string): Promise<void> {
  await api.delete(`/api/v1/training-plans/${planId}/assignments/${assignmentId}`);
}

export async function recordCompletion(
  planId: string,
  workoutId: string,
  input: RecordCompletionInput
): Promise<void> {
  await api.post(`/api/v1/training-plans/${planId}/workouts/${workoutId}/complete`, input);
}
