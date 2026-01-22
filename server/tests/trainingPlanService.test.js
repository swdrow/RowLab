/**
 * Training Plan Service Tests (TDD)
 *
 * Tests for training plan CRUD, workout management, athlete assignments,
 * completion tracking, and periodization templates.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Create hoisted mock for prisma
const mockPrisma = vi.hoisted(() => ({
  trainingPlan: {
    create: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  plannedWorkout: {
    create: vi.fn(),
    createMany: vi.fn(),
    findFirst: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  workoutAssignment: {
    upsert: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    delete: vi.fn(),
  },
  workoutCompletion: {
    upsert: vi.fn(),
    findMany: vi.fn(),
  },
  teamMember: {
    findMany: vi.fn(),
  },
  workout: {
    findMany: vi.fn(),
  },
  $transaction: vi.fn((operations) => Promise.all(operations)),
}));

// Mock prisma
vi.mock('../db/connection.js', () => ({
  prisma: mockPrisma,
}));

// Import service after mocks are set up
const {
  createPlan,
  getPlanById,
  updatePlan,
  deletePlan,
  listPlans,
  addWorkoutToPlan,
  updatePlannedWorkout,
  deletePlannedWorkout,
  assignPlanToAthletes,
  removeAssignment,
  getAthletePlans,
  recordCompletion,
  calculateCompliance,
  getTrainingLoad,
  getTemplates,
  createFromTemplate,
} = await import('../services/trainingPlanService.js');

// Test data fixtures
const mockTeamId = 'team-uuid-123';
const mockUserId = 'user-uuid-456';
const mockPlanId = 'plan-uuid-789';
const mockWorkoutId = 'workout-uuid-101';
const mockAthleteId = 'athlete-uuid-202';
const mockAssignmentId = 'assignment-uuid-303';

const mockPlanData = {
  id: mockPlanId,
  name: 'Base Building Plan',
  description: '8-week aerobic development',
  teamId: mockTeamId,
  createdBy: mockUserId,
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-02-26'),
  phase: 'Base',
  isTemplate: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  creator: { id: mockUserId, name: 'Coach Smith' },
  workouts: [],
  assignments: [],
};

const mockWorkoutData = {
  id: mockWorkoutId,
  planId: mockPlanId,
  name: 'Week 1 - Erg 1',
  type: 'erg',
  description: 'Easy steady state',
  scheduledDate: new Date('2024-01-02'),
  dayOfWeek: 2,
  weekNumber: 1,
  duration: 2700,
  distance: null,
  targetPace: null,
  targetHeartRate: 140,
  intensity: 'easy',
  recurrenceRule: null,
  order: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('TrainingPlanService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ============================================
  // TRAINING PLAN CRUD TESTS
  // ============================================

  describe('createPlan', () => {
    it('should create a new training plan with all fields', async () => {
      mockPrisma.trainingPlan.create.mockResolvedValueOnce(mockPlanData);

      const result = await createPlan(mockTeamId, mockUserId, {
        name: 'Base Building Plan',
        description: '8-week aerobic development',
        startDate: '2024-01-01',
        endDate: '2024-02-26',
        phase: 'Base',
        isTemplate: false,
      });

      expect(result.id).toBe(mockPlanId);
      expect(result.name).toBe('Base Building Plan');
      expect(result.phase).toBe('Base');
      expect(result.creator).toEqual({ id: mockUserId, name: 'Coach Smith' });

      expect(mockPrisma.trainingPlan.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          teamId: mockTeamId,
          createdBy: mockUserId,
          name: 'Base Building Plan',
          phase: 'Base',
        }),
        include: expect.any(Object),
      });
    });

    it('should create a plan with minimal required fields', async () => {
      const minimalPlan = {
        ...mockPlanData,
        name: 'Quick Plan',
        description: null,
        startDate: null,
        endDate: null,
        phase: null,
      };
      mockPrisma.trainingPlan.create.mockResolvedValueOnce(minimalPlan);

      const result = await createPlan(mockTeamId, mockUserId, {
        name: 'Quick Plan',
      });

      expect(result.name).toBe('Quick Plan');
      expect(mockPrisma.trainingPlan.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'Quick Plan',
          description: null,
          startDate: null,
          endDate: null,
        }),
        include: expect.any(Object),
      });
    });

    it('should create a template plan', async () => {
      const templatePlan = { ...mockPlanData, isTemplate: true };
      mockPrisma.trainingPlan.create.mockResolvedValueOnce(templatePlan);

      const result = await createPlan(mockTeamId, mockUserId, {
        name: 'Template Plan',
        isTemplate: true,
      });

      expect(result.isTemplate).toBe(true);
    });
  });

  describe('getPlanById', () => {
    it('should return a plan with workouts and assignments', async () => {
      const planWithDetails = {
        ...mockPlanData,
        workouts: [mockWorkoutData],
        assignments: [{
          id: mockAssignmentId,
          planId: mockPlanId,
          athleteId: mockAthleteId,
          athlete: {
            id: mockAthleteId,
            userId: 'user-123',
            role: 'ATHLETE',
            user: { id: 'user-123', name: 'John Rower' },
          },
          assignedBy: mockUserId,
          assignedAt: new Date(),
          startDate: new Date('2024-01-01'),
          endDate: null,
          status: 'active',
        }],
      };
      mockPrisma.trainingPlan.findFirst.mockResolvedValueOnce(planWithDetails);

      const result = await getPlanById(mockPlanId, mockTeamId);

      expect(result.id).toBe(mockPlanId);
      expect(result.workouts).toHaveLength(1);
      expect(result.workouts[0].name).toBe('Week 1 - Erg 1');
      expect(result.assignments).toHaveLength(1);
    });

    it('should throw error when plan not found', async () => {
      mockPrisma.trainingPlan.findFirst.mockResolvedValueOnce(null);

      await expect(getPlanById('non-existent', mockTeamId))
        .rejects.toThrow('Training plan not found');
    });

    it('should not return plan from different team', async () => {
      mockPrisma.trainingPlan.findFirst.mockResolvedValueOnce(null);

      await expect(getPlanById(mockPlanId, 'different-team'))
        .rejects.toThrow('Training plan not found');

      expect(mockPrisma.trainingPlan.findFirst).toHaveBeenCalledWith({
        where: { id: mockPlanId, teamId: 'different-team' },
        include: expect.any(Object),
      });
    });
  });

  describe('updatePlan', () => {
    it('should update allowed fields', async () => {
      mockPrisma.trainingPlan.findFirst.mockResolvedValueOnce(mockPlanData);
      mockPrisma.trainingPlan.update.mockResolvedValueOnce({
        ...mockPlanData,
        name: 'Updated Plan',
        phase: 'Build',
      });

      const result = await updatePlan(mockPlanId, mockTeamId, {
        name: 'Updated Plan',
        phase: 'Build',
      });

      expect(result.name).toBe('Updated Plan');
      expect(result.phase).toBe('Build');
      expect(mockPrisma.trainingPlan.update).toHaveBeenCalledWith({
        where: { id: mockPlanId },
        data: { name: 'Updated Plan', phase: 'Build' },
        include: expect.any(Object),
      });
    });

    it('should update date fields correctly', async () => {
      mockPrisma.trainingPlan.findFirst.mockResolvedValueOnce(mockPlanData);
      mockPrisma.trainingPlan.update.mockResolvedValueOnce(mockPlanData);

      await updatePlan(mockPlanId, mockTeamId, {
        startDate: '2024-02-01',
        endDate: '2024-03-30',
      });

      expect(mockPrisma.trainingPlan.update).toHaveBeenCalledWith({
        where: { id: mockPlanId },
        data: {
          startDate: expect.any(Date),
          endDate: expect.any(Date),
        },
        include: expect.any(Object),
      });
    });

    it('should throw error when plan not found', async () => {
      mockPrisma.trainingPlan.findFirst.mockResolvedValueOnce(null);

      await expect(updatePlan('non-existent', mockTeamId, { name: 'Test' }))
        .rejects.toThrow('Training plan not found');
    });

    it('should not update disallowed fields', async () => {
      mockPrisma.trainingPlan.findFirst.mockResolvedValueOnce(mockPlanData);
      mockPrisma.trainingPlan.update.mockResolvedValueOnce(mockPlanData);

      await updatePlan(mockPlanId, mockTeamId, {
        name: 'Valid',
        teamId: 'hacker-team', // Should be ignored
        createdBy: 'hacker-user', // Should be ignored
      });

      expect(mockPrisma.trainingPlan.update).toHaveBeenCalledWith({
        where: { id: mockPlanId },
        data: { name: 'Valid' }, // Only allowed field
        include: expect.any(Object),
      });
    });
  });

  describe('deletePlan', () => {
    it('should delete existing plan', async () => {
      mockPrisma.trainingPlan.findFirst.mockResolvedValueOnce(mockPlanData);
      mockPrisma.trainingPlan.delete.mockResolvedValueOnce(mockPlanData);

      const result = await deletePlan(mockPlanId, mockTeamId);

      expect(result.deleted).toBe(true);
      expect(mockPrisma.trainingPlan.delete).toHaveBeenCalledWith({
        where: { id: mockPlanId },
      });
    });

    it('should throw error when plan not found', async () => {
      mockPrisma.trainingPlan.findFirst.mockResolvedValueOnce(null);

      await expect(deletePlan('non-existent', mockTeamId))
        .rejects.toThrow('Training plan not found');
    });
  });

  describe('listPlans', () => {
    it('should list all plans for a team', async () => {
      const plans = [mockPlanData, { ...mockPlanData, id: 'plan-2' }];
      mockPrisma.trainingPlan.findMany.mockResolvedValueOnce(plans);

      const result = await listPlans(mockTeamId);

      expect(result).toHaveLength(2);
      expect(mockPrisma.trainingPlan.findMany).toHaveBeenCalledWith({
        where: { teamId: mockTeamId },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
    });

    it('should filter by isTemplate', async () => {
      mockPrisma.trainingPlan.findMany.mockResolvedValueOnce([]);

      await listPlans(mockTeamId, { isTemplate: true });

      expect(mockPrisma.trainingPlan.findMany).toHaveBeenCalledWith({
        where: { teamId: mockTeamId, isTemplate: true },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
    });

    it('should filter by phase', async () => {
      mockPrisma.trainingPlan.findMany.mockResolvedValueOnce([]);

      await listPlans(mockTeamId, { phase: 'Build' });

      expect(mockPrisma.trainingPlan.findMany).toHaveBeenCalledWith({
        where: { teamId: mockTeamId, phase: 'Build' },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
    });

    it('should respect limit parameter', async () => {
      mockPrisma.trainingPlan.findMany.mockResolvedValueOnce([]);

      await listPlans(mockTeamId, { limit: '10' });

      expect(mockPrisma.trainingPlan.findMany).toHaveBeenCalledWith({
        where: { teamId: mockTeamId },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
        take: 10,
      });
    });
  });

  // ============================================
  // PLANNED WORKOUT TESTS
  // ============================================

  describe('addWorkoutToPlan', () => {
    it('should add a workout to a plan', async () => {
      mockPrisma.trainingPlan.findFirst.mockResolvedValueOnce(mockPlanData);
      mockPrisma.plannedWorkout.create.mockResolvedValueOnce(mockWorkoutData);

      const result = await addWorkoutToPlan(mockPlanId, mockTeamId, {
        name: 'Week 1 - Erg 1',
        type: 'erg',
        description: 'Easy steady state',
        scheduledDate: '2024-01-02',
        duration: 2700,
        intensity: 'easy',
        targetHeartRate: 140,
      });

      expect(result.id).toBe(mockWorkoutId);
      expect(result.name).toBe('Week 1 - Erg 1');
      expect(result.type).toBe('erg');
      expect(result.intensity).toBe('easy');
    });

    it('should throw error when plan not found', async () => {
      mockPrisma.trainingPlan.findFirst.mockResolvedValueOnce(null);

      await expect(addWorkoutToPlan('non-existent', mockTeamId, { name: 'Test', type: 'erg' }))
        .rejects.toThrow('Training plan not found');
    });

    it('should handle optional workout fields', async () => {
      mockPrisma.trainingPlan.findFirst.mockResolvedValueOnce(mockPlanData);
      mockPrisma.plannedWorkout.create.mockResolvedValueOnce({
        ...mockWorkoutData,
        scheduledDate: null,
        duration: null,
        distance: null,
      });

      await addWorkoutToPlan(mockPlanId, mockTeamId, {
        name: 'Flexible Workout',
        type: 'row',
      });

      expect(mockPrisma.plannedWorkout.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          planId: mockPlanId,
          name: 'Flexible Workout',
          type: 'row',
          scheduledDate: null,
          duration: null,
        }),
      });
    });
  });

  describe('updatePlannedWorkout', () => {
    it('should update workout fields', async () => {
      mockPrisma.plannedWorkout.findFirst.mockResolvedValueOnce({
        ...mockWorkoutData,
        plan: { teamId: mockTeamId },
      });
      mockPrisma.plannedWorkout.update.mockResolvedValueOnce({
        ...mockWorkoutData,
        intensity: 'moderate',
        duration: 3600,
      });

      const result = await updatePlannedWorkout(mockWorkoutId, mockTeamId, {
        intensity: 'moderate',
        duration: 3600,
      });

      expect(result.intensity).toBe('moderate');
      expect(result.duration).toBe(3600);
    });

    it('should throw error when workout not found', async () => {
      mockPrisma.plannedWorkout.findFirst.mockResolvedValueOnce(null);

      await expect(updatePlannedWorkout('non-existent', mockTeamId, { name: 'Test' }))
        .rejects.toThrow('Planned workout not found');
    });

    it('should throw error when workout belongs to different team', async () => {
      mockPrisma.plannedWorkout.findFirst.mockResolvedValueOnce({
        ...mockWorkoutData,
        plan: { teamId: 'different-team' },
      });

      await expect(updatePlannedWorkout(mockWorkoutId, mockTeamId, { name: 'Test' }))
        .rejects.toThrow('Planned workout not found');
    });
  });

  describe('deletePlannedWorkout', () => {
    it('should delete a workout', async () => {
      mockPrisma.plannedWorkout.findFirst.mockResolvedValueOnce({
        ...mockWorkoutData,
        plan: { teamId: mockTeamId },
      });
      mockPrisma.plannedWorkout.delete.mockResolvedValueOnce(mockWorkoutData);

      const result = await deletePlannedWorkout(mockWorkoutId, mockTeamId);

      expect(result.deleted).toBe(true);
    });

    it('should throw error when workout not found', async () => {
      mockPrisma.plannedWorkout.findFirst.mockResolvedValueOnce(null);

      await expect(deletePlannedWorkout('non-existent', mockTeamId))
        .rejects.toThrow('Planned workout not found');
    });
  });

  // ============================================
  // ATHLETE ASSIGNMENT TESTS
  // ============================================

  describe('assignPlanToAthletes', () => {
    it('should assign plan to multiple athletes', async () => {
      const athleteIds = [mockAthleteId, 'athlete-2'];
      mockPrisma.trainingPlan.findFirst.mockResolvedValueOnce(mockPlanData);
      mockPrisma.teamMember.findMany.mockResolvedValueOnce([
        { id: mockAthleteId, teamId: mockTeamId },
        { id: 'athlete-2', teamId: mockTeamId },
      ]);

      const mockAssignment = {
        id: mockAssignmentId,
        planId: mockPlanId,
        athleteId: mockAthleteId,
        assignedBy: mockUserId,
        startDate: new Date('2024-01-01'),
        endDate: null,
        status: 'active',
        athlete: {
          id: mockAthleteId,
          userId: 'user-123',
          user: { id: 'user-123', name: 'John Rower' },
        },
      };

      mockPrisma.workoutAssignment.upsert
        .mockResolvedValueOnce(mockAssignment)
        .mockResolvedValueOnce({ ...mockAssignment, id: 'assignment-2', athleteId: 'athlete-2' });

      const result = await assignPlanToAthletes(
        mockPlanId,
        mockTeamId,
        athleteIds,
        mockUserId,
        { startDate: '2024-01-01' }
      );

      expect(result).toHaveLength(2);
      expect(mockPrisma.workoutAssignment.upsert).toHaveBeenCalledTimes(2);
    });

    it('should throw error when plan not found', async () => {
      mockPrisma.trainingPlan.findFirst.mockResolvedValueOnce(null);

      await expect(
        assignPlanToAthletes(mockPlanId, mockTeamId, [mockAthleteId], mockUserId, { startDate: '2024-01-01' })
      ).rejects.toThrow('Training plan not found');
    });

    it('should throw error when athletes not in team', async () => {
      mockPrisma.trainingPlan.findFirst.mockResolvedValueOnce(mockPlanData);
      mockPrisma.teamMember.findMany.mockResolvedValueOnce([]); // No matching members

      await expect(
        assignPlanToAthletes(mockPlanId, mockTeamId, ['invalid-athlete'], mockUserId, { startDate: '2024-01-01' })
      ).rejects.toThrow('One or more athletes not found in team');
    });
  });

  describe('removeAssignment', () => {
    it('should remove an assignment', async () => {
      mockPrisma.workoutAssignment.findFirst.mockResolvedValueOnce({
        id: mockAssignmentId,
        plan: { teamId: mockTeamId },
      });
      mockPrisma.workoutAssignment.delete.mockResolvedValueOnce({});

      const result = await removeAssignment(mockAssignmentId, mockTeamId);

      expect(result.deleted).toBe(true);
    });

    it('should throw error when assignment not found', async () => {
      mockPrisma.workoutAssignment.findFirst.mockResolvedValueOnce(null);

      await expect(removeAssignment('non-existent', mockTeamId))
        .rejects.toThrow('Assignment not found');
    });
  });

  describe('getAthletePlans', () => {
    it('should return plans assigned to an athlete', async () => {
      const mockAssignment = {
        id: mockAssignmentId,
        planId: mockPlanId,
        athleteId: mockAthleteId,
        assignedBy: mockUserId,
        assignedAt: new Date(),
        startDate: new Date('2024-01-01'),
        endDate: null,
        status: 'active',
        plan: {
          ...mockPlanData,
          workouts: [mockWorkoutData],
        },
      };
      mockPrisma.workoutAssignment.findMany.mockResolvedValueOnce([mockAssignment]);

      const result = await getAthletePlans(mockAthleteId, mockTeamId);

      expect(result).toHaveLength(1);
      expect(result[0].assignment.athleteId).toBe(mockAthleteId);
      expect(result[0].plan.id).toBe(mockPlanId);
    });

    it('should return empty array when no plans assigned', async () => {
      mockPrisma.workoutAssignment.findMany.mockResolvedValueOnce([]);

      const result = await getAthletePlans(mockAthleteId, mockTeamId);

      expect(result).toHaveLength(0);
    });
  });

  // ============================================
  // WORKOUT COMPLETION TESTS
  // ============================================

  describe('recordCompletion', () => {
    it('should record a workout completion', async () => {
      mockPrisma.plannedWorkout.findFirst.mockResolvedValueOnce({
        ...mockWorkoutData,
        plan: { teamId: mockTeamId },
      });

      const mockCompletion = {
        id: 'completion-uuid',
        plannedWorkoutId: mockWorkoutId,
        athleteId: mockAthleteId,
        workoutId: 'actual-workout-id',
        compliance: 0.95,
        notes: 'Felt strong',
        completedAt: new Date(),
        plannedWorkout: mockWorkoutData,
        athlete: { id: mockAthleteId },
        workout: { id: 'actual-workout-id' },
      };
      mockPrisma.workoutCompletion.upsert.mockResolvedValueOnce(mockCompletion);

      const result = await recordCompletion(mockWorkoutId, mockAthleteId, mockTeamId, {
        workoutId: 'actual-workout-id',
        compliance: 0.95,
        notes: 'Felt strong',
      });

      expect(result.plannedWorkoutId).toBe(mockWorkoutId);
      expect(result.athleteId).toBe(mockAthleteId);
      expect(result.compliance).toBe(0.95);
    });

    it('should throw error when workout not found', async () => {
      mockPrisma.plannedWorkout.findFirst.mockResolvedValueOnce(null);

      await expect(recordCompletion('non-existent', mockAthleteId, mockTeamId, {}))
        .rejects.toThrow('Planned workout not found');
    });
  });

  describe('calculateCompliance', () => {
    it('should calculate compliance rate correctly', async () => {
      mockPrisma.workoutAssignment.findFirst.mockResolvedValueOnce({
        id: mockAssignmentId,
        athleteId: mockAthleteId,
        plan: {
          teamId: mockTeamId,
          workouts: [
            { id: 'w1' },
            { id: 'w2' },
            { id: 'w3' },
            { id: 'w4' },
          ],
        },
      });

      mockPrisma.workoutCompletion.findMany.mockResolvedValueOnce([
        { plannedWorkoutId: 'w1', compliance: 1.0 },
        { plannedWorkoutId: 'w2', compliance: 0.8 },
        { plannedWorkoutId: 'w3', compliance: 0.9 },
      ]);

      const result = await calculateCompliance(mockAssignmentId, mockTeamId);

      expect(result.assignmentId).toBe(mockAssignmentId);
      expect(result.totalWorkouts).toBe(4);
      expect(result.completedWorkouts).toBe(3);
      expect(result.completionRate).toBe(0.75);
      expect(result.averageCompliance).toBeCloseTo(0.9, 2);
    });

    it('should handle zero workouts', async () => {
      mockPrisma.workoutAssignment.findFirst.mockResolvedValueOnce({
        id: mockAssignmentId,
        athleteId: mockAthleteId,
        plan: {
          teamId: mockTeamId,
          workouts: [],
        },
      });

      mockPrisma.workoutCompletion.findMany.mockResolvedValueOnce([]);

      const result = await calculateCompliance(mockAssignmentId, mockTeamId);

      expect(result.totalWorkouts).toBe(0);
      expect(result.completionRate).toBe(0);
    });

    it('should throw error when assignment not found', async () => {
      mockPrisma.workoutAssignment.findFirst.mockResolvedValueOnce(null);

      await expect(calculateCompliance('non-existent', mockTeamId))
        .rejects.toThrow('Assignment not found');
    });
  });

  describe('getTrainingLoad', () => {
    it('should calculate weekly training loads', async () => {
      const planWorkouts = [
        { id: 'pw1', scheduledDate: new Date('2024-01-08'), duration: 2700, intensity: 'easy' },
        { id: 'pw2', scheduledDate: new Date('2024-01-10'), duration: 3600, intensity: 'moderate' },
        { id: 'pw3', scheduledDate: new Date('2024-01-15'), duration: 2700, intensity: 'hard' },
      ];

      mockPrisma.workoutAssignment.findMany.mockResolvedValueOnce([
        {
          athleteId: mockAthleteId,
          plan: {
            workouts: planWorkouts,
          },
        },
      ]);

      mockPrisma.workoutCompletion.findMany.mockResolvedValueOnce([
        { plannedWorkoutId: 'pw1' },
        { plannedWorkoutId: 'pw2' },
      ]);

      mockPrisma.workout.findMany.mockResolvedValueOnce([
        { date: new Date('2024-01-09'), durationSeconds: 3000, distanceM: 6000 },
      ]);

      const result = await getTrainingLoad(mockAthleteId, mockTeamId, {
        startDate: '2024-01-01',
        endDate: '2024-01-21',
      });

      expect(result.athleteId).toBe(mockAthleteId);
      expect(result.plannedWorkoutsCount).toBe(3);
      expect(result.completedWorkoutsCount).toBe(2);
      expect(result.actualWorkoutsCount).toBe(1);
      expect(result.weeklyLoads.length).toBeGreaterThan(0);
    });
  });

  // ============================================
  // PERIODIZATION TEMPLATES TESTS
  // ============================================

  describe('getTemplates', () => {
    it('should return all available templates', () => {
      const templates = getTemplates();

      expect(templates).toHaveLength(4);
      expect(templates.map(t => t.id)).toContain('base-building');
      expect(templates.map(t => t.id)).toContain('peak-performance');
      expect(templates.map(t => t.id)).toContain('recovery');
      expect(templates.map(t => t.id)).toContain('build-phase');
    });

    it('should have valid structure for each template', () => {
      const templates = getTemplates();

      for (const template of templates) {
        expect(template).toHaveProperty('id');
        expect(template).toHaveProperty('name');
        expect(template).toHaveProperty('description');
        expect(template).toHaveProperty('duration');
        expect(template).toHaveProperty('phases');
        expect(template).toHaveProperty('weeklyStructure');
        expect(template.weeklyStructure).toHaveProperty('workoutsPerWeek');
        expect(template.weeklyStructure).toHaveProperty('intensityProgression');
        expect(template.weeklyStructure).toHaveProperty('volumeProgression');
      }
    });
  });

  describe('createFromTemplate', () => {
    it('should create plan from base-building template', async () => {
      mockPrisma.trainingPlan.create.mockResolvedValueOnce({
        ...mockPlanData,
        id: 'new-plan-id',
      });
      mockPrisma.plannedWorkout.createMany.mockResolvedValueOnce({ count: 40 });
      mockPrisma.trainingPlan.findFirst.mockResolvedValueOnce({
        ...mockPlanData,
        id: 'new-plan-id',
        workouts: Array(40).fill(mockWorkoutData),
      });

      const result = await createFromTemplate('base-building', mockTeamId, mockUserId, {
        name: 'My Base Building Plan',
        startDate: '2024-01-01',
      });

      expect(result.id).toBe('new-plan-id');
      expect(mockPrisma.trainingPlan.create).toHaveBeenCalled();
      expect(mockPrisma.plannedWorkout.createMany).toHaveBeenCalled();
    });

    it('should throw error for non-existent template', async () => {
      await expect(createFromTemplate('non-existent', mockTeamId, mockUserId, {}))
        .rejects.toThrow('Template not found');
    });

    it('should use default start date if not provided', async () => {
      mockPrisma.trainingPlan.create.mockResolvedValueOnce({
        ...mockPlanData,
        id: 'new-plan-id',
      });
      mockPrisma.plannedWorkout.createMany.mockResolvedValueOnce({ count: 40 });
      mockPrisma.trainingPlan.findFirst.mockResolvedValueOnce({
        ...mockPlanData,
        id: 'new-plan-id',
      });

      await createFromTemplate('base-building', mockTeamId, mockUserId, {});

      expect(mockPrisma.trainingPlan.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          startDate: expect.any(Date),
        }),
      });
    });

    it('should generate correct number of workouts for template', async () => {
      // Base building: 8 weeks x 5 workouts/week = 40 workouts
      mockPrisma.trainingPlan.create.mockResolvedValueOnce({
        ...mockPlanData,
        id: 'new-plan-id',
      });
      mockPrisma.plannedWorkout.createMany.mockResolvedValueOnce({ count: 40 });
      mockPrisma.trainingPlan.findFirst.mockResolvedValueOnce(mockPlanData);

      await createFromTemplate('base-building', mockTeamId, mockUserId, {});

      const createManyCall = mockPrisma.plannedWorkout.createMany.mock.calls[0][0];
      expect(createManyCall.data).toHaveLength(40); // 8 weeks * 5 workouts
    });

    it('should create recovery template with shorter duration', async () => {
      // Recovery: 2 weeks x 3 workouts/week = 6 workouts
      mockPrisma.trainingPlan.create.mockResolvedValueOnce({
        ...mockPlanData,
        id: 'new-plan-id',
      });
      mockPrisma.plannedWorkout.createMany.mockResolvedValueOnce({ count: 6 });
      mockPrisma.trainingPlan.findFirst.mockResolvedValueOnce(mockPlanData);

      await createFromTemplate('recovery', mockTeamId, mockUserId, {});

      const createManyCall = mockPrisma.plannedWorkout.createMany.mock.calls[0][0];
      expect(createManyCall.data).toHaveLength(6); // 2 weeks * 3 workouts
    });
  });
});
