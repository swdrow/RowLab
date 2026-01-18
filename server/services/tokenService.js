import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../db/connection.js';

const ACCESS_TOKEN_EXPIRY = process.env.JWT_ACCESS_EXPIRY || '15m';
const REFRESH_TOKEN_EXPIRY_DAYS = 7;

/**
 * Generate access token (short-lived)
 */
export function generateAccessToken(user, activeTeamId, activeTeamRole) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      activeTeamId,
      activeTeamRole,
    },
    process.env.JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
}

/**
 * Generate refresh token and store in database
 */
export async function generateRefreshToken(userId, familyId = null) {
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const newFamilyId = familyId || crypto.randomUUID();

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash,
      familyId: newFamilyId,
      expiresAt,
    },
  });

  return { token, familyId: newFamilyId };
}

/**
 * Verify and rotate refresh token
 */
export async function rotateRefreshToken(token) {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const storedToken = await prisma.refreshToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!storedToken) {
    return { valid: false, error: 'Invalid token' };
  }

  // Check if token was revoked (reuse detection)
  if (storedToken.revokedAt) {
    // Revoke entire family - potential token theft
    await prisma.refreshToken.updateMany({
      where: { familyId: storedToken.familyId },
      data: { revokedAt: new Date() },
    });
    return { valid: false, error: 'Token reuse detected - all sessions revoked' };
  }

  // Check expiry
  if (new Date() > storedToken.expiresAt) {
    return { valid: false, error: 'Token expired' };
  }

  // Revoke current token
  await prisma.refreshToken.update({
    where: { id: storedToken.id },
    data: { revokedAt: new Date() },
  });

  // Generate new token in same family
  const newToken = await generateRefreshToken(storedToken.userId, storedToken.familyId);

  return {
    valid: true,
    user: storedToken.user,
    newRefreshToken: newToken.token,
  };
}

/**
 * Revoke all refresh tokens for a user
 */
export async function revokeAllUserTokens(userId) {
  await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

/**
 * Verify access token
 */
export function verifyAccessToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
}
