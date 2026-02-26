import express from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';
import {
  registerUser,
  loginUser,
  switchTeam,
  getCurrentUser,
  logoutUser,
  changePassword,
  softDeleteAccount,
} from '../services/authService.js';
import { rotateRefreshToken, generateAccessToken } from '../services/tokenService.js';
import { authenticateToken } from '../middleware/auth.js';
import { prisma } from '../db/connection.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Validation helpers
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_FAILED',
        message: 'Invalid input',
        details: errors.array(),
      },
    });
  }
  next();
};

/**
 * CSRF protection for token refresh -- requires X-Requested-With header.
 * Browsers don't add custom headers to cross-origin simple requests,
 * so this prevents cross-site form POSTs from obtaining fresh access tokens.
 */
function requireCustomHeader(req, res, next) {
  if (!req.headers['x-requested-with']) {
    return res.status(403).json({
      success: false,
      error: { code: 'CSRF_REJECTED', message: 'Missing required header' },
    });
  }
  next();
}

/**
 * POST /api/v1/auth/register
 * Create new user account
 */
router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('name').trim().notEmpty().withMessage('Name is required'),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { email, password, name } = req.body;
      const user = await registerUser({ email, password, name });

      res.status(201).json({
        success: true,
        data: { user },
      });
    } catch (error) {
      if (error.message === 'Email already registered') {
        return res.status(409).json({
          success: false,
          error: { code: 'EMAIL_EXISTS', message: error.message },
        });
      }
      logger.error('Register error', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Registration failed' },
      });
    }
  }
);

/**
 * POST /api/v1/auth/login
 * Login and get tokens
 * Accepts either email (for regular users) or username (for admin accounts)
 */
router.post(
  '/login',
  [
    body('email').trim().notEmpty().withMessage('Email or username is required'),
    body('password').notEmpty(),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { email, password } = req.body;
      const result = await loginUser({ email, password });

      // Set refresh token as HTTP-only cookie
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.json({
        success: true,
        data: {
          user: result.user,
          teams: result.teams,
          activeTeamId: result.activeTeamId,
          accessToken: result.accessToken,
        },
      });
    } catch (error) {
      if (error.message === 'Invalid credentials') {
        return res.status(401).json({
          success: false,
          error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
        });
      }
      if (error.message === 'Account is suspended') {
        return res.status(403).json({
          success: false,
          error: { code: 'ACCOUNT_SUSPENDED', message: 'Account is suspended' },
        });
      }
      if (error.message === 'Account has been deleted') {
        return res.status(403).json({
          success: false,
          error: { code: 'ACCOUNT_DELETED', message: 'Account has been deleted' },
        });
      }
      logger.error('Login error', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Login failed' },
      });
    }
  }
);

/**
 * POST /api/v1/auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh', requireCustomHeader, async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        error: { code: 'NO_REFRESH_TOKEN', message: 'Refresh token required' },
      });
    }

    const result = await rotateRefreshToken(refreshToken);
    if (!result.valid) {
      res.clearCookie('refreshToken');
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_REFRESH_TOKEN', message: result.error },
      });
    }

    // Get user's first team for new access token
    const user = result.user;
    const membership = await prisma.teamMember.findFirst({
      where: { userId: user.id },
    });

    const accessToken = generateAccessToken(
      user,
      membership?.teamId || null,
      membership?.role || null
    );

    // Set new refresh token cookie
    res.cookie('refreshToken', result.newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      data: { accessToken },
    });
  } catch (error) {
    logger.error('Refresh error', { error: error.message });
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Token refresh failed' },
    });
  }
});

/**
 * POST /api/v1/auth/logout
 * Logout and revoke tokens
 */
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    await logoutUser(req.user.id);
    res.clearCookie('refreshToken');

    res.json({
      success: true,
      data: { message: 'Logged out successfully' },
    });
  } catch (error) {
    logger.error('Logout error', { error: error.message });
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Logout failed' },
    });
  }
});

/**
 * POST /api/v1/auth/switch-team
 * Switch active team context
 */
