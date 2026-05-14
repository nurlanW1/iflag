import express from 'express';
import { getActivePlans } from './subscription.service.js';
import {
  getUserActiveSubscription,
  hasActivePremium,
} from '../billing/subscriptions.service.js';
import { authenticateToken, AuthRequest } from '../auth/auth.middleware.js';

const router = express.Router();

// GET /api/subscriptions/plans — public list of active subscription plans.
router.get('/plans', async (_req, res) => {
  try {
    const plans = await getActivePlans();
    res.json(plans);
  } catch (error) {
    console.error('Get plans error:', error);
    res.status(500).json({ error: 'Failed to fetch subscription plans' });
  }
});

// GET /api/subscriptions/my-subscription — current user's active subscription.
router.get('/my-subscription', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const subscription = await getUserActiveSubscription(req.user!.userId);
    res.json({ subscription: subscription ?? null });
  } catch (error) {
    console.error('Get subscription error:', error);
    res.status(500).json({ error: 'Failed to fetch subscription' });
  }
});

// GET /api/subscriptions/check-premium — boolean check used by frontend gates.
router.get('/check-premium', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const hasPremium = await hasActivePremium(req.user!.userId);
    res.json({ hasPremium });
  } catch (error) {
    console.error('Check premium error:', error);
    res.status(500).json({ error: 'Failed to check premium status' });
  }
});

export default router;
