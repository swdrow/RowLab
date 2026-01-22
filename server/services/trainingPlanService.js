import { prisma } from '../db/connection.js';

// ============================================
// TRAINING PLAN CRUD
// ============================================

/**
 * Create a new training plan
 */
export async function createPlan(teamId, userId, planData) {
  const plan = await prisma.trainingPlan.create({
    data: {
      teamId,
      createdBy: userId,
      name: planData.name,
      description: planData.description || null,
      startDate: planData.startDate ? new Date(planData.startDate) : null,
      endDate: planData.endDate ? new Date(planData.endDate) : null,
      phase: planData.phase || null,
      isTemplate: planData.isTemplate || false,
    },
    include: {
      creator: { select: { id: true, name: true } },
      workouts: true,
      assignments: { include: { athlete: true } },
    },
  });

  return formatPlan(plan);
}

/**
 * Get a training plan by ID
 */
export async function getPlanById(planId, teamId) {
  const plan = await prisma.trainingPlan.findFirst({
    where: { id: planId, teamId },
    include: {
      creator: { select: { id: true, name: true } },
      workouts: {
        orderBy: [{ scheduledDate: 'asc' }, { order: 'asc' }],
        include: {
          completions: {
            include: { athlete: true },
          },
        },
      },
      assignments: {
        include: {
          athlete: {
            include: {
              user: { select: { id: true, name: true } },
            },
          },
        },
      },
    },
  });

  if (!plan) {
    throw new Error('Training plan not found');
  }

  return formatPlan(plan);
}

/**
 * Update a training plan
 */
export async function updatePlan(planId, teamId, updates) {
  const existing = await prisma.trainingPlan.findFirst({
    where: { id: planId, teamId },
  });

  if (!existing) {
    throw new Error('Training plan not found');
  }

  const updateData = {};
  const allowedFields = ['name', 'description', 'startDate', 'endDate', 'phase', 'isTemplate'];

  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      if (field === 'startDate' || field === 'endDate') {
        updateData[field] = updates[field] ? new Date(updates[field]) : null;
      } else {
        updateData[field] = updates[field];
      }
    }
  }

  const plan = await prisma.trainingPlan.update({
    where: { id: planId },
    data: updateData,
    include: {
      creator: { select: { id: true, name: true } },
      workouts: { orderBy: [{ scheduledDate: 'asc' }, { order: 'asc' }] },
      assignments: { include: { athlete: true } },
    },
  });

  return formatPlan(plan);
}

/**
 * Delete a training plan
 */
export async function deletePlan(planId, teamId) {
  const existing = await prisma.trainingPlan.findFirst({
    where: { id: planId, teamId },
  });

  if (!existing) {
    throw new Error('Training plan not found');
  }

  await prisma.trainingPlan.delete({
    where: { id: planId },
  });

  return { deleted: true };
}

/**
 * List training plans for a team
 */
