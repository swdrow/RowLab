import express from 'express';
import {
  getFeed,
  toggleLike,
  getFollowStats,
  followUser,
  unfollowUser,
} from '../../services/feedService.js';
import { ApiError } from '../../middleware/rfc7807.js';

const router = express.Router();

// GET /api/u/feed — paginated social feed
router.get('/', async (req, res, next) => {
  try {
    const { filter, cursor, limit } = req.query;

    if (filter && !['all', 'following', 'me'].includes(filter)) {
      throw new ApiError(400, 'invalid-filter', 'Filter must be: all, following, or me');
    }

    const parsedLimit = limit ? parseInt(limit, 10) : 20;
    if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 50) {
      throw new ApiError(400, 'invalid-limit', 'Limit must be between 1 and 50');
    }

    const data = await getFeed(req.user.id, {
      filter: filter || 'all',
      cursor: cursor || null,
      limit: parsedLimit,
    });

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// POST /api/u/feed/:workoutId/like — toggle like
router.post('/:workoutId/like', async (req, res, next) => {
  try {
    const data = await toggleLike(req.user.id, req.params.workoutId);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// GET /api/u/feed/follow-stats — current user's follow counts
router.get('/follow-stats', async (req, res, next) => {
  try {
    const data = await getFollowStats(req.user.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// POST /api/u/feed/follow/:userId — follow a user
router.post('/follow/:userId', async (req, res, next) => {
  try {
    const data = await followUser(req.user.id, req.params.userId);
    res.json({ success: true, data });
  } catch (err) {
    if (err.code === 'P2002') {
      return res.json({ success: true, data: { following: true } }); // already following
    }
    next(err);
  }
});

// DELETE /api/u/feed/follow/:userId — unfollow a user
router.delete('/follow/:userId', async (req, res, next) => {
  try {
    const data = await unfollowUser(req.user.id, req.params.userId);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

export default router;
