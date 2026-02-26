import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { prisma } from '../../db/connection.js';
import { ApiError } from '../../middleware/rfc7807.js';
import { getUserTrends } from '../../services/userScopedService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// ============================================
// Image Upload Configuration
// ============================================

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

function createImageStorage(subdir) {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(__dirname, '../../../uploads', subdir);
      fs.mkdirSync(uploadDir, { recursive: true });
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname) || '.jpg';
      cb(null, `${req.user.id}-${Date.now()}${ext}`);
    },
  });
}

const avatarUpload = multer({
  storage: createImageStorage('avatars'),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (ACCEPTED_IMAGE_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (jpeg, png, webp, gif) are allowed'), false);
    }
  },
});

const bannerUpload = multer({
  storage: createImageStorage('banners'),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (ACCEPTED_IMAGE_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (jpeg, png, webp, gif) are allowed'), false);
    }
  },
});

/**
 * Delete a previously uploaded file (best effort, ignore missing).
 * @param {string|null} urlPath - Relative URL like /uploads/avatars/xyz.jpg
 */
function deleteOldUpload(urlPath) {
  if (!urlPath) return;
  const filePath = path.join(__dirname, '../../..', urlPath);
  fs.unlink(filePath, () => {}); // ignore errors
}

// ============================================
// POST /api/u/profile/avatar
// ============================================

router.post('/avatar', avatarUpload.single('avatar'), async (req, res, next) => {
  try {
    if (!req.file) {
      throw new ApiError(400, 'no-file', 'No avatar file uploaded');
    }

    // Delete previous avatar
    const currentUser = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { avatarUrl: true },
    });
    deleteOldUpload(currentUser?.avatarUrl);

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { avatarUrl },
      select: {
        id: true,
        name: true,
        email: true,
        bio: true,
        avatarUrl: true,
        bannerUrl: true,
        createdAt: true,
      },
    });

    res.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        bio: user.bio || null,
        avatarUrl: user.avatarUrl || null,
        bannerUrl: user.bannerUrl || null,
        createdAt: user.createdAt.toISOString(),
      },
    });
  } catch (err) {
    next(err);
  }
});

// ============================================
// POST /api/u/profile/banner
// ============================================

router.post('/banner', bannerUpload.single('banner'), async (req, res, next) => {
  try {
    if (!req.file) {
      throw new ApiError(400, 'no-file', 'No banner file uploaded');
    }

    // Delete previous banner
    const currentUser = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { bannerUrl: true },
    });
    deleteOldUpload(currentUser?.bannerUrl);

    const bannerUrl = `/uploads/banners/${req.file.filename}`;
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { bannerUrl },
      select: {
        id: true,
        name: true,
        email: true,
        bio: true,
        avatarUrl: true,
        bannerUrl: true,
        createdAt: true,
      },
    });

    res.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        bio: user.bio || null,
        avatarUrl: user.avatarUrl || null,
        bannerUrl: user.bannerUrl || null,
        createdAt: user.createdAt.toISOString(),
      },
    });
  } catch (err) {
    next(err);
  }
});

// ============================================
// GET /api/u/profile/trends
// ============================================

const VALID_TREND_RANGES = ['7d', '30d', '90d', '1y', 'all'];

router.get('/trends', async (req, res, next) => {
  try {
    const range = req.query.range || '90d';
    if (!VALID_TREND_RANGES.includes(range)) {
      throw new ApiError(
        400,
        'invalid-range',
        `Invalid range: ${range}. Must be one of: ${VALID_TREND_RANGES.join(', ')}`
      );
    }
    const data = await getUserTrends(req.user.id, range);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

export default router;
