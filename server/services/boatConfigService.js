import { prisma } from '../db/connection.js';

// Standard boat configurations
const STANDARD_CONFIGS = [
  { name: '8+', numSeats: 8, hasCoxswain: true },
  { name: '4+', numSeats: 4, hasCoxswain: true },
  { name: '4-', numSeats: 4, hasCoxswain: false },
  { name: '4x', numSeats: 4, hasCoxswain: false },
  { name: '2-', numSeats: 2, hasCoxswain: false },
  { name: '2x', numSeats: 2, hasCoxswain: false },
  { name: '1x', numSeats: 1, hasCoxswain: false },
];

/**
 * Create a new boat config
 */
export async function createBoatConfig(teamId, data) {
  const { name, numSeats, hasCoxswain } = data;

  // Check for duplicate name in team
  const existing = await prisma.boatConfig.findUnique({
    where: {
      teamId_name: { teamId, name },
    },
  });

  if (existing) {
    throw new Error('Boat config with this name already exists');
  }

  const config = await prisma.boatConfig.create({
    data: {
      teamId,
      name,
      numSeats,
      hasCoxswain: hasCoxswain || false,
    },
  });

  return formatBoatConfig(config);
}

/**
 * Get all boat configs for a team (including standard configs)
 */
export async function getBoatConfigs(teamId, options = {}) {
  const { includeStandard = true } = options;

  const customConfigs = await prisma.boatConfig.findMany({
    where: { teamId },
    orderBy: [{ numSeats: 'desc' }, { name: 'asc' }],
  });

  const configs = customConfigs.map(c => ({
    ...formatBoatConfig(c),
    isCustom: true,
  }));

  if (includeStandard) {
    // Add standard configs that don't exist as custom
    const customNames = new Set(configs.map(c => c.name));
    for (const std of STANDARD_CONFIGS) {
      if (!customNames.has(std.name)) {
        configs.push({
          id: `standard-${std.name}`,
          ...std,
          isCustom: false,
        });
      }
    }

    // Sort by numSeats descending
    configs.sort((a, b) => b.numSeats - a.numSeats);
  }

  return configs;
}

/**
 * Get a single boat config by ID
 */
export async function getBoatConfigById(teamId, configId) {
  // Check if it's a standard config
  if (configId.startsWith('standard-')) {
    const name = configId.replace('standard-', '');
    const standard = STANDARD_CONFIGS.find(c => c.name === name);
    if (standard) {
      return { id: configId, ...standard, isCustom: false };
    }
    throw new Error('Boat config not found');
  }

  const config = await prisma.boatConfig.findFirst({
    where: { id: configId, teamId },
  });

  if (!config) {
    throw new Error('Boat config not found');
  }

  return { ...formatBoatConfig(config), isCustom: true };
}

/**
 * Update a boat config
 */
export async function updateBoatConfig(teamId, configId, data) {
  // Cannot update standard configs
  if (configId.startsWith('standard-')) {
    throw new Error('Cannot modify standard boat configs');
  }

  const existing = await prisma.boatConfig.findFirst({
    where: { id: configId, teamId },
  });

  if (!existing) {
    throw new Error('Boat config not found');
  }

  // If changing name, check for duplicates
  if (data.name && data.name !== existing.name) {
    const duplicate = await prisma.boatConfig.findFirst({
      where: {
        teamId,
        name: data.name,
        NOT: { id: configId },
      },
    });

    if (duplicate) {
      throw new Error('Boat config with this name already exists');
    }

    // Also check against standard configs
    if (STANDARD_CONFIGS.some(c => c.name === data.name)) {
      throw new Error('Cannot use standard config name');
    }
  }

  const updateData = {};
  const allowedFields = ['name', 'numSeats', 'hasCoxswain'];

  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      updateData[field] = data[field];
    }
  }

  const config = await prisma.boatConfig.update({
    where: { id: configId },
    data: updateData,
  });

  return { ...formatBoatConfig(config), isCustom: true };
}

/**
 * Delete a boat config
 */
export async function deleteBoatConfig(teamId, configId) {
  // Cannot delete standard configs
  if (configId.startsWith('standard-')) {
    throw new Error('Cannot delete standard boat configs');
  }

  const existing = await prisma.boatConfig.findFirst({
    where: { id: configId, teamId },
  });

  if (!existing) {
    throw new Error('Boat config not found');
  }

  await prisma.boatConfig.delete({
    where: { id: configId },
  });

  return { deleted: true };
}

/**
 * Get standard boat configurations
 */
export function getStandardConfigs() {
  return STANDARD_CONFIGS.map(c => ({
    id: `standard-${c.name}`,
    ...c,
    isCustom: false,
  }));
}

/**
 * Format boat config for API response
 */
function formatBoatConfig(config) {
  return {
    id: config.id,
    name: config.name,
    numSeats: config.numSeats,
    hasCoxswain: config.hasCoxswain,
  };
}
