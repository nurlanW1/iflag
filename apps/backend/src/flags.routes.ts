import express from 'express';
import { getAllFlags, getFlagById } from './flags.model.js';

const router = express.Router();

// GET /api/flags
router.get('/', async (req, res) => {
  try {
    const flags = await getAllFlags();
    res.json(flags);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch flags' });
  }
});

// GET /api/flags/:id
router.get('/:id', async (req, res) => {
  try {
    const flag = await getFlagById(req.params.id);
    if (!flag) return res.status(404).json({ error: 'Flag not found' });
    res.json(flag);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch flag' });
  }
});

export default router;
