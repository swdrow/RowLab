/**
 * Lineup Template Service - Phase 18 Plan 04
 *
 * Manages reusable lineup templates with team isolation.
 */

import { prisma } from '../db/connection.js';

/**
 * Create a new lineup template
 */
export async function createTemplate(teamId, data) {
  // If setting as default, clear other defaults for this boat class
  if (data.isDefault) {
    await prisma.lineupTemplate.updateMany({
      where: {
        teamId,
        boatClass: data.boatClass,
        isDefault: true,
      },
      data: { isDefault: false },
    });
  }

  const template = await prisma.lineupTemplate.create({
    data: {
      teamId,
      name: data.name,
      description: data.description || null,
      boatClass: data.boatClass,
      assignments: data.assignments,
      rigging: data.rigging || null,
      isDefault: data.isDefault || false,
    },
  });

  return template;
}

/**
 * Create template from existing lineup
 */
export async function createTemplateFromLineup(teamId, lineupId, templateName, isDefault = false) {
  // Get the lineup with assignments
  const lineup = await prisma.lineup.findFirst({
    where: { id: lineupId, teamId },
    include: {
      assignments: {
        include: {
          athlete: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
  });

  if (!lineup) {
    throw new Error('Lineup not found');
  }

  // Group assignments by boat class
  const boatClasses = [...new Set(lineup.assignments.map((a) => a.boatClass))];

  if (boatClasses.length === 0) {
    throw new Error('Lineup has no assignments');
  }

  // For simplicity, create template for first boat class
  // (In a more complex scenario, could create multiple templates)
  const boatClass = boatClasses[0];
  const boatAssignments = lineup.assignments.filter(
    (a) => a.boatClass === boatClass
  );

  const templateAssignments = boatAssignments.map((a) => ({
    seatNumber: a.seatNumber,
    side: a.side,
    isCoxswain: a.isCoxswain,
    preferredAthleteId: a.athleteId,
    preferredAthleteName: `${a.athlete.firstName} ${a.athlete.lastName}`,
  }));

  return createTemplate(teamId, {
    name: templateName,
    description: `Created from lineup: ${lineup.name}`,
    boatClass,
    assignments: templateAssignments,
    isDefault,
  });
}

/**
 * Get all templates for a team
 */
export async function getTemplates(teamId, boatClass = null) {
  const where = { teamId };
  if (boatClass) {
    where.boatClass = boatClass;
  }

  const templates = await prisma.lineupTemplate.findMany({
    where,
    orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }],
  });

  return templates;
}

/**
 * Get a single template by ID
 */
export async function getTemplateById(templateId, teamId) {
  const template = await prisma.lineupTemplate.findFirst({
    where: { id: templateId, teamId },
  });

  if (!template) {
    throw new Error('Template not found');
  }

  return template;
}

/**
 * Get default template for a boat class
 */
export async function getDefaultTemplate(teamId, boatClass) {
  const template = await prisma.lineupTemplate.findFirst({
    where: {
      teamId,
      boatClass,
      isDefault: true,
    },
  });

  return template;
}

/**
 * Update a template
 */
export async function updateTemplate(templateId, teamId, data) {
  const existing = await prisma.lineupTemplate.findFirst({
    where: { id: templateId, teamId },
  });

  if (!existing) {
    throw new Error('Template not found');
  }

  // If setting as default, clear other defaults for this boat class
  if (data.isDefault && !existing.isDefault) {
    await prisma.lineupTemplate.updateMany({
      where: {
        teamId,
        boatClass: existing.boatClass,
        isDefault: true,
      },
      data: { isDefault: false },
    });
  }

  const template = await prisma.lineupTemplate.update({
    where: { id: templateId },
    data: {
      name: data.name ?? existing.name,
      description: data.description ?? existing.description,
      assignments: data.assignments ?? existing.assignments,
      rigging: data.rigging ?? existing.rigging,
      isDefault: data.isDefault ?? existing.isDefault,
      updatedAt: new Date(),
    },
  });

  return template;
}

/**
 * Delete a template
 */
export async function deleteTemplate(templateId, teamId) {
  const template = await prisma.lineupTemplate.findFirst({
    where: { id: templateId, teamId },
  });

  if (!template) {
    throw new Error('Template not found');
  }

  await prisma.lineupTemplate.delete({
    where: { id: templateId },
  });

  return { success: true };
}

/**
 * Apply template to create/update a lineup's boat assignments
 * Returns assignment data ready to be added to lineupStore
 */
export async function applyTemplate(templateId, teamId, options = {}) {
  const template = await prisma.lineupTemplate.findFirst({
    where: { id: templateId, teamId },
  });

  if (!template) {
    throw new Error('Template not found');
  }

  // Get available athletes if we need to resolve preferred athletes
  const athletes = await prisma.athlete.findMany({
    where: { teamId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      side: true,
      canCox: true,
    },
  });

  const athleteMap = new Map(athletes.map((a) => [a.id, a]));

  // Process template assignments
  const assignedAthletes = [];
  const unfilledSeats = [];

  for (const assignment of template.assignments) {
    if (assignment.preferredAthleteId) {
      const athlete = athleteMap.get(assignment.preferredAthleteId);
      if (athlete) {
        // Check if already assigned in this template application
        const alreadyAssigned = assignedAthletes.some(
          (a) => a.athleteId === athlete.id
        );
        if (!alreadyAssigned) {
          assignedAthletes.push({
            seatNumber: assignment.seatNumber,
            side: assignment.side,
            isCoxswain: assignment.isCoxswain || false,
            athleteId: athlete.id,
            athleteName: `${athlete.firstName} ${athlete.lastName}`,
            isPreferred: true,
          });
          continue;
        }
      }
    }

    // Preferred athlete not found or not available
    unfilledSeats.push(assignment.seatNumber);
  }

  return {
    templateId: template.id,
    templateName: template.name,
    boatClass: template.boatClass,
    assignedAthletes,
    unfilledSeats,
    rigging: template.rigging,
  };
}
