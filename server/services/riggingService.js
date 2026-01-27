/**
 * Rigging Profile Service - Phase 18 BOAT-02
 *
 * Manages rigging settings per shell with team isolation.
 */

import { prisma } from '../db/connection.js';

/**
 * Default rigging values by boat class (from World Rowing / Concept2)
 */
const DEFAULT_RIGGING = {
  '8+': {
    spread: 85,
    catchAngle: -58,
    finishAngle: 33,
    oarLength: 372,
    inboard: 114,
    pitch: 4,
    gateHeight: 170,
  },
  '4+': {
    spread: 86,
    catchAngle: -58,
    finishAngle: 33,
    oarLength: 372,
    inboard: 114,
    pitch: 4,
    gateHeight: 170,
  },
  '4-': {
    spread: 86,
    catchAngle: -58,
    finishAngle: 33,
    oarLength: 372,
    inboard: 114,
    pitch: 4,
    gateHeight: 170,
  },
  '4x': {
    span: 158,
    catchAngle: -60,
    finishAngle: 35,
    oarLength: 284,
    inboard: 88,
    pitch: 4,
    gateHeight: 160,
  },
  '2x': {
    span: 160,
    catchAngle: -60,
    finishAngle: 35,
    oarLength: 287,
    inboard: 88,
    pitch: 4,
    gateHeight: 160,
  },
  '2-': {
    spread: 86,
    catchAngle: -58,
    finishAngle: 33,
    oarLength: 372,
    inboard: 114,
    pitch: 4,
    gateHeight: 170,
  },
  '1x': {
    span: 160,
    catchAngle: -60,
    finishAngle: 35,
    oarLength: 289,
    inboard: 88,
    pitch: 4,
    gateHeight: 160,
  },
};

/**
 * Get default rigging for a boat class
 */
export function getDefaultRigging(boatClass) {
  return DEFAULT_RIGGING[boatClass] || DEFAULT_RIGGING['8+'];
}

/**
 * Get rigging profile for a shell
 * Returns custom profile if exists, otherwise default based on boat class
 */
export async function getRiggingProfile(shellId, teamId) {
  // First get the shell to know its boat class
  const shell = await prisma.shell.findFirst({
    where: { id: shellId, teamId },
  });

  if (!shell) {
    throw new Error('Shell not found');
  }

  // Check for custom rigging profile
  const profile = await prisma.riggingProfile.findUnique({
    where: { shellId },
  });

  if (profile) {
    return {
      ...profile,
      isCustom: true,
      shellName: shell.name,
      boatClass: shell.boatClass,
    };
  }

  // Return default rigging
  return {
    id: null,
    shellId,
    teamId,
    defaults: getDefaultRigging(shell.boatClass),
    perSeat: null,
    notes: null,
    isCustom: false,
    shellName: shell.name,
    boatClass: shell.boatClass,
  };
}

/**
 * Get all rigging profiles for a team (with shells that have custom rigging)
 */
export async function getTeamRiggingProfiles(teamId) {
  const profiles = await prisma.riggingProfile.findMany({
    where: { teamId },
    include: {
      shell: {
        select: {
          id: true,
          name: true,
          boatClass: true,
          status: true,
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
  });

  return profiles.map((p) => ({
    ...p,
    shellName: p.shell.name,
    boatClass: p.shell.boatClass,
    shellStatus: p.shell.status,
  }));
}

/**
 * Create or update rigging profile for a shell
 */
export async function upsertRiggingProfile(shellId, teamId, data) {
  // Verify shell belongs to team
  const shell = await prisma.shell.findFirst({
    where: { id: shellId, teamId },
  });

  if (!shell) {
    throw new Error('Shell not found');
  }

  const profile = await prisma.riggingProfile.upsert({
    where: { shellId },
    create: {
      shellId,
      teamId,
      defaults: data.defaults,
      perSeat: data.perSeat || null,
      notes: data.notes || null,
    },
    update: {
      defaults: data.defaults,
      perSeat: data.perSeat || null,
      notes: data.notes || null,
      updatedAt: new Date(),
    },
  });

  return {
    ...profile,
    isCustom: true,
    shellName: shell.name,
    boatClass: shell.boatClass,
  };
}

/**
 * Delete rigging profile (reverts to defaults)
 */
export async function deleteRiggingProfile(shellId, teamId) {
  // Verify shell belongs to team
  const shell = await prisma.shell.findFirst({
    where: { id: shellId, teamId },
  });

  if (!shell) {
    throw new Error('Shell not found');
  }

  const profile = await prisma.riggingProfile.findUnique({
    where: { shellId },
  });

  if (!profile) {
    throw new Error('Rigging profile not found');
  }

  await prisma.riggingProfile.delete({
    where: { shellId },
  });

  return { success: true };
}

/**
 * Get all default rigging values (for reference)
 */
export function getAllDefaultRigging() {
  return DEFAULT_RIGGING;
}
