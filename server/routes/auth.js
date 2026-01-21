import express from 'express';
import { body, validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';
import {
  registerUser,
  loginUser,
  switchTeam,
  getCurrentUser,
  logoutUser,
} from '../services/authService.js';
import {
  rotateRefreshToken,
  generateAccessToken,
} from '../services/tokenService.js';
import { authenticateToken } from '../middleware/auth.js';
import { prisma } from '../db/connection.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  message: {
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Too many attempts, try again later' },
  },
});

// Validation helpers
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input',
        details: errors.array(),
      },
    });
  }
  next();
};

/**
 * POST /api/v1/auth/register
 * Create new user account
 */
router.post(
  '/register',
  authLimiter,
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
  authLimiter,
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
        sameSite: 'lax',
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
          error: { code: 'ACCOUNT_SUSPENDED', message: error.message },
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
router.post('/refresh', async (req, res) => {
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
      sameSite: 'lax',
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

export default router;
