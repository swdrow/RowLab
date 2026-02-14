import express from 'express';
import { getUserPRs } from '../../services/userScopedService.js';

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const data = await getUserPRs(req.user.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

export default router;
