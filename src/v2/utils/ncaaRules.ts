import { parseISO, isWithinInterval, addDays, startOfWeek, endOfWeek, format } from 'date-fns';
import type { PracticeSession, NCAAAuditEntry } from '../types/training';

// NCAA limits
const WEEKLY_LIMIT_HOURS = 20;
const DAILY_LIMIT_HOURS = 4;
const WARNING_THRESHOLD_HOURS = 18;
const COMPETITION_HOURS = 3; // Competitions count as 3 hours per NCAA rules

/**
 * Calculate weekly hours for a single athlete.
 * NCAA week runs Monday-Sunday.
 */
export function calculateWeeklyHours(
  athleteId: string,
  weekStartDate: Date,
  sessions: PracticeSession[]
): { totalHours: number; isNearLimit: boolean; isOverLimit: boolean; dailyHours: Record<string, number> } {
  const weekEnd = addDays(weekStartDate, 7);
  const dailyHours: Record<string, number> = {};

  const weekSessions = sessions.filter(s =>
    s.athleteId === athleteId &&
    s.isCountable &&
    isWithinInterval(parseISO(s.date), { start: weekStartDate, end: weekEnd })
  );

  // Calculate daily totals
  for (const session of weekSessions) {
    const dateKey = session.date;
    const hours = session.isCompetition
      ? COMPETITION_HOURS
      : session.durationMinutes / 60;

    dailyHours[dateKey] = (dailyHours[dateKey] || 0) + hours;
  }

  const totalHours = Object.values(dailyHours).reduce((sum, h) => sum + h, 0);

  return {
    totalHours: Math.round(totalHours * 100) / 100,
    isNearLimit: totalHours >= WARNING_THRESHOLD_HOURS,
    isOverLimit: totalHours > WEEKLY_LIMIT_HOURS,
    dailyHours,
  };
}

/**
 * Validate daily hours for a single athlete on a specific date.
 */
export function validateDailyHours(
  athleteId: string,
  date: string,
  sessions: PracticeSession[]
): { dailyHours: number; isOverDailyLimit: boolean } {
  const daySessions = sessions.filter(s =>
    s.athleteId === athleteId &&
    s.date === date &&
    s.isCountable
  );

  const dailyMinutes = daySessions.reduce((sum, s) =>
    s.isCompetition ? sum + COMPETITION_HOURS * 60 : sum + s.durationMinutes, 0
  );

  const dailyHours = dailyMinutes / 60;

  return {
    dailyHours: Math.round(dailyHours * 100) / 100,
    isOverDailyLimit: dailyHours > DAILY_LIMIT_HOURS,
  };
}

/**
 * Check if adding a session would exceed limits.
 */
export function wouldExceedLimit(
  athleteId: string,
  proposedDate: Date,
  proposedDurationMinutes: number,
  isCompetition: boolean,
  existingSessions: PracticeSession[]
): { wouldExceedDaily: boolean; wouldExceedWeekly: boolean; projectedDailyHours: number; projectedWeeklyHours: number } {
  const dateStr = format(proposedDate, 'yyyy-MM-dd');
  const proposedHours = isCompetition ? COMPETITION_HOURS : proposedDurationMinutes / 60;

  // Check daily
  const { dailyHours: currentDaily } = validateDailyHours(athleteId, dateStr, existingSessions);
  const projectedDailyHours = currentDaily + proposedHours;

  // Check weekly
  const weekStart = startOfWeek(proposedDate, { weekStartsOn: 1 }); // Monday
  const { totalHours: currentWeekly } = calculateWeeklyHours(athleteId, weekStart, existingSessions);
  const projectedWeeklyHours = currentWeekly + proposedHours;

  return {
    wouldExceedDaily: projectedDailyHours > DAILY_LIMIT_HOURS,
    wouldExceedWeekly: projectedWeeklyHours > WEEKLY_LIMIT_HOURS,
    projectedDailyHours: Math.round(projectedDailyHours * 100) / 100,
    projectedWeeklyHours: Math.round(projectedWeeklyHours * 100) / 100,
  };
}

/**
 * Generate NCAA compliance report for a week.
 */
export function generateWeeklyReport(
  weekStartDate: Date,
  athletes: Array<{ id: string; name: string }>,
  sessions: PracticeSession[]
): NCAAAuditEntry[] {
  return athletes.map(athlete => {
    const { totalHours, isNearLimit, isOverLimit, dailyHours } = calculateWeeklyHours(
      athlete.id,
      weekStartDate,
      sessions
    );

    const athleteSessions = sessions.filter(s =>
      s.athleteId === athlete.id &&
      isWithinInterval(parseISO(s.date), { start: weekStartDate, end: addDays(weekStartDate, 7) })
    );

    return {
      athleteId: athlete.id,
      athleteName: athlete.name,
      weekStart: format(weekStartDate, 'yyyy-MM-dd'),
      dailyHours,
      weeklyTotal: totalHours,
      isNearLimit,
      isOverLimit,
      sessions: athleteSessions,
    };
  });
}

// Re-export constants for UI
export const NCAA_WEEKLY_LIMIT = WEEKLY_LIMIT_HOURS;
export const NCAA_DAILY_LIMIT = DAILY_LIMIT_HOURS;
export const NCAA_WARNING_THRESHOLD = WARNING_THRESHOLD_HOURS;
export const NCAA_COMPETITION_HOURS = COMPETITION_HOURS;
