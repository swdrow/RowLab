import express from 'express';
import { prisma } from '../../db/connection.js';
import { ApiError } from '../../middleware/rfc7807.js';

const router = express.Router();

// ============================================
// GET /api/u/profile
// ============================================

router.get('/', async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        memberships: {
          include: {
            team: { select: { id: true, name: true } },
          },
        },
        concept2Auth: {
          select: {
            username: true,
            lastSyncedAt: true,
            syncEnabled: true,
          },
        },
        stravaAuth: {
          select: {
            username: true,
            lastSyncedAt: true,
            syncEnabled: true,
          },
        },
      },
    });

    if (!user) {
      throw new ApiError(404, 'not-found', 'User not found');
    }

    const teams = user.memberships.map((m) => ({
      teamId: m.team.id,
      teamName: m.team.name,
      role: m.role.toLowerCase(),
    }));

    const integrations = {
      concept2: user.concept2Auth
        ? {
            connected: true,
            username: user.concept2Auth.username,
            lastSyncedAt: user.concept2Auth.lastSyncedAt
              ? user.concept2Auth.lastSyncedAt.toISOString()
              : null,
            syncEnabled: user.concept2Auth.syncEnabled,
          }
        : { connected: false },
      strava: user.stravaAuth
        ? {
            connected: true,
            username: user.stravaAuth.username,
            lastSyncedAt: user.stravaAuth.lastSyncedAt
              ? user.stravaAuth.lastSyncedAt.toISOString()
              : null,
            syncEnabled: user.stravaAuth.syncEnabled,
          }
        : { connected: false },
    };

    res.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        bio: user.bio || null,
        avatarUrl: user.avatarUrl || null,
        bannerUrl: user.bannerUrl || null,
        teams,
        integrations,
        createdAt: user.createdAt.toISOString(),
      },
    });
  } catch (err) {
    next(err);
  }
});

// ============================================
// PATCH /api/u/profile
// ============================================

const NAME_MAX_LEN = 100;
const BIO_MAX_LEN = 500;

router.patch('/', async (req, res, next) => {
  try {
    const { name, bio } = req.body;
    const updateData = {};

    if (name !== undefined) {
      if (
        typeof name !== 'string' ||
        name.trim().length === 0 ||
        name.trim().length > NAME_MAX_LEN
      ) {
        throw new ApiError(
          400,
          'invalid-name',
          `Name must be between 1 and ${NAME_MAX_LEN} characters`
        );
      }
      updateData.name = name.trim();
    }

    if (bio !== undefined) {
      if (bio !== null && (typeof bio !== 'string' || bio.length > BIO_MAX_LEN)) {
        throw new ApiError(400, 'invalid-bio', `Bio must be at most ${BIO_MAX_LEN} characters`);
      }
      updateData.bio = bio === null ? null : bio;
    }

    if (Object.keys(updateData).length === 0) {
      throw new ApiError(400, 'no-fields', 'No valid fields to update');
    }

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
      include: {
        memberships: {
          include: {
            team: { select: { id: true, name: true } },
          },
        },
        concept2Auth: {
          select: {
            username: true,
            lastSyncedAt: true,
            syncEnabled: true,
          },
        },
        stravaAuth: {
          select: {
            username: true,
            lastSyncedAt: true,
            syncEnabled: true,
          },
        },
      },
    });

    const teams = user.memberships.map((m) => ({
      teamId: m.team.id,
      teamName: m.team.name,
      role: m.role.toLowerCase(),
    }));

    const integrations = {
      concept2: user.concept2Auth
        ? {
            connected: true,
            username: user.concept2Auth.username,
            lastSyncedAt: user.concept2Auth.lastSyncedAt
              ? user.concept2Auth.lastSyncedAt.toISOString()
              : null,
            syncEnabled: user.concept2Auth.syncEnabled,
          }
        : { connected: false },
      strava: user.stravaAuth
        ? {
            connected: true,
            username: user.stravaAuth.username,
            lastSyncedAt: user.stravaAuth.lastSyncedAt
              ? user.stravaAuth.lastSyncedAt.toISOString()
              : null,
            syncEnabled: user.stravaAuth.syncEnabled,
          }
        : { connected: false },
    };

    res.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        bio: user.bio || null,
        avatarUrl: user.avatarUrl || null,
        bannerUrl: user.bannerUrl || null,
        teams,
        integrations,
        createdAt: user.createdAt.toISOString(),
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
