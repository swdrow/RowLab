import crypto from 'crypto';
import { prisma } from '../db/connection.js';
import { linkAthleteToUser } from './athleteService.js';

const INVITE_EXPIRY_DAYS = 7;

/**
 * Generate and hash invite token
 */
function generateInviteToken() {
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  return { token, tokenHash };
}

/**
 * Create an invitation for an athlete
 */
export async function createInvitation(teamId, athleteId, email, invitedBy) {
  // Verify athlete exists and belongs to team
  const athlete = await prisma.athlete.findFirst({
    where: { id: athleteId, teamId },
  });

  if (!athlete) {
    throw new Error('Athlete not found');
  }

  if (athlete.userId) {
    throw new Error('Athlete already has a linked account');
  }

  // Check for existing pending invitation
  const existingInvite = await prisma.invitation.findFirst({
    where: {
      athleteId,
      status: 'pending',
      expiresAt: { gt: new Date() },
    },
  });

  if (existingInvite) {
    throw new Error('Active invitation already exists for this athlete');
  }

  const { token, tokenHash } = generateInviteToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + INVITE_EXPIRY_DAYS);

  const invitation = await prisma.invitation.create({
    data: {
      teamId,
      athleteId,
      email: email || athlete.email,
      tokenHash,
      expiresAt,
    },
    include: {
      athlete: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
      team: {
        select: {
          name: true,
        },
      },
    },
  });

  // Update athlete email if provided
  if (email && email !== athlete.email) {
    await prisma.athlete.update({
      where: { id: athleteId },
      data: { email },
    });
  }

  return {
    id: invitation.id,
    token, // Plain token to send to user (only returned once)
    email: invitation.email,
    athleteName: `${invitation.athlete.firstName} ${invitation.athlete.lastName}`,
    teamName: invitation.team.name,
    expiresAt: invitation.expiresAt,
    inviteLink: `/invite/claim/${token}`,
  };
}

/**
 * Get pending invitations for a team
 */
export async function getTeamInvitations(teamId) {
  const invitations = await prisma.invitation.findMany({
    where: {
      teamId,
      status: 'pending',
    },
    include: {
      athlete: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return invitations.map((inv) => ({
    id: inv.id,
    email: inv.email,
    athleteId: inv.athleteId,
    athleteName: inv.athlete ? `${inv.athlete.firstName} ${inv.athlete.lastName}` : null,
    status: inv.status,
    expiresAt: inv.expiresAt,
    isExpired: new Date() > inv.expiresAt,
    createdAt: inv.createdAt,
  }));
}

/**
 * Validate invitation token
 */
export async function validateInvitation(token) {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const invitation = await prisma.invitation.findUnique({
    where: { tokenHash },
    include: {
      athlete: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
      team: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  });

  if (!invitation) {
    return { valid: false, error: 'Invalid invitation token' };
  }

  if (invitation.status !== 'pending') {
    return { valid: false, error: `Invitation has already been ${invitation.status}` };
  }

  if (new Date() > invitation.expiresAt) {
    // Mark as expired
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { status: 'expired' },
    });
    return { valid: false, error: 'Invitation has expired' };
  }

  return {
    valid: true,
    invitation: {
      id: invitation.id,
      email: invitation.email,
      athleteId: invitation.athleteId,
      athleteName: invitation.athlete
        ? `${invitation.athlete.firstName} ${invitation.athlete.lastName}`
        : null,
      team: invitation.team,
    },
  };
}

/**
 * Claim invitation and link athlete to user
 */
export async function claimInvitation(token, userId) {
  const validation = await validateInvitation(token);

  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const { invitation } = validation;
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  // Link athlete to user
  if (invitation.athleteId) {
    await linkAthleteToUser(invitation.athleteId, userId, invitation.team.id);
  } else {
    // Just add user to team if no specific athlete
    await prisma.teamMember.upsert({
      where: {
        userId_teamId: { userId, teamId: invitation.team.id },
      },
      update: {},
      create: {
        userId,
        teamId: invitation.team.id,
        role: 'ATHLETE',
      },
    });
  }

  // Mark invitation as claimed
  await prisma.invitation.update({
    where: { tokenHash },
    data: { status: 'claimed' },
  });

  return {
    success: true,
    team: invitation.team,
    athleteId: invitation.athleteId,
  };
}

/**
 * Revoke an invitation
 */
export async function revokeInvitation(invitationId, teamId) {
  const invitation = await prisma.invitation.findFirst({
    where: { id: invitationId, teamId },
  });

  if (!invitation) {
    throw new Error('Invitation not found');
  }

  if (invitation.status !== 'pending') {
    throw new Error('Can only revoke pending invitations');
  }

  await prisma.invitation.update({
    where: { id: invitationId },
    data: { status: 'revoked' },
  });

  return { revoked: true };
}

/**
 * Resend invitation (generate new token)
 */
export async function resendInvitation(invitationId, teamId) {
  const invitation = await prisma.invitation.findFirst({
    where: { id: invitationId, teamId },
    include: {
      athlete: true,
      team: true,
    },
  });

  if (!invitation) {
    throw new Error('Invitation not found');
  }

  if (invitation.status !== 'pending') {
    throw new Error('Can only resend pending invitations');
  }

  // Generate new token
  const { token, tokenHash } = generateInviteToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + INVITE_EXPIRY_DAYS);

  await prisma.invitation.update({
    where: { id: invitationId },
    data: { tokenHash, expiresAt },
  });

  return {
    id: invitation.id,
    token,
    email: invitation.email,
    athleteName: invitation.athlete
      ? `${invitation.athlete.firstName} ${invitation.athlete.lastName}`
      : null,
    teamName: invitation.team.name,
    expiresAt,
    inviteLink: `/invite/claim/${token}`,
  };
}

/**
 * Get invitation by ID (for team admin view)
 */
export async function getInvitation(invitationId, teamId) {
  const invitation = await prisma.invitation.findFirst({
    where: { id: invitationId, teamId },
    include: {
      athlete: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  if (!invitation) {
    throw new Error('Invitation not found');
  }

  return {
    id: invitation.id,
    email: invitation.email,
    athleteId: invitation.athleteId,
    athleteName: invitation.athlete
      ? `${invitation.athlete.firstName} ${invitation.athlete.lastName}`
      : null,
    status: invitation.status,
    expiresAt: invitation.expiresAt,
    isExpired: new Date() > invitation.expiresAt,
    createdAt: invitation.createdAt,
  };
}

/**
 * Clean up expired invitations (for cron job)
 */
export async function cleanupExpiredInvitations() {
  const result = await prisma.invitation.updateMany({
    where: {
      status: 'pending',
      expiresAt: { lt: new Date() },
    },
    data: { status: 'expired' },
  });

  return { expiredCount: result.count };
}
