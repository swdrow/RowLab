import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '../db/connection.js';
import { generateAccessToken, generateRefreshToken, revokeAllUserTokens } from './tokenService.js';

const SALT_ROUNDS = 12;

/**
 * Register a new user
 */
export async function registerUser({ email, password, name }) {
  // Check if user exists
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new Error('Email already registered');
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name,
    },
  });

  return { id: user.id, email: user.email, name: user.name };
}

/**
 * Login user and generate tokens
 * Supports login with email (regular users) or username (admin accounts)
 * Note: Both email and username are case-insensitive
 */
export async function loginUser({ email, password }) {
  // Check if input looks like an email or username
  const isEmail = email && email.includes('@');

  // Normalize input to lowercase for case-insensitive matching
  const normalizedInput = email?.toLowerCase().trim();

  let user;
  if (isEmail) {
    // Regular email login (case-insensitive)
    user = await prisma.user.findFirst({
      where: {
        email: { equals: normalizedInput, mode: 'insensitive' },
      },
      include: {
        memberships: {
          include: { team: true },
        },
      },
    });
  } else {
    // Username login (for admin accounts, case-insensitive)
    user = await prisma.user.findFirst({
      where: {
        username: { equals: normalizedInput, mode: 'insensitive' },
      },
      include: {
        memberships: {
          include: { team: true },
        },
      },
    });
  }

  if (!user) {
    throw new Error('Invalid credentials');
  }

  if (user.status !== 'active') {
    throw new Error('Account is suspended');
  }

  const validPassword = await bcrypt.compare(password, user.passwordHash);
  if (!validPassword) {
    throw new Error('Invalid credentials');
  }

  // Determine active team: honor persisted preference if user is still a member
  let activeTeamId = null;
  let activeTeamRole = null;

  if (user.activeTeamId) {
    const persistedMembership = user.memberships.find((m) => m.teamId === user.activeTeamId);
    if (persistedMembership) {
      activeTeamId = persistedMembership.teamId;
      activeTeamRole = persistedMembership.role;
    }
  }

  // Fall back to first membership if no persisted preference or no longer a member
  if (!activeTeamId) {
    const firstMembership = user.memberships[0];
    activeTeamId = firstMembership?.teamId || null;
    activeTeamRole = firstMembership?.role || null;
  }

  // Persist the active team preference
  if (activeTeamId) {
    await prisma.user.update({
      where: { id: user.id },
      data: { activeTeamId },
    });
  }

  // Generate tokens
  const accessToken = generateAccessToken(user, activeTeamId, activeTeamRole);
  const { token: refreshToken } = await generateRefreshToken(user.id);

  return {
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      name: user.name,
      isAdmin: user.isAdmin,
    },
    teams: user.memberships.map((m) => ({
      id: m.team.id,
      name: m.team.name,
      slug: m.team.slug,
      role: m.role,
    })),
    activeTeamId,
    accessToken,
    refreshToken,
  };
}

/**
 * Switch active team context
 */
export async function switchTeam(userId, newTeamId) {
  const membership = await prisma.teamMember.findUnique({
    where: {
      userId_teamId: { userId, teamId: newTeamId },
    },
    include: {
      user: true,
      team: true,
    },
  });

  if (!membership) {
    throw new Error('Not a member of this team');
  }

  // Persist active team preference
  await prisma.user.update({
    where: { id: userId },
    data: { activeTeamId: newTeamId },
  });

  const accessToken = generateAccessToken(membership.user, membership.teamId, membership.role);

  return {
    accessToken,
    team: {
      id: membership.team.id,
      name: membership.team.name,
      slug: membership.team.slug,
      role: membership.role,
    },
  };
}

/**
 * Get current user with teams
 */
export async function getCurrentUser(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      memberships: {
        include: { team: true },
      },
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  return {
    id: user.id,
    email: user.email,
    username: user.username,
    name: user.name,
    isAdmin: user.isAdmin,
    activeTeamId: user.activeTeamId,
    teams: user.memberships.map((m) => ({
      id: m.team.id,
      name: m.team.name,
      slug: m.team.slug,
      role: m.role,
    })),
  };
}

/**
 * Logout user (revoke refresh token)
 */
export async function logoutUser(userId) {
  await revokeAllUserTokens(userId);
}

/**
 * Generate invite token hash
 */
export function hashInviteToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Generate random invite token
 */
export function generateInviteToken() {
  return crypto.randomBytes(32).toString('hex');
}
