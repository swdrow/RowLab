import { prisma } from '../db/connection.js';

/**
 * Create a new oar set
 */
export async function createOarSet(teamId, data) {
  const { name, type, count, status, notes } = data;

  // Check for duplicate name in team
  const existing = await prisma.oarSet.findUnique({
    where: {
      teamId_name: { teamId, name },
    },
  });

  if (existing) {
    throw new Error('Oar set with this name already exists');
  }

  const oarSet = await prisma.oarSet.create({
    data: {
      teamId,
      name,
      type,
      count,
      status: status || 'AVAILABLE',
      notes: notes || null,
    },
  });

  return formatOarSet(oarSet);
}

/**
 * Get all oar sets for a team
 */
export async function getOarSets(teamId, filters = {}) {
  const where = { teamId };

  if (filters.type) {
    where.type = filters.type;
  }

  const oarSets = await prisma.oarSet.findMany({
    where,
    orderBy: [{ type: 'asc' }, { name: 'asc' }],
  });

  return oarSets.map(formatOarSet);
}

/**
 * Get a single oar set by ID
 */
export async function getOarSetById(teamId, oarSetId) {
  const oarSet = await prisma.oarSet.findFirst({
    where: { id: oarSetId, teamId },
  });

  if (!oarSet) {
    throw new Error('Oar set not found');
  }

  return formatOarSet(oarSet);
}

/**
 * Update an oar set
 */
export async function updateOarSet(teamId, oarSetId, data) {
  const existing = await prisma.oarSet.findFirst({
    where: { id: oarSetId, teamId },
  });

  if (!existing) {
    throw new Error('Oar set not found');
  }

  // If changing name, check for duplicates
  if (data.name && data.name !== existing.name) {
    const duplicate = await prisma.oarSet.findFirst({
      where: {
        teamId,
        name: data.name,
        NOT: { id: oarSetId },
      },
    });

    if (duplicate) {
      throw new Error('Oar set with this name already exists');
    }
  }

  const updateData = {};
  const allowedFields = ['name', 'type', 'count', 'status', 'notes'];

  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      updateData[field] = data[field];
    }
  }

  const oarSet = await prisma.oarSet.update({
    where: { id: oarSetId },
    data: updateData,
  });

  return formatOarSet(oarSet);
}

/**
 * Delete an oar set
 */
export async function deleteOarSet(teamId, oarSetId) {
  const existing = await prisma.oarSet.findFirst({
    where: { id: oarSetId, teamId },
  });

  if (!existing) {
    throw new Error('Oar set not found');
  }

  await prisma.oarSet.delete({
    where: { id: oarSetId },
  });

  return { deleted: true };
}

/**
 * Format oar set for API response
 */
function formatOarSet(oarSet) {
  return {
    id: oarSet.id,
    name: oarSet.name,
    type: oarSet.type,
    count: oarSet.count,
    status: oarSet.status,
    notes: oarSet.notes,
  };
}