router.post(
  '/switch-team',
  authenticateToken,
  [body('teamId').isUUID()],
  validateRequest,
  async (req, res) => {
    try {
      const { teamId } = req.body;
      const result = await switchTeam(req.user.id, teamId);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error.message === 'Not a member of this team') {
        return res.status(403).json({
          success: false,
          error: { code: 'NOT_MEMBER', message: error.message },
        });
      }
      logger.error('Switch team error', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to switch team' },
      });
    }
  }
);

/**
 * GET /api/v1/auth/me
 * Get current user and their teams
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await getCurrentUser(req.user.id);

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    logger.error('Get user error', { error: error.message });
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to get user' },
    });
  }
});

/**
 * POST /api/v1/auth/dev-login
 * Passwordless admin login — only from localhost or Tailscale (100.x.x.x)
 * SECURITY: Only enabled in development and test environments (whitelist approach)
 */
router.post('/dev-login', async (req, res) => {
  // Only allow in development or test environments
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isTest = process.env.NODE_ENV === 'test';

  if (!isDevelopment && !isTest) {
    logger.warn('Dev-login attempt rejected in non-development environment', {
      nodeEnv: process.env.NODE_ENV || 'undefined',
    });
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Endpoint not found' },
    });
  }

  // Check source IP -- use socket address only, X-Forwarded-For is trivially spoofable
  const rawIp = req.socket.remoteAddress;
  const ip = rawIp?.replace(/^::ffff:/, '') || '';

  const isLocal = ip === '127.0.0.1' || ip === '::1' || ip === 'localhost';
  const isTailscale = ip.startsWith('100.');
  const isPrivate = ip.startsWith('10.') || ip.startsWith('192.168.');

  if (!isLocal && !isTailscale && !isPrivate) {
    logger.warn('Dev-login rejected from IP', { ip });
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Dev login only available from local/Tailscale network',
      },
    });
  }

  try {
    // Find the admin user
    const user = await prisma.user.findFirst({
      where: { isAdmin: true },
      include: {
        memberships: {
          include: { team: true },
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'NO_ADMIN', message: 'No admin user found — run npm run db:seed' },
      });
    }

    // Generate tokens (same as normal login)
    const { generateAccessToken, generateRefreshToken } =
      await import('../services/tokenService.js');

    const firstMembership = user.memberships[0];
    const activeTeamId = firstMembership?.teamId || null;
    const activeTeamRole = firstMembership?.role || null;

    const accessToken = generateAccessToken(user, activeTeamId, activeTeamRole);
    const { token: refreshToken } = await generateRefreshToken(user.id);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    logger.info('Dev-login successful', { userId: user.id, ip });

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          name: user.name,
          isAdmin: user.isAdmin,
          avatarUrl: user.avatarUrl ?? null,
        },
        teams: user.memberships.map((m) => ({
          id: m.team.id,
          name: m.team.name,
          slug: m.team.slug,
          role: m.role,
        })),
        activeTeamId,
        accessToken,
      },
    });
  } catch (error) {
    logger.error('Dev-login error', { error: error.message });
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Dev login failed' },
    });
  }
});

// Rate limiter for forgot-password (3 requests per email per hour)
const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  keyGenerator: (req) => req.body.email || req.ip,
  message: {
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Too many password reset requests, try again later' },
  },
  validate: { keyGeneratorIpFallback: false },
});

/**
 * POST /api/v1/auth/forgot-password
 * Request a password reset token
 * Always returns 200 regardless of email existence (security)
 */
router.post(
  '/forgot-password',
  forgotPasswordLimiter,
  [body('email').isEmail().normalizeEmail()],
  validateRequest,
  async (req, res) => {
    const genericMessage =
      'If an account exists with that email, you will receive a password reset link';

    try {
      const { email } = req.body;

      // Look up user by email (case-insensitive)
      const user = await prisma.user.findFirst({
        where: { email: { equals: email, mode: 'insensitive' } },
      });

      if (!user) {
        // Security: don't reveal whether email exists
        logger.info('Forgot-password for non-existent email', { email });
        return res.json({ success: true, message: genericMessage });
      }

      // Generate a random reset token
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

      // Store the token
      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          token,
          expiresAt,
        },
      });

      // In dev, log the reset URL (no email service yet)
      const resetUrl = `${req.protocol}://${req.get('host')}/reset-password?token=${token}`;
      logger.info('Password reset token generated', {
        userId: user.id,
        email: user.email,
        resetUrl,
        expiresAt: expiresAt.toISOString(),
      });

      // TODO(phase-53): Send actual email with reset link
      console.log(`[DEV] Password reset URL: ${resetUrl}`);

      res.json({ success: true, message: genericMessage });
    } catch (error) {
      logger.error('Forgot-password error', { error: error.message });
      // Still return 200 to avoid leaking info
      res.json({ success: true, message: genericMessage });
    }
  }
);

