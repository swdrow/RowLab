import crypto from 'crypto';
import { prisma } from '../db/connection.js';
import { generateTeamId } from '../utils/teamIdGenerator.js';
import { logActivity } from './teamActivityService.js';
import logger from '../utils/logger.js';

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
 * Generate legacy invite code (hex format)
 */
function generateLegacyInviteCode() {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
}

/**
 * Create a new team
 */
export async function createTeam({ name, userId, isPublic = false, description, sport }) {
  const slug = generateSlug(name);
  const inviteCode = generateLegacyInviteCode();
  const generatedId = await generateTeamId(prisma);

  const team = await prisma.team.create({
    data: {
      name,
      slug,
      generatedId,
      inviteCode,
      isPublic,
      description: description || null,
      sport: sport || null,
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

  // Fire-and-forget activity log
  logActivity({
    teamId: team.id,
    userId,
    type: 'team_created',
    title: 'Team created',
    data: { name, generatedId },
  }).catch((err) => logger.error('Failed to log team creation', { error: err.message }));

  return {
    id: team.id,
    name: team.name,
    slug: team.slug,
    generatedId: team.generatedId,
    inviteCode: team.inviteCode,
    isPublic: team.isPublic,
    description: team.description,
    sport: team.sport,
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
    generatedId: team.generatedId,
    inviteCode: team.members[0].role === 'OWNER' ? team.inviteCode : null,
    isPublic: team.isPublic,
    visibilitySetting: team.visibilitySetting,
    description: team.description,
    sport: team.sport,
    welcomeMessage: team.welcomeMessage,
    role: team.members[0].role,
    athleteCount: team._count.athletes,
    memberCount: team._count.members,
  };
}

/**
 * Get team by identifier (slug or generatedId) with membership check.
 *
 * Tries slug first, then generatedId. Returns full team data including role.
 *
 * @param {string} identifier - Slug or generatedId
 * @param {string} userId - User UUID for membership check
 * @returns {Promise<object>} Team data with role and memberCount
 */
export async function getTeamByIdentifier(identifier, userId) {
  // Try slug first
  let team = await prisma.team.findUnique({
    where: { slug: identifier },
    include: {
      members: {
        where: { userId },
      },
      _count: {
        select: { members: true },
      },
    },
  });

  // If not found by slug, try generatedId
  if (!team) {
    team = await prisma.team.findUnique({
      where: { generatedId: identifier },
      include: {
        members: {
          where: { userId },
        },
        _count: {
          select: { members: true },
        },
      },
    });
  }

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
    generatedId: team.generatedId,
    description: team.description,
    sport: team.sport,
    welcomeMessage: team.welcomeMessage,
    isPublic: team.isPublic,
    visibilitySetting: team.visibilitySetting,
    role: team.members[0].role,
    memberCount: team._count.members,
  };
}

/**
 * Get team overview stats (total meters, active members, workouts this week).
 *
 * @param {string} teamId - Team UUID
 * @returns {Promise<object>} { totalMeters, activeMembers, workoutsThisWeek }
 */
export async function getTeamOverview(teamId) {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const [distanceResult, activeMembers, workoutsThisWeek] = await Promise.all([
    // Total meters from all workouts for this team
    prisma.workout.aggregate({
      where: { teamId },
      _sum: { distanceM: true },
    }),
    // Active member count
    prisma.teamMember.count({
      where: { teamId },
    }),
    // Workouts in the last 7 days
    prisma.workout.count({
      where: {
        teamId,
        createdAt: { gte: oneWeekAgo },
      },
    }),
  ]);

  return {
    totalMeters: distanceResult._sum.distanceM || 0,
    activeMembers,
    workoutsThisWeek,
  };
}

/**
 * Get full team roster with member cards.
 *
 * Returns user details, role, join date, and recent activity summary
 * (last workout date, workout count in last 30 days).
 *
 * @param {string} teamId - Team UUID
 * @returns {Promise<object[]>} Array of member card objects
 */
export async function getTeamRoster(teamId) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const members = await prisma.teamMember.findMany({
    where: { teamId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  // Batch fetch recent workout stats for all members
  const userIds = members.map((m) => m.userId);

  // Get last workout date and 30-day count per user
  const [lastWorkouts, workoutCounts] = await Promise.all([
    // Last workout per user for this team
    prisma.workout.findMany({
      where: {
        teamId,
        userId: { in: userIds },
      },
      select: {
        userId: true,
        date: true,
      },
      orderBy: { date: 'desc' },
      distinct: ['userId'],
    }),
    // 30-day workout counts per user
    prisma.workout.groupBy({
      by: ['userId'],
      where: {
        teamId,
        userId: { in: userIds },
        createdAt: { gte: thirtyDaysAgo },
      },
      _count: { id: true },
    }),
  ]);

  const lastWorkoutMap = Object.fromEntries(lastWorkouts.map((w) => [w.userId, w.date]));
  const countMap = Object.fromEntries(workoutCounts.map((w) => [w.userId, w._count.id]));

  return members.map((m) => ({
    id: m.id,
    userId: m.user.id,
    name: m.user.name,
    email: m.user.email,
    avatarUrl: m.user.avatarUrl,
    role: m.role,
    joinedAt: m.createdAt,
    lastWorkoutDate: lastWorkoutMap[m.userId] || null,
    workoutsLast30Days: countMap[m.userId] || 0,
  }));
}

/**
 * Get team announcements, ordered by pinned desc then createdAt desc.
 *
 * @param {string} teamId - Team UUID
 * @returns {Promise<object[]>} Array of announcement objects with author name
 */
export async function getTeamAnnouncements(teamId) {
  const announcements = await prisma.announcement.findMany({
    where: { teamId },
    include: {
      author: {
        select: { id: true, name: true, avatarUrl: true },
      },
    },
    orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
  });

  return announcements.map((a) => ({
    id: a.id,
    title: a.title,
    content: a.content,
    priority: a.priority,
    isPinned: a.pinned,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
    authorId: a.author.id,
    authorName: a.author.name,
    authorAvatarUrl: a.author.avatarUrl,
  }));
}

/**
 * Create a new announcement for a team.
 *
 * Caller must verify OWNER or COACH role before calling.
 *
 * @param {object} params
 * @param {string} params.teamId - Team UUID
 * @param {string} params.userId - Author user UUID
 * @param {string} params.title - Announcement title
 * @param {string} params.content - Announcement content
 * @param {boolean} [params.isPinned=false] - Whether to pin
 * @returns {Promise<object>} Created announcement
 */
export async function createAnnouncement({ teamId, userId, title, content, isPinned = false }) {
  const announcement = await prisma.announcement.create({
    data: {
      teamId,
      authorId: userId,
      title,
      content,
      pinned: isPinned,
    },
    include: {
      author: {
        select: { id: true, name: true, avatarUrl: true },
      },
    },
  });

  // Fire-and-forget activity log
  logActivity({
    teamId,
    userId,
    type: 'announcement',
    title: `Announcement: ${title}`,
    data: { announcementId: announcement.id, isPinned },
  }).catch((err) => logger.error('Failed to log announcement activity', { error: err.message }));

  return {
    id: announcement.id,
    title: announcement.title,
    content: announcement.content,
    priority: announcement.priority,
    isPinned: announcement.pinned,
    createdAt: announcement.createdAt,
    authorId: announcement.author.id,
    authorName: announcement.author.name,
    authorAvatarUrl: announcement.author.avatarUrl,
  };
}

/**
 * Leave a team. Cannot leave if you are the only OWNER.
 * Does NOT delete personal workouts.
 *
 * @param {string} teamId - Team UUID
 * @param {string} userId - User UUID
 * @returns {Promise<{ success: boolean }>}
 */
export async function leaveTeam(teamId, userId) {
  const membership = await prisma.teamMember.findUnique({
    where: { userId_teamId: { userId, teamId } },
  });

  if (!membership) {
    throw new Error('Not a member of this team');
  }

  // If user is OWNER, check they're not the only one
  if (membership.role === 'OWNER') {
    const ownerCount = await prisma.teamMember.count({
      where: { teamId, role: 'OWNER' },
    });
    if (ownerCount <= 1) {
      throw new Error('Cannot leave team as the only owner. Transfer ownership first.');
    }
  }

  await prisma.teamMember.delete({
    where: { userId_teamId: { userId, teamId } },
  });

  // Fire-and-forget activity log
  logActivity({
    teamId,
    userId,
    type: 'member_left',
    title: 'Member left the team',
  }).catch((err) => logger.error('Failed to log leave activity', { error: err.message }));

  return { success: true };
}

/**
 * Delete a team. Only OWNER can delete.
 * Cascade delete handled by Prisma (onDelete: Cascade on related models).
 *
 * @param {string} teamId - Team UUID
 * @param {string} userId - Requesting user UUID (must be OWNER)
 * @returns {Promise<{ success: boolean }>}
 */
export async function deleteTeam(teamId, userId) {
  const membership = await prisma.teamMember.findUnique({
    where: { userId_teamId: { userId, teamId } },
  });

  if (!membership || membership.role !== 'OWNER') {
    throw new Error('Only team owner can delete the team');
  }

  await prisma.team.delete({
    where: { id: teamId },
  });

  return { success: true };
}

/**
 * Check if a slug is available for a team.
 * Validates slug format (lowercase, alphanumeric + hyphens, 3-50 chars).
 *
 * @param {string} slug - Proposed slug
 * @param {string} teamId - Current team UUID (exclude from check)
 * @returns {Promise<{ available: boolean }>}
 */
export async function checkSlugAvailability(slug, teamId) {
  // Validate format
  const slugRegex = /^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$/;
  if (!slugRegex.test(slug) || slug.length < 3 || slug.length > 50) {
    throw new Error(
      'Invalid slug format. Must be 3-50 characters, lowercase alphanumeric and hyphens.'
    );
  }

  const existing = await prisma.team.findUnique({
    where: { slug },
    select: { id: true },
  });

  return { available: !existing || existing.id === teamId };
}

/**
 * Update team settings.
 *
 * OWNER or COACH can update non-destructive settings.
 * When slug is changed, validates format and checks availability.
 * Logs activity "team_updated".
 */
export async function updateTeam(teamId, userId, updates) {
  const membership = await prisma.teamMember.findUnique({
    where: { userId_teamId: { userId, teamId } },
  });

  if (!membership || !['OWNER', 'ADMIN', 'COACH'].includes(membership.role)) {
    throw new Error('Only team owner or coach can update settings');
  }

  const allowedFields = [
    'name',
    'description',
    'sport',
    'slug',
    'welcomeMessage',
    'isPublic',
    'visibilitySetting',
  ];
  const data = {};
  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      data[field] = updates[field];
    }
  }

  // Validate and check slug if being set
  if (data.slug) {
    const slugRegex = /^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$/;
    if (!slugRegex.test(data.slug) || data.slug.length < 3 || data.slug.length > 50) {
      throw new Error(
        'Invalid slug format. Must be 3-50 characters, lowercase alphanumeric and hyphens.'
      );
    }

    const { available } = await checkSlugAvailability(data.slug, teamId);
    if (!available) {
      throw new Error('Slug is already taken');
    }
  }

  const team = await prisma.team.update({
    where: { id: teamId },
    data,
  });

  // Fire-and-forget activity log
  logActivity({
    teamId,
    userId,
    type: 'team_updated',
    title: 'Team settings updated',
    data: { updatedFields: Object.keys(data) },
  }).catch((err) => logger.error('Failed to log team update activity', { error: err.message }));

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
 * Join team via legacy invite code (hex format on Team.inviteCode field)
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

  // Fire-and-forget activity log
  logActivity({
    teamId: team.id,
    userId,
    type: 'member_joined',
    title: 'New member joined the team',
    data: { role: 'ATHLETE', viaLegacyCode: true },
  }).catch((err) => logger.error('Failed to log join activity', { error: err.message }));

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
 * Regenerate legacy invite code
 */
export async function regenerateInviteCode(teamId, userId) {
  const membership = await prisma.teamMember.findUnique({
    where: { userId_teamId: { userId, teamId } },
  });

  if (!membership || !['OWNER', 'ADMIN', 'COACH'].includes(membership.role)) {
    throw new Error('Insufficient permissions');
  }

  const newCode = generateLegacyInviteCode();
  await prisma.team.update({
    where: { id: teamId },
    data: { inviteCode: newCode },
  });

  return newCode;
}

/**
 * Update member role.
 *
 * - OWNER can change anyone's role to anything
 * - COACH can promote ATHLETE to COACH
 * - COACH cannot demote anyone or promote to OWNER
 * - Cannot change your own role
 *
 * Logs activity "role_changed".
 */
export async function updateMemberRole(teamId, targetUserId, newRole, requesterId) {
  // Cannot change your own role
  if (targetUserId === requesterId) {
    throw new Error('Cannot change your own role');
  }

  const validRoles = ['OWNER', 'ADMIN', 'COACH', 'COXSWAIN', 'ATHLETE'];
  if (!validRoles.includes(newRole)) {
    throw new Error('Invalid role');
  }

  return prisma.$transaction(
    async (tx) => {
      // Verify requester permissions
      const requesterMembership = await tx.teamMember.findUnique({
        where: { userId_teamId: { userId: requesterId, teamId } },
      });

      if (!requesterMembership || !['OWNER', 'ADMIN', 'COACH'].includes(requesterMembership.role)) {
        throw new Error('Insufficient permissions to update roles');
      }

      // Get current target membership
      const targetMembership = await tx.teamMember.findUnique({
        where: { userId_teamId: { userId: targetUserId, teamId } },
      });

      if (!targetMembership) {
        throw new Error('Member not found');
      }

      const roleHierarchy = { OWNER: 5, ADMIN: 4, COACH: 3, COXSWAIN: 2, ATHLETE: 1 };
      const currentLevel = roleHierarchy[targetMembership.role];
      const newLevel = roleHierarchy[newRole];

      // If demoting an owner, check that they are not the last one
      if (targetMembership.role === 'OWNER' && newRole !== 'OWNER') {
        const ownerCount = await tx.teamMember.count({
          where: { teamId, role: 'OWNER' },
        });

        if (ownerCount <= 1) {
          throw new Error('Cannot demote the last team owner');
        }
      }

      // ADMIN-specific restrictions
      if (requesterMembership.role === 'ADMIN') {
        if (newLevel >= roleHierarchy['ADMIN']) {
          throw new Error('Only team owner can promote to ADMIN or OWNER');
        }
        if (currentLevel >= roleHierarchy['ADMIN']) {
          throw new Error('Only team owner can change admin or owner roles');
        }
      }

      // COACH-specific restrictions
      if (requesterMembership.role === 'COACH') {
        if (newLevel > roleHierarchy['COACH']) {
          throw new Error('Only team owner can promote to OWNER');
        }
        if (currentLevel >= roleHierarchy['COACH']) {
          throw new Error('Only team owner can change coach or owner roles');
        }
        if (newLevel < currentLevel) {
          throw new Error('Only team owner can demote members');
        }
      }

      const updated = await tx.teamMember.update({
        where: { userId_teamId: { userId: targetUserId, teamId } },
        data: { role: newRole },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      // Fire-and-forget activity log (outside transaction is fine)
      logActivity({
        teamId,
        userId: requesterId,
        type: 'role_changed',
        title: `Role changed for ${updated.user.name}`,
        data: {
          targetUserId,
          oldRole: targetMembership.role,
          newRole,
        },
      }).catch((err) => logger.error('Failed to log role change activity', { error: err.message }));

      return {
        userId: updated.user.id,
        name: updated.user.name,
        email: updated.user.email,
        role: updated.role,
      };
    },
    { isolationLevel: 'Serializable' }
  );
}

/**
 * Remove member from team.
 * Logs activity "member_left".
 */
export async function removeMember(teamId, targetUserId, requesterId) {
  return prisma.$transaction(
    async (tx) => {
      // Verify requester permissions
      const requesterMembership = await tx.teamMember.findUnique({
        where: { userId_teamId: { userId: requesterId, teamId } },
      });

      if (!requesterMembership || !['OWNER', 'ADMIN', 'COACH'].includes(requesterMembership.role)) {
        throw new Error('Insufficient permissions');
      }

      // Get target membership
      const targetMembership = await tx.teamMember.findUnique({
        where: { userId_teamId: { userId: targetUserId, teamId } },
        include: {
          user: {
            select: { name: true },
          },
        },
      });

      if (!targetMembership) {
        throw new Error('Member not found');
      }

      // If removing an owner, check that they are not the last one
      if (targetMembership.role === 'OWNER') {
        const ownerCount = await tx.teamMember.count({
          where: { teamId, role: 'OWNER' },
        });

        if (ownerCount <= 1) {
          throw new Error('Cannot remove the last team owner');
        }
      }

      // ADMIN can't be removed by non-owners
      if (targetMembership.role === 'ADMIN' && requesterMembership.role !== 'OWNER') {
        throw new Error('Only team owner can remove admins');
      }

      // Coach can only remove athletes
      if (
        requesterMembership.role === 'COACH' &&
        ['ADMIN', 'COACH'].includes(targetMembership.role)
      ) {
        throw new Error('Coaches cannot remove admins or other coaches');
      }

      await tx.teamMember.delete({
        where: { userId_teamId: { userId: targetUserId, teamId } },
      });

      // Fire-and-forget activity log
      logActivity({
        teamId,
        userId: requesterId,
        type: 'member_left',
        title: `${targetMembership.user.name} was removed from the team`,
        data: { removedUserId: targetUserId, removedBy: requesterId },
      }).catch((err) =>
        logger.error('Failed to log member removal activity', { error: err.message })
      );
    },
    { isolationLevel: 'Serializable' }
  );
}
