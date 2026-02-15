import crypto from 'crypto';
import { prisma } from '../db/connection.js';

/**
 * Generate unique slug from team name
 */
function generateSlug(name) {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  const suffix = crypto.randomBytes(3).toString('hex');
  return `${base}-${suffix}`;
}

/**
 * Generate invite code
 */
function generateInviteCode() {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
}

/**
 * Create a new team
 */
export async function createTeam({ name, userId, isPublic = false }) {
  const slug = generateSlug(name);
  const inviteCode = generateInviteCode();

  const team = await prisma.team.create({
    data: {
      name,
      slug,
      inviteCode,
      isPublic,
      members: {
        create: {
          userId,
          role: 'OWNER',
        },
      },
    },
    include: {
      members: true,
    },
  });

  return {
    id: team.id,
    name: team.name,
    slug: team.slug,
    inviteCode: team.inviteCode,
    isPublic: team.isPublic,
    role: 'OWNER',
  };
}

/**
 * Get team by ID (with membership check)
 */
export async function getTeam(teamId, userId) {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      members: {
        where: { userId },
      },
      _count: {
        select: {
          athletes: true,
          members: true,
        },
      },
    },
  });

  if (!team) {
    throw new Error('Team not found');
  }

  if (team.members.length === 0) {
    throw new Error('Not a member of this team');
  }

  return {
    id: team.id,
    name: team.name,
    slug: team.slug,
    inviteCode: team.members[0].role === 'OWNER' ? team.inviteCode : null,
    isPublic: team.isPublic,
    visibilitySetting: team.visibilitySetting,
    role: team.members[0].role,
    athleteCount: team._count.athletes,
    memberCount: team._count.members,
  };
}

/**
 * Update team settings
 */
export async function updateTeam(teamId, userId, updates) {
  // Verify ownership
  const membership = await prisma.teamMember.findUnique({
    where: { userId_teamId: { userId, teamId } },
  });

  if (!membership || membership.role !== 'OWNER') {
    throw new Error('Only team owner can update settings');
  }

  const allowedFields = ['name', 'isPublic', 'visibilitySetting'];
  const data = {};
  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      data[field] = updates[field];
    }
  }

  const team = await prisma.team.update({
    where: { id: teamId },
    data,
  });

  return team;
}

/**
 * Get team members
 */
export async function getTeamMembers(teamId) {
  const members = await prisma.teamMember.findMany({
    where: { teamId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
  });

  return members.map((m) => ({
    id: m.id,
    userId: m.user.id,
    email: m.user.email,
    name: m.user.name,
    role: m.role,
    joinedAt: m.createdAt,
  }));
}

/**
 * Join team via invite code
 */
export async function joinTeamByCode(code, userId) {
  const team = await prisma.team.findUnique({
    where: { inviteCode: code },
  });

  if (!team) {
    throw new Error('Invalid invite code');
  }

  // Check if already a member
  const existing = await prisma.teamMember.findUnique({
    where: { userId_teamId: { userId, teamId: team.id } },
  });

  if (existing) {
    throw new Error('Already a member of this team');
  }

  await prisma.teamMember.create({
    data: {
      userId,
      teamId: team.id,
      role: 'ATHLETE', // Default role for code joins
    },
  });

  return {
    id: team.id,
    name: team.name,
    slug: team.slug,
    role: 'ATHLETE',
  };
}

/**
 * Search public teams
 */
export async function searchTeams(query) {
  const teams = await prisma.team.findMany({
    where: {
      isPublic: true,
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { slug: { contains: query, mode: 'insensitive' } },
      ],
    },
    select: {
      id: true,
      name: true,
      slug: true,
      _count: {
        select: { members: true },
      },
    },
    take: 20,
  });

  return teams.map((t) => ({
    id: t.id,
    name: t.name,
    slug: t.slug,
    memberCount: t._count.members,
  }));
}

/**
 * Regenerate invite code
 */
export async function regenerateInviteCode(teamId, userId) {
  const membership = await prisma.teamMember.findUnique({
    where: { userId_teamId: { userId, teamId } },
  });

  if (!membership || !['OWNER', 'COACH'].includes(membership.role)) {
    throw new Error('Insufficient permissions');
  }

  const newCode = generateInviteCode();
  await prisma.team.update({
    where: { id: teamId },
    data: { inviteCode: newCode },
  });

  return newCode;
}

/**
 * Update member role
 */
export async function updateMemberRole(teamId, targetUserId, newRole, requesterId) {
  // Verify requester is owner
  const requesterMembership = await prisma.teamMember.findUnique({
    where: { userId_teamId: { userId: requesterId, teamId } },
  });

  if (!requesterMembership || requesterMembership.role !== 'OWNER') {
    throw new Error('Only team owner can update roles');
  }

  // Cannot change your own role
  if (targetUserId === requesterId) {
    throw new Error('Cannot change your own role');
  }

  const validRoles = ['OWNER', 'COACH', 'COXSWAIN', 'ATHLETE'];
  if (!validRoles.includes(newRole)) {
    throw new Error('Invalid role');
  }

  // Use transaction to atomically check owner count and update role
  const updated = await prisma.$transaction(async (tx) => {
    // Get target member's current role
    const targetMembership = await tx.teamMember.findUnique({
      where: { userId_teamId: { userId: targetUserId, teamId } },
    });

    if (!targetMembership) {
      throw new Error('Target member not found');
    }

    // If demoting from OWNER, check if they're the last owner
    if (targetMembership.role === 'OWNER' && newRole !== 'OWNER') {
      const ownerCount = await tx.teamMember.count({
        where: {
          teamId,
          role: 'OWNER',
        },
      });

      if (ownerCount <= 1) {
        throw new Error('Cannot demote the last team owner. Transfer ownership to another member first.');
      }
    }

    // Update the role
    return await tx.teamMember.update({
      where: { userId_teamId: { userId: targetUserId, teamId } },
      data: { role: newRole },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  });

  return {
    userId: updated.user.id,
    name: updated.user.name,
    email: updated.user.email,
    role: updated.role,
  };
}

/**
 * Remove member from team
 */
export async function removeMember(teamId, targetUserId, requesterId) {
  // Use transaction to atomically check owner count and remove member
  await prisma.$transaction(async (tx) => {
    // Verify requester permissions
    const requesterMembership = await tx.teamMember.findUnique({
      where: { userId_teamId: { userId: requesterId, teamId } },
    });

    if (!requesterMembership || !['OWNER', 'COACH'].includes(requesterMembership.role)) {
      throw new Error('Insufficient permissions');
    }

    // Get target membership
    const targetMembership = await tx.teamMember.findUnique({
      where: { userId_teamId: { userId: targetUserId, teamId } },
    });

    if (!targetMembership) {
      throw new Error('Member not found');
    }

    // If removing an owner (including self-removal), check if they're the last owner
    if (targetMembership.role === 'OWNER') {
      const ownerCount = await tx.teamMember.count({
        where: {
          teamId,
          role: 'OWNER',
        },
      });

      if (ownerCount <= 1) {
        throw new Error('Cannot remove the last team owner. Transfer ownership to another member first.');
      }
    }

    // Coach can only remove athletes
    if (requesterMembership.role === 'COACH' && ['COACH', 'OWNER'].includes(targetMembership.role)) {
      throw new Error('Coaches cannot remove other coaches or owners');
    }

    // Perform the deletion
    await tx.teamMember.delete({
      where: { userId_teamId: { userId: targetUserId, teamId } },
    });
  });
}
