import { prisma } from '../db/connection.js';

/**
 * Create a new shell
 */
export async function createShell(teamId, data) {
  const { name, boatClass, notes } = data;

  // Check for duplicate name in team
  const existing = await prisma.shell.findUnique({
    where: {
      teamId_name: { teamId, name },
    },
  });

  if (existing) {
    throw new Error('Shell with this name already exists');
  }

  const shell = await prisma.shell.create({
    data: {
      teamId,
      name,
      boatClass,
      notes: notes || null,
    },
  });

  return formatShell(shell);
}

/**
 * Get all shells for a team
 */
export async function getShells(teamId, filters = {}) {
  const where = { teamId };

  if (filters.boatClass) {
    where.boatClass = filters.boatClass;
  }

  const shells = await prisma.shell.findMany({
    where,
    orderBy: [{ boatClass: 'asc' }, { name: 'asc' }],
  });

  return shells.map(formatShell);
}

/**
 * Get a single shell by ID
 */
export async function getShellById(teamId, shellId) {
  const shell = await prisma.shell.findFirst({
    where: { id: shellId, teamId },
  });

  if (!shell) {
    throw new Error('Shell not found');
  }

  return formatShell(shell);
}

/**
 * Update a shell
 */
export async function updateShell(teamId, shellId, data) {
  const existing = await prisma.shell.findFirst({
    where: { id: shellId, teamId },
  });

  if (!existing) {
    throw new Error('Shell not found');
  }

  // If changing name, check for duplicates
  if (data.name && data.name !== existing.name) {
    const duplicate = await prisma.shell.findFirst({
      where: {
        teamId,
        name: data.name,
        NOT: { id: shellId },
      },
    });

    if (duplicate) {
      throw new Error('Shell with this name already exists');
    }
  }

  const updateData = {};
  const allowedFields = ['name', 'boatClass', 'notes'];

  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      updateData[field] = data[field];
    }
  }

  const shell = await prisma.shell.update({
    where: { id: shellId },
    data: updateData,
  });

  return formatShell(shell);
}

/**
 * Delete a shell
 */
export async function deleteShell(teamId, shellId) {
  const existing = await prisma.shell.findFirst({
    where: { id: shellId, teamId },
  });

  if (!existing) {
    throw new Error('Shell not found');
  }

  await prisma.shell.delete({
    where: { id: shellId },
  });

  return { deleted: true };
}

/**
 * Get shells grouped by boat class
 */
export async function getShellsByBoatClass(teamId) {
  const shells = await prisma.shell.findMany({
    where: { teamId },
    orderBy: [{ boatClass: 'asc' }, { name: 'asc' }],
  });

  const grouped = {};
  for (const shell of shells) {
    if (!grouped[shell.boatClass]) {
      grouped[shell.boatClass] = [];
    }
    grouped[shell.boatClass].push(formatShell(shell));
  }

  return grouped;
}

/**
 * Bulk import shells
 */
export async function bulkImportShells(teamId, shells) {
  const results = { created: 0, skipped: 0, errors: [] };

  for (const data of shells) {
    try {
      await createShell(teamId, data);
      results.created++;
    } catch (error) {
      if (error.message.includes('already exists')) {
        results.skipped++;
      } else {
        results.errors.push({
          shell: data.name,
          error: error.message,
        });
      }
    }
  }

  return results;
}

/**
 * Format shell for API response
 */
function formatShell(shell) {
  return {
    id: shell.id,
    name: shell.name,
    boatClass: shell.boatClass,
    notes: shell.notes,
  };
}