export async function listPlans(teamId, filters = {}) {
  const where = { teamId };

  if (filters.isTemplate !== undefined) {
    where.isTemplate = filters.isTemplate;
  }
  if (filters.phase) {
    where.phase = filters.phase;
  }
  if (filters.createdBy) {
    where.createdBy = filters.createdBy;
  }

  const plans = await prisma.trainingPlan.findMany({
    where,
    include: {
      creator: { select: { id: true, name: true } },
      workouts: { select: { id: true } },
      assignments: { select: { id: true, athleteId: true, status: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: filters.limit ? parseInt(filters.limit) : 50,
  });

  return plans.map(formatPlanSummary);
}

// ============================================
// PLANNED WORKOUT MANAGEMENT
// ============================================

/**
 * Add a workout to a plan
 */
export async function addWorkoutToPlan(planId, teamId, workoutData) {
  // Verify plan exists and belongs to team
  const plan = await prisma.trainingPlan.findFirst({
    where: { id: planId, teamId },
  });

  if (!plan) {
    throw new Error('Training plan not found');
  }

  const workout = await prisma.plannedWorkout.create({
    data: {
      planId,
      name: workoutData.name,
      type: workoutData.type,
      description: workoutData.description || null,
      scheduledDate: workoutData.scheduledDate ? new Date(workoutData.scheduledDate) : null,
      dayOfWeek: workoutData.dayOfWeek ?? null,
      weekNumber: workoutData.weekNumber ?? null,
      duration: workoutData.duration ?? null,
      distance: workoutData.distance ?? null,
      targetPace: workoutData.targetPace ?? null,
      targetHeartRate: workoutData.targetHeartRate ?? null,
      intensity: workoutData.intensity || null,
      recurrenceRule: workoutData.recurrenceRule || null,
      order: workoutData.order ?? 0,
    },
  });

  return formatWorkout(workout);
}

/**
 * Update a planned workout
 */
export async function updatePlannedWorkout(workoutId, teamId, updates) {
  // Verify workout exists and belongs to team
  const existing = await prisma.plannedWorkout.findFirst({
    where: { id: workoutId },
    include: { plan: { select: { teamId: true } } },
  });

  if (!existing || existing.plan.teamId !== teamId) {
    throw new Error('Planned workout not found');
  }

  const updateData = {};
  const allowedFields = [
    'name', 'type', 'description', 'scheduledDate', 'dayOfWeek', 'weekNumber',
    'duration', 'distance', 'targetPace', 'targetHeartRate', 'intensity',
    'recurrenceRule', 'order'
  ];

  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      if (field === 'scheduledDate') {
        updateData[field] = updates[field] ? new Date(updates[field]) : null;
      } else {
        updateData[field] = updates[field];
      }
    }
  }

  const workout = await prisma.plannedWorkout.update({
    where: { id: workoutId },
    data: updateData,
  });

  return formatWorkout(workout);
}

/**
 * Delete a planned workout
 */
export async function deletePlannedWorkout(workoutId, teamId) {
  const existing = await prisma.plannedWorkout.findFirst({
    where: { id: workoutId },
    include: { plan: { select: { teamId: true } } },
  });

  if (!existing || existing.plan.teamId !== teamId) {
    throw new Error('Planned workout not found');
  }

  await prisma.plannedWorkout.delete({
    where: { id: workoutId },
  });

  return { deleted: true };
}

// ============================================
// ATHLETE ASSIGNMENTS
// ============================================

/**
 * Assign a plan to athletes
 */
export async function assignPlanToAthletes(planId, teamId, athleteIds, assignedBy, dateRange) {
  // Verify plan exists and belongs to team
  const plan = await prisma.trainingPlan.findFirst({
    where: { id: planId, teamId },
  });

  if (!plan) {
    throw new Error('Training plan not found');
  }

  // Verify all athletes are team members
  const members = await prisma.teamMember.findMany({
    where: {
      id: { in: athleteIds },
      teamId,
    },
  });

  if (members.length !== athleteIds.length) {
    throw new Error('One or more athletes not found in team');
  }

  // Create assignments using upsert to avoid duplicates - wrapped in transaction for atomicity
  const startDate = new Date(dateRange.startDate);
  const endDate = dateRange.endDate ? new Date(dateRange.endDate) : null;

  const upsertOperations = athleteIds.map((athleteId) =>
    prisma.workoutAssignment.upsert({
      where: {
        planId_athleteId: { planId, athleteId },
      },
      create: {
        planId,
        athleteId,
        assignedBy,
        startDate,
        endDate,
        status: 'active',
      },
      update: {
        assignedBy,
        startDate,
        endDate,
        status: 'active',
        assignedAt: new Date(),
      },
      include: {
        athlete: {
          include: { user: { select: { id: true, name: true } } },
        },
      },
    })
  );

  const assignments = await prisma.$transaction(upsertOperations);
  return assignments.map(formatAssignment);
}

/**
 * Remove an assignment
 */
export async function removeAssignment(assignmentId, teamId) {
  const assignment = await prisma.workoutAssignment.findFirst({
    where: { id: assignmentId },
    include: { plan: { select: { teamId: true } } },
  });

  if (!assignment || assignment.plan.teamId !== teamId) {
    throw new Error('Assignment not found');
  }

  await prisma.workoutAssignment.delete({
    where: { id: assignmentId },
  });

  return { deleted: true };
}

/**
 * Get plans assigned to an athlete
 */
export async function getAthletePlans(athleteId, teamId) {
  const assignments = await prisma.workoutAssignment.findMany({
    where: {
      athleteId,
      plan: { teamId },
      status: 'active',
    },
    include: {
      plan: {
        include: {
          workouts: {
            orderBy: [{ scheduledDate: 'asc' }, { order: 'asc' }],
          },
        },
      },
    },
  });

  return assignments.map(a => ({
    assignment: formatAssignment(a),
    plan: formatPlan(a.plan),
  }));
}

// ============================================
// WORKOUT COMPLETION TRACKING
// ============================================

/**
 * Record a workout completion
 */
export async function recordCompletion(plannedWorkoutId, athleteId, teamId, data = {}) {
  // Verify workout exists and belongs to team
  const workout = await prisma.plannedWorkout.findFirst({
    where: { id: plannedWorkoutId },
    include: { plan: { select: { teamId: true } } },
  });

  if (!workout || workout.plan.teamId !== teamId) {
    throw new Error('Planned workout not found');
  }

  const completion = await prisma.workoutCompletion.upsert({
    where: {
      plannedWorkoutId_athleteId: { plannedWorkoutId, athleteId },
    },
    create: {
      plannedWorkoutId,
      athleteId,
      workoutId: data.workoutId || null,
      compliance: data.compliance ?? null,
      notes: data.notes || null,
    },
    update: {
      workoutId: data.workoutId || null,
      compliance: data.compliance ?? null,
      notes: data.notes || null,
      completedAt: new Date(),
    },
    include: {
      plannedWorkout: true,
      athlete: true,
      workout: true,
    },
  });

  return formatCompletion(completion);
}

/**
 * Calculate compliance for an assignment
 */
export async function calculateCompliance(assignmentId, teamId) {
  const assignment = await prisma.workoutAssignment.findFirst({
    where: { id: assignmentId },
    include: {
      plan: {
        select: {
          teamId: true,
          workouts: {
            where: {
              scheduledDate: { lte: new Date() },
            },
          },
        },
      },
    },
  });

  if (!assignment || assignment.plan.teamId !== teamId) {
    throw new Error('Assignment not found');
  }

  const completions = await prisma.workoutCompletion.findMany({
    where: {
      athleteId: assignment.athleteId,
      plannedWorkoutId: {
        in: assignment.plan.workouts.map(w => w.id),
      },
    },
  });

  const totalWorkouts = assignment.plan.workouts.length;
  const completedWorkouts = completions.length;
  const avgCompliance = completions.length > 0
    ? completions.reduce((sum, c) => sum + (c.compliance || 1), 0) / completions.length
    : 0;

  return {
    assignmentId,
    totalWorkouts,
    completedWorkouts,
    completionRate: totalWorkouts > 0 ? completedWorkouts / totalWorkouts : 0,
    averageCompliance: avgCompliance,
  };
}

/**
 * Get training load for an athlete over a date range
 */
export async function getTrainingLoad(athleteId, teamId, dateRange) {
  const startDate = new Date(dateRange.startDate);
  const endDate = new Date(dateRange.endDate);

  // Get planned workouts for this athlete
  const assignments = await prisma.workoutAssignment.findMany({
    where: {
      athleteId,
      plan: { teamId },
      status: 'active',
    },
    include: {
      plan: {
        include: {
          workouts: {
            where: {
              scheduledDate: {
                gte: startDate,
                lte: endDate,
              },
            },
          },
        },
      },
    },
  });

  // Get completions for these workouts
  const plannedWorkoutIds = assignments.flatMap(a => a.plan.workouts.map(w => w.id));
  const completions = await prisma.workoutCompletion.findMany({
    where: {
      athleteId,
      plannedWorkoutId: { in: plannedWorkoutIds },
    },
  });

  // Get actual workouts in this date range
  const actualWorkouts = await prisma.workout.findMany({
    where: {
      teamId,
      OR: [
        { athleteId: athleteId },
        {
          completions: {
            some: { athleteId },
          },
        },
      ],
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  // Calculate weekly loads
  const weeklyLoads = {};
  const plannedWorkouts = assignments.flatMap(a => a.plan.workouts);

  for (const workout of plannedWorkouts) {
    if (!workout.scheduledDate) continue;
    const weekStart = getWeekStart(workout.scheduledDate);
    const key = weekStart.toISOString();
    if (!weeklyLoads[key]) {
      weeklyLoads[key] = { planned: 0, actual: 0, weekStart };
    }
    weeklyLoads[key].planned += calculateWorkoutLoad(workout);
  }

  for (const workout of actualWorkouts) {
    const weekStart = getWeekStart(workout.date);
    const key = weekStart.toISOString();
    if (!weeklyLoads[key]) {
      weeklyLoads[key] = { planned: 0, actual: 0, weekStart };
    }
    weeklyLoads[key].actual += calculateActualWorkoutLoad(workout);
  }

  return {
    athleteId,
    dateRange: { startDate, endDate },
    plannedWorkoutsCount: plannedWorkouts.length,
    completedWorkoutsCount: completions.length,
    actualWorkoutsCount: actualWorkouts.length,
    weeklyLoads: Object.values(weeklyLoads).sort((a, b) => a.weekStart - b.weekStart),
  };
}

// ============================================
// PERIODIZATION TEMPLATES
// ============================================

/**
 * Get available periodization templates
 */
export function getTemplates() {
  return [
    {
      id: 'base-building',
      name: 'Base Building',
      description: '8-week aerobic base development program',
      duration: 8,
      phases: ['Base'],
      weeklyStructure: {
        workoutsPerWeek: 5,
        intensityProgression: [60, 65, 70, 65, 75, 70, 80, 60],
        volumeProgression: [80, 90, 100, 85, 100, 90, 95, 70],
      },
    },
    {
      id: 'peak-performance',
      name: 'Peak Performance',
      description: '6-week racing preparation program',
      duration: 6,
      phases: ['Build', 'Peak', 'Taper'],
      weeklyStructure: {
        workoutsPerWeek: 6,
        intensityProgression: [75, 80, 85, 90, 85, 70],
        volumeProgression: [100, 95, 90, 80, 60, 40],
      },
    },
    {
      id: 'recovery',
      name: 'Recovery Block',
      description: '2-week active recovery program',
      duration: 2,
      phases: ['Recovery'],
      weeklyStructure: {
        workoutsPerWeek: 3,
        intensityProgression: [50, 55],
        volumeProgression: [50, 60],
      },
    },
    {
      id: 'build-phase',
      name: 'Build Phase',
      description: '4-week progressive overload program',
      duration: 4,
      phases: ['Build'],
      weeklyStructure: {
        workoutsPerWeek: 5,
        intensityProgression: [70, 75, 80, 70],
        volumeProgression: [85, 95, 100, 75],
      },
    },
  ];
}

/**
 * Create a plan from a template
 */
export async function createFromTemplate(templateId, teamId, userId, customization = {}) {
  const templates = getTemplates();
  const template = templates.find(t => t.id === templateId);

  if (!template) {
    throw new Error('Template not found');
  }

  const startDate = customization.startDate ? new Date(customization.startDate) : new Date();
  const planName = customization.name || template.name;

  // Calculate end date based on template duration
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + (template.duration * 7));

  // Create the plan
  const plan = await prisma.trainingPlan.create({
    data: {
      teamId,
      createdBy: userId,
      name: planName,
      description: template.description,
      startDate,
      endDate,
      phase: template.phases[0],
      isTemplate: false,
    },
  });

  // Generate workouts based on template
  const workouts = [];
  const workoutTypes = ['erg', 'row', 'cross_train'];
  const intensities = ['easy', 'moderate', 'hard', 'max'];

  for (let week = 0; week < template.duration; week++) {
    const weekIntensity = template.weeklyStructure.intensityProgression[week] || 70;
    const weekVolume = template.weeklyStructure.volumeProgression[week] || 80;

    for (let day = 0; day < template.weeklyStructure.workoutsPerWeek; day++) {
      const scheduledDate = new Date(startDate);
      scheduledDate.setDate(scheduledDate.getDate() + (week * 7) + day);

      // Vary workout type and intensity
      const type = workoutTypes[day % workoutTypes.length];
      const intensityIndex = Math.min(Math.floor(weekIntensity / 25), 3);
      const intensity = intensities[intensityIndex];

      // Calculate duration based on volume (base 45 min)
      const baseDuration = 45 * 60; // 45 minutes in seconds
      const duration = Math.round(baseDuration * (weekVolume / 100));

      workouts.push({
        planId: plan.id,
        name: `Week ${week + 1} - ${type.charAt(0).toUpperCase() + type.slice(1)} ${day + 1}`,
        type,
        description: `${intensity} intensity ${type} workout`,
        scheduledDate,
        weekNumber: week + 1,
        dayOfWeek: scheduledDate.getDay(),
        duration,
        intensity,
        order: (week * template.weeklyStructure.workoutsPerWeek) + day,
      });
    }
  }

  // Bulk create workouts
  await prisma.plannedWorkout.createMany({
    data: workouts,
  });

  // Fetch complete plan with workouts
  return getPlanById(plan.id, teamId);
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function formatPlan(plan) {
  return {
    id: plan.id,
    name: plan.name,
    description: plan.description,
    teamId: plan.teamId,
    creator: plan.creator,
    startDate: plan.startDate,
    endDate: plan.endDate,
    phase: plan.phase,
    isTemplate: plan.isTemplate,
    workouts: plan.workouts?.map(formatWorkout) || [],
    assignments: plan.assignments?.map(formatAssignment) || [],
    createdAt: plan.createdAt,
    updatedAt: plan.updatedAt,
  };
}

function formatPlanSummary(plan) {
  return {
    id: plan.id,
    name: plan.name,
    description: plan.description,
    creator: plan.creator,
    startDate: plan.startDate,
    endDate: plan.endDate,
    phase: plan.phase,
    isTemplate: plan.isTemplate,
    workoutCount: plan.workouts?.length || 0,
    assignmentCount: plan.assignments?.length || 0,
    activeAssignments: plan.assignments?.filter(a => a.status === 'active').length || 0,
    createdAt: plan.createdAt,
  };
}

function formatWorkout(workout) {
  return {
    id: workout.id,
    planId: workout.planId,
    name: workout.name,
    type: workout.type,
    description: workout.description,
    scheduledDate: workout.scheduledDate,
    dayOfWeek: workout.dayOfWeek,
    weekNumber: workout.weekNumber,
    duration: workout.duration,
    distance: workout.distance,
    targetPace: workout.targetPace,
    targetHeartRate: workout.targetHeartRate,
    intensity: workout.intensity,
    recurrenceRule: workout.recurrenceRule,
    order: workout.order,
    completions: workout.completions?.map(formatCompletion) || [],
    createdAt: workout.createdAt,
    updatedAt: workout.updatedAt,
  };
}

function formatAssignment(assignment) {
  return {
    id: assignment.id,
    planId: assignment.planId,
    athleteId: assignment.athleteId,
    athlete: assignment.athlete ? {
      id: assignment.athlete.id,
      userId: assignment.athlete.userId,
      name: assignment.athlete.user?.name || `Member ${assignment.athlete.id.slice(0, 8)}`,
      role: assignment.athlete.role,
    } : null,
    assignedBy: assignment.assignedBy,
    assignedAt: assignment.assignedAt,
    startDate: assignment.startDate,
    endDate: assignment.endDate,
    status: assignment.status,
  };
}

function formatCompletion(completion) {
  return {
    id: completion.id,
    plannedWorkoutId: completion.plannedWorkoutId,
    athleteId: completion.athleteId,
    workoutId: completion.workoutId,
    completedAt: completion.completedAt,
    compliance: completion.compliance,
    notes: completion.notes,
  };
}

function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  // Convert to Monday-start week (matching frontend date-fns weekStartsOn:1)
  // Sunday (0) becomes 6, other days become day-1
  const offset = day === 0 ? 6 : day - 1;
  const diff = d.getDate() - offset;
  return new Date(d.setDate(diff));
}

function calculateWorkoutLoad(workout) {
  // Simple Training Stress Score approximation
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

function calculateActualWorkoutLoad(workout) {
  // Calculate load from actual workout data
  const duration = workout.durationSeconds ? Number(workout.durationSeconds) : 2700;
  const hours = duration / 3600;

  // Estimate intensity from distance/time if available
  let intensityFactor = 0.7; // default moderate

  if (workout.distanceM && workout.durationSeconds) {
    const pace = Number(workout.durationSeconds) / (workout.distanceM / 500);
    // Faster pace = higher intensity
    if (pace < 90) intensityFactor = 1.0;      // sub 1:30 = max
    else if (pace < 105) intensityFactor = 0.95; // sub 1:45 = hard
    else if (pace < 120) intensityFactor = 0.8;  // sub 2:00 = moderate
    else intensityFactor = 0.6;                   // else = easy
  }

  return Math.round(hours * intensityFactor * intensityFactor * 100);
}
