import { prisma } from '../db/connection.js';
import { getAttendanceByDate } from './attendanceService.js';

/**
 * Get weekly NCAA compliance data for team or athlete
 * Returns array of audit entries with daily hours per athlete
 */
export async function getWeeklyCompliance(teamId, weekStart, athleteId = null) {
  const startDate = new Date(weekStart);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 7);

  // Build where clause
  const where = {
    teamId,
    date: {
      gte: startDate,
      lt: endDate,
    },
  };

  if (athleteId) {
    where.athleteId = athleteId;
  }

  // Get attendance records for the week
  const attendanceRecords = await prisma.attendance.findMany({
    where,
    include: {
      athlete: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: [
      { date: 'asc' },
      { athlete: { lastName: 'asc' } },
    ],
  });

  // Convert attendance records to audit entries
  // Group by athlete and calculate daily hours
  const athleteDailyHours = {};

  for (const record of attendanceRecords) {
    const athleteKey = record.athleteId;
    if (!athleteDailyHours[athleteKey]) {
      athleteDailyHours[athleteKey] = {
        athlete: record.athlete,
        dailyHours: {},
        totalWeekHours: 0,
      };
    }

    // Use durationMinutes if available, otherwise default to 2 hours
    const durationHours = record.durationMinutes
      ? record.durationMinutes / 60
      : 2.0;

    const dateKey = record.date.toISOString().split('T')[0];

    // Only count present and late attendance
    if (record.status === 'present' || record.status === 'late') {
      athleteDailyHours[athleteKey].dailyHours[dateKey] =
        (athleteDailyHours[athleteKey].dailyHours[dateKey] || 0) + durationHours;
      athleteDailyHours[athleteKey].totalWeekHours += durationHours;
    }
  }

  // Convert to audit entries array
  const auditEntries = [];

  for (const [athleteId, data] of Object.entries(athleteDailyHours)) {
    const weekHours = data.totalWeekHours;

    auditEntries.push({
      athleteId,
      athlete: data.athlete,
      weekStart: startDate,
      weekEnd: endDate,
      totalHours: weekHours,
      dailyHours: data.dailyHours,
      isNearLimit: weekHours >= 18,
      isOverLimit: weekHours > 20,
    });
  }

  return auditEntries;
}

/**
 * Get compliance audit report for a week
 * Aggregates weekly compliance into report format
 */
export async function getComplianceReport(teamId, weekStart) {
  const entries = await getWeeklyCompliance(teamId, weekStart);

  const athletesNearLimit = entries.filter(e => e.isNearLimit && !e.isOverLimit).length;
  const athletesOverLimit = entries.filter(e => e.isOverLimit).length;

  return {
    teamId,
    weekStart: new Date(weekStart),
    weekEnd: new Date(new Date(weekStart).setDate(new Date(weekStart).getDate() + 7)),
    entries,
    summary: {
      totalAthletes: entries.length,
      athletesNearLimit,
      athletesOverLimit,
    },
    generatedAt: new Date(),
  };
}

/**
 * Get training load (TSS and volume) over date range
 * Returns array of weekly load summaries
 */
