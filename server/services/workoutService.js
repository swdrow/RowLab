import { prisma } from '../db/connection.js';

/**
 * Create a new workout
 */
export async function createWorkout(teamId, data) {
  const workout = await prisma.workout.create({
    data: {
      teamId,
      athleteId: data.athleteId,
      source: data.source || 'manual',
      c2LogbookId: data.c2LogbookId || null,
      date: new Date(data.date),
      distanceM: data.distanceM || null,
      durationSeconds: data.durationSeconds || null,
      strokeRate: data.strokeRate || null,
      calories: data.calories || null,
      dragFactor: data.dragFactor || null,
      deviceInfo: data.deviceInfo || null,
      rawData: data.rawData || null,
    },
    include: {
      athlete: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
  });

  return formatWorkout(workout);
}

/**
 * Get all workouts for a team with filters
 */
export async function getWorkouts(teamId, filters = {}) {
  const where = { teamId };

  if (filters.athleteId) {
    where.athleteId = filters.athleteId;
  }
  if (filters.source) {
    where.source = filters.source;
  }
  if (filters.fromDate) {
    where.date = { ...where.date, gte: new Date(filters.fromDate) };
  }
  if (filters.toDate) {
    where.date = { ...where.date, lte: new Date(filters.toDate) };
  }

  const workouts = await prisma.workout.findMany({
    where,
    include: {
      athlete: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
    orderBy: { date: 'desc' },
    take: filters.limit ? parseInt(filters.limit) : 100,
  });

  return workouts.map(formatWorkout);
}

/**
 * Get a single workout by ID
 */
export async function getWorkoutById(teamId, workoutId) {
  const workout = await prisma.workout.findFirst({
    where: { id: workoutId, teamId },
    include: {
      athlete: {
        select: { id: true, firstName: true, lastName: true },
      },
      telemetry: true,
    },
  });

  if (!workout) {
    throw new Error('Workout not found');
  }

  return formatWorkout(workout);
}

/**
 * Update a workout
 */
export async function updateWorkout(teamId, workoutId, data) {
  const existing = await prisma.workout.findFirst({
    where: { id: workoutId, teamId },
  });

  if (!existing) {
    throw new Error('Workout not found');
  }

  const updateData = {};
  const allowedFields = [
    'date', 'distanceM', 'durationSeconds', 'strokeRate',
    'calories', 'dragFactor', 'deviceInfo'
  ];

  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      updateData[field] = field === 'date' ? new Date(data[field]) : data[field];
    }
  }

  const workout = await prisma.workout.update({
    where: { id: workoutId },
    data: updateData,
    include: {
      athlete: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
  });

  return formatWorkout(workout);
}

/**
 * Delete a workout
 */
export async function deleteWorkout(teamId, workoutId) {
  const existing = await prisma.workout.findFirst({
    where: { id: workoutId, teamId },
  });

  if (!existing) {
    throw new Error('Workout not found');
  }

  await prisma.workout.delete({
    where: { id: workoutId },
  });

  return { deleted: true };
}

/**
 * Get athlete's workout summary
 */
export async function getAthleteWorkoutSummary(teamId, athleteId, days = 30) {
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - days);

  const workouts = await prisma.workout.findMany({
    where: {
      teamId,
      athleteId,
      date: { gte: fromDate },
    },
    orderBy: { date: 'desc' },
  });

  const summary = {
    totalWorkouts: workouts.length,
    totalDistance: workouts.reduce((sum, w) => sum + (w.distanceM || 0), 0),
    totalDuration: workouts.reduce((sum, w) => sum + (Number(w.durationSeconds) || 0), 0),
    averageStrokeRate: 0,
    bySource: {},
  };

  const strokeRates = workouts.filter(w => w.strokeRate).map(w => w.strokeRate);
  if (strokeRates.length > 0) {
    summary.averageStrokeRate = Math.round(
      strokeRates.reduce((a, b) => a + b, 0) / strokeRates.length
    );
  }

  for (const workout of workouts) {
    summary.bySource[workout.source] = (summary.bySource[workout.source] || 0) + 1;
  }

  return summary;
}

/**
 * Check if C2 logbook ID already exists (prevent duplicates)
 */
export async function c2LogbookIdExists(teamId, c2LogbookId) {
  const existing = await prisma.workout.findFirst({
    where: { teamId, c2LogbookId },
  });
  return !!existing;
}

/**
 * Bulk create workouts (for C2 sync)
 */
export async function bulkCreateWorkouts(teamId, workouts) {
  const results = { created: 0, skipped: 0, errors: [] };

  for (const workout of workouts) {
    try {
      // Skip if C2 logbook ID already exists
      if (workout.c2LogbookId) {
        const exists = await c2LogbookIdExists(teamId, workout.c2LogbookId);
        if (exists) {
          results.skipped++;
          continue;
        }
      }

      await createWorkout(teamId, workout);
      results.created++;
    } catch (error) {
      results.errors.push({ c2LogbookId: workout.c2LogbookId, error: error.message });
    }
  }

  return results;
}

/**
 * Format workout for API response
 */
function formatWorkout(workout) {
  return {
    id: workout.id,
    athleteId: workout.athleteId,
    athlete: workout.athlete ? {
      id: workout.athlete.id,
      name: `${workout.athlete.firstName} ${workout.athlete.lastName}`,
    } : null,
    source: workout.source,
    c2LogbookId: workout.c2LogbookId,
    date: workout.date,
    distanceM: workout.distanceM,
    durationSeconds: workout.durationSeconds ? Number(workout.durationSeconds) : null,
    strokeRate: workout.strokeRate,
    calories: workout.calories,
    dragFactor: workout.dragFactor,
    deviceInfo: workout.deviceInfo,
    telemetry: workout.telemetry || null,
    createdAt: workout.createdAt,
  };
}