/**
 * POST /api/v1/auth/reset-password
 * Reset password using a valid token
 */
router.post(
  '/reset-password',
  [
    body('token').notEmpty().withMessage('Reset token is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { token, password } = req.body;

      // Find the token
      const resetToken = await prisma.passwordResetToken.findUnique({
        where: { token },
        include: { user: true },
      });

      if (!resetToken) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_TOKEN', message: 'Invalid or expired reset token' },
        });
      }

      // Check if token is expired
      if (resetToken.expiresAt < new Date()) {
        return res.status(400).json({
          success: false,
          error: { code: 'TOKEN_EXPIRED', message: 'Reset token has expired' },
        });
      }

      // Check if token has already been used
      if (resetToken.usedAt) {
        return res.status(400).json({
          success: false,
          error: { code: 'TOKEN_USED', message: 'Reset token has already been used' },
        });
      }

      // Hash the new password
      const passwordHash = await bcrypt.hash(password, 12);

      // Update user password and mark token as used in a transaction
      await prisma.$transaction([
        // Update the user's password
        prisma.user.update({
          where: { id: resetToken.userId },
          data: { passwordHash },
        }),
        // Mark this token as used
        prisma.passwordResetToken.update({
          where: { id: resetToken.id },
          data: { usedAt: new Date() },
        }),
        // Invalidate all other unused reset tokens for this user
        prisma.passwordResetToken.updateMany({
          where: {
            userId: resetToken.userId,
            id: { not: resetToken.id },
            usedAt: null,
          },
          data: { usedAt: new Date() },
        }),
      ]);

      logger.info('Password reset successful', {
        userId: resetToken.userId,
        email: resetToken.user.email,
      });

      res.json({
        success: true,
        message: 'Password has been reset successfully. Please log in with your new password.',
      });
    } catch (error) {
      logger.error('Reset-password error', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Password reset failed' },
      });
    }
  }
);

/**
 * POST /api/v1/auth/change-password
 * Change password for authenticated user
 */
router.post(
  '/change-password',
  authenticateToken,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('New password must be at least 8 characters'),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      await changePassword(req.user.id, currentPassword, newPassword);

      // Clear refresh cookie since all tokens were revoked
      res.clearCookie('refreshToken');

      res.json({
        success: true,
        data: { message: 'Password changed successfully' },
      });
    } catch (error) {
      if (error.code === 'INVALID_PASSWORD' || error.code === 'NO_PASSWORD') {
        return res.status(400).json({
          success: false,
          error: { code: error.code, message: error.message },
        });
      }
      logger.error('Change password error', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Password change failed' },
      });
    }
  }
);

/**
 * DELETE /api/v1/auth/account
 * Soft-delete user account (30-day grace period before permanent deletion)
 */
router.delete(
  '/account',
  authenticateToken,
  [
    body('password').notEmpty().withMessage('Password is required'),
    body('confirmation').equals('DELETE').withMessage('Must type DELETE to confirm'),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { password } = req.body;
      const { deletedAt } = await softDeleteAccount(req.user.id, password);

      res.clearCookie('refreshToken');

      res.json({
        success: true,
        data: {
          message: 'Account scheduled for deletion',
          deletedAt,
        },
      });
    } catch (error) {
      if (error.code === 'INVALID_PASSWORD') {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_PASSWORD', message: error.message },
        });
      }
      logger.error('Delete account error', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Account deletion failed' },
      });
    }
  }
);

export default router;
