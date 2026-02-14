import crypto from 'crypto';
import { prisma } from '../db/connection.js';
import { logActivity } from './teamActivityService.js';
import logger from '../utils/logger.js';

/**
 * Letters used for invite code generation.
 * Excludes I and O to avoid confusion with 1 and 0.
 */
const LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // 24 chars

/**
 * Generate an invite code in ABC-1234 format.
 * 3 uppercase letters (no I/O) + hyphen + 4 digits.
 */
function generateCode() {
  const bytes = crypto.randomBytes(4);
  // First 3 bytes for letters, last byte + extra for digits
  const letter1 = LETTERS[bytes[0] % 24];
  const letter2 = LETTERS[bytes[1] % 24];
  const letter3 = LETTERS[bytes[2] % 24];
  // Generate 4-digit number (0000-9999)
  const digits = String((bytes[3] * 256 + bytes[0]) % 10000).padStart(4, '0');
  return `${letter1}${letter2}${letter3}-${digits}`;
}

/**
 * Compute expiry date from a duration option.
 * @param {string|null} expiry - "24h", "7d", "30d", "never", or null
 * @returns {Date|null}
 */
function computeExpiresAt(expiry) {
  if (!expiry || expiry === 'never') return null;
  const now = new Date();
  switch (expiry) {
    case '24h':
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    case '7d':
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    case '30d':
      return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    default:
      return null;
  }
}

/**
 * Generate a new invite code for a team.
 *
 * @param {object} params
 * @param {string} params.teamId - Team UUID
 * @param {string} params.role - "COACH" or "ATHLETE"
 * @param {string|null} params.expiry - "24h", "7d", "30d", "never"
 * @param {number|null} params.maxUses - 1, 5, 10, 25, or null (unlimited)
 * @param {string} params.createdBy - User UUID
 * @returns {Promise<object>} Created invite code record
 */
export async function generateInviteCode({ teamId, role, expiry, maxUses, createdBy }) {
  if (!['ADMIN', 'COACH', 'ATHLETE'].includes(role)) {
    throw new Error('Role must be ADMIN, COACH, or ATHLETE');
  }

  // Generate unique code with retry
  let code;
  for (let attempt = 0; attempt < 5; attempt++) {
    code = generateCode();
    const existing = await prisma.teamInviteCode.findUnique({ where: { code } });
    if (!existing) break;
    if (attempt === 4) {
      // Last resort -- append extra random chars
      code = generateCode() + crypto.randomBytes(2).toString('hex').toUpperCase();
    }
  }

  const expiresAt = computeExpiresAt(expiry);

  const inviteCode = await prisma.teamInviteCode.create({
    data: {
      teamId,
      code,
      role,
      expiresAt,
      maxUses: maxUses || null,
      createdBy,
    },
  });

  // Fire-and-forget activity log
  logActivity({
    teamId,
    userId: createdBy,
    type: 'invite_generated',
    title: `Invite code generated for ${role.toLowerCase()} role`,
    data: { code, role, expiresAt, maxUses },
  }).catch((err) => logger.error('Failed to log invite activity', { error: err.message }));

  return inviteCode;
}

/**
 * List active (non-revoked) invite codes for a team.
 *
 * @param {string} teamId - Team UUID
 * @returns {Promise<object[]>} Array of invite code objects
 */
export async function listInviteCodes(teamId) {
  return prisma.teamInviteCode.findMany({
    where: {
      teamId,
      revokedAt: null,
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Revoke an invite code. Verifies the code belongs to the team.
 *
 * @param {string} codeId - Invite code UUID
 * @param {string} teamId - Team UUID (ownership check)
 * @returns {Promise<object>} Updated invite code record
 */
export async function revokeInviteCode(codeId, teamId) {
  const inviteCode = await prisma.teamInviteCode.findUnique({
    where: { id: codeId },
  });

  if (!inviteCode || inviteCode.teamId !== teamId) {
    throw new Error('Invite code not found');
  }

  if (inviteCode.revokedAt) {
    throw new Error('Invite code already revoked');
  }

  return prisma.teamInviteCode.update({
    where: { id: codeId },
    data: { revokedAt: new Date() },
  });
}

/**
 * Join a team using an invite code (ABC-1234 format).
 *
 * Security: role is derived from the invite code record, NOT from user input.
 * Validates: existence, revocation, expiry, usage limits, existing membership.
 *
 * @param {string} code - The invite code string
 * @param {string} userId - User UUID
 * @returns {Promise<object>} Team info + assigned role + welcome message
 */
export async function joinByInviteCode(code, userId) {
  const inviteCode = await prisma.teamInviteCode.findUnique({
    where: { code },
    include: {
      team: {
        select: {
          id: true,
          name: true,
          slug: true,
          generatedId: true,
          welcomeMessage: true,
        },
      },
    },
  });

  if (!inviteCode) {
    throw new Error('Invalid invite code');
  }

  if (inviteCode.revokedAt) {
    throw new Error('Invite code has been revoked');
  }

  if (inviteCode.expiresAt && inviteCode.expiresAt < new Date()) {
    throw new Error('Invite code has expired');
  }

  if (inviteCode.maxUses && inviteCode.usesCount >= inviteCode.maxUses) {
    throw new Error('Invite code has reached maximum uses');
  }

  // Check existing membership
  const existing = await prisma.teamMember.findUnique({
    where: { userId_teamId: { userId, teamId: inviteCode.teamId } },
  });

  if (existing) {
    throw new Error('Already a member of this team');
  }

  // Use a transaction for atomicity
  const [member] = await prisma.$transaction([
    prisma.teamMember.create({
      data: {
        userId,
        teamId: inviteCode.teamId,
        role: inviteCode.role, // Role from DB, not from request
      },
    }),
    prisma.teamInviteCode.update({
      where: { id: inviteCode.id },
      data: { usesCount: { increment: 1 } },
    }),
  ]);

  // Fire-and-forget activity log
  logActivity({
    teamId: inviteCode.teamId,
    userId,
    type: 'member_joined',
    title: 'New member joined the team',
    data: { role: inviteCode.role, viaCode: code },
  }).catch((err) => logger.error('Failed to log join activity', { error: err.message }));

  return {
    team: {
      id: inviteCode.team.id,
      name: inviteCode.team.name,
      slug: inviteCode.team.slug,
      generatedId: inviteCode.team.generatedId,
    },
    role: inviteCode.role,
    welcomeMessage: inviteCode.team.welcomeMessage,
  };
}