export async function getTrainingLoad(teamId, startDate, endDate, athleteId = null) {
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Build where clause for workout completions
  const where = {
    athlete: {
      teamId,
    },
    completedAt: {
      gte: start,
      lte: end,
    },
  };

  if (athleteId) {
    where.athleteId = athleteId;
  }

  // Get all workout completions in date range
  const completions = await prisma.workoutCompletion.findMany({
    where,
    include: {
      plannedWorkout: true,
      workout: true,
      athlete: {
        select: {
          id: true,
          user: {
            select: {
              name: true,
            },
          },
        },
      },
    },
    orderBy: {
      completedAt: 'asc',
    },
  });

  // Group by week
  const weeklyLoads = {};

  for (const completion of completions) {
    const weekStart = getWeekStart(completion.completedAt);
    const weekKey = weekStart.toISOString();

    if (!weeklyLoads[weekKey]) {
      weeklyLoads[weekKey] = {
        weekStart,
        weekEnd: new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000),
        tss: 0,
        volumeMinutes: 0,
        workoutCount: 0,
      };
    }

    // Calculate TSS from planned workout
    if (completion.plannedWorkout) {
      const tss = calculateWorkoutTSS(completion.plannedWorkout);
      weeklyLoads[weekKey].tss += tss;

      const durationMinutes = completion.plannedWorkout.duration
        ? completion.plannedWorkout.duration / 60
        : 0;
      weeklyLoads[weekKey].volumeMinutes += durationMinutes;
    }

    // Add actual workout volume if available
    if (completion.workout && completion.workout.durationSeconds) {
      const actualMinutes = Number(completion.workout.durationSeconds) / 60;
      // Use actual if no planned duration
      if (!completion.plannedWorkout || !completion.plannedWorkout.duration) {
        weeklyLoads[weekKey].volumeMinutes += actualMinutes;
      }
    }

    weeklyLoads[weekKey].workoutCount += 1;
  }

  return Object.values(weeklyLoads).sort((a, b) =>
    a.weekStart.getTime() - b.weekStart.getTime()
  );
}

/**
 * Link attendance records to scheduled training sessions for a date
 * Maps athlete attendance to planned workouts for compliance tracking
 */
export async function linkAttendanceToTraining(teamId, date) {
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);

  // Get attendance records for this date
  const attendance = await getAttendanceByDate(teamId, targetDate);

  // Get planned workouts for this date
  const plannedWorkouts = await prisma.plannedWorkout.findMany({
    where: {
      plan: {
        teamId,
      },
      scheduledDate: {
        gte: targetDate,
        lt: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000),
      },
    },
    include: {
      plan: {
        include: {
          assignments: {
            select: {
              athleteId: true,
            },
          },
        },
      },
    },
  });

  // Create linked records
  const linkedRecords = [];

  for (const attendanceRecord of attendance) {
    // Find planned workouts that this athlete is assigned to
    const athletePlannedWorkouts = plannedWorkouts.filter(pw =>
      pw.plan.assignments.some(a => a.athleteId === attendanceRecord.athleteId)
    );

    for (const workout of athletePlannedWorkouts) {
      linkedRecords.push({
        attendanceId: attendanceRecord.id,
        athleteId: attendanceRecord.athleteId,
        athlete: attendanceRecord.athlete,
        plannedWorkoutId: workout.id,
        plannedWorkout: {
          id: workout.id,
          name: workout.name,
          type: workout.type,
          duration: workout.duration,
        },
        attendanceStatus: attendanceRecord.status,
        date: targetDate,
        participated: attendanceRecord.status === 'present' || attendanceRecord.status === 'late',
        durationMinutes: attendanceRecord.durationMinutes || null,
      });
    }

    // If no planned workouts, still include attendance record
    if (athletePlannedWorkouts.length === 0) {
      linkedRecords.push({
        attendanceId: attendanceRecord.id,
        athleteId: attendanceRecord.athleteId,
        athlete: attendanceRecord.athlete,
        plannedWorkoutId: null,
        plannedWorkout: null,
        attendanceStatus: attendanceRecord.status,
        date: targetDate,
        participated: attendanceRecord.status === 'present' || attendanceRecord.status === 'late',
        durationMinutes: attendanceRecord.durationMinutes || null,
      });
    }
  }

  return {
    date: targetDate,
    totalAttendanceRecords: attendance.length,
    totalPlannedWorkouts: plannedWorkouts.length,
    linkedRecords,
  };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get week start date (Monday) for a given date
 */
function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  // Convert to Monday-start week
  const offset = day === 0 ? 6 : day - 1;
  const diff = d.getDate() - offset;
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Calculate Training Stress Score (TSS) for a workout
 */
function calculateWorkoutTSS(workout) {
  const intensityFactor = {
    easy: 0.6,
    moderate: 0.8,
    hard: 0.95,
    max: 1.0,
  };

  const factor = intensityFactor[workout.intensity] || 0.7;
  const duration = workout.duration || 2700; // Default 45 min

  // TSS = (duration in hours) * IF^2 * 100
  const hours = duration / 3600;
  return Math.round(hours * factor * factor * 100);
}
