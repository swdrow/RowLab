import express from 'express';
import { getDashboard } from '../../services/userScopedService.js';

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const data = await getDashboard(req.user.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

export default router;
