import express from 'express';
import { getUserStats } from '../../services/userScopedService.js';
import { ApiError } from '../../middleware/rfc7807.js';

const router = express.Router();

const VALID_RANGES = ['7d', '30d', '90d', 'all'];

router.get('/', async (req, res, next) => {
  try {
    const range = req.query.range || 'all';
    if (!VALID_RANGES.includes(range)) {
      throw new ApiError(
        400,
        'invalid-range',
        `Invalid range: ${range}. Must be one of: ${VALID_RANGES.join(', ')}`,
        'Bad Request'
      );
    }
    const data = await getUserStats(req.user.id, range);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

export default router;
