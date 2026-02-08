import express from 'express';
import {
  getActivePlans,
  getUserActiveSubscription,
  hasActivePremiumSubscription,
} from './subscription.service.js';
import { authenticateToken, AuthRequest } from '../auth/auth.middleware.js';

const router = express.Router();

// GET /api/subscriptions/plans
router.get('/plans', async (req, res) => {
  try {
    const plans = await getActivePlans();
    res.json(plans);
  } catch (error) {
    console.error('Get plans error:', error);
    res.status(500).json({ error: 'Failed to fetch subscription plans' });
  }
});

// GET /api/subscriptions/my-subscription
router.get('/my-subscription', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const subscription = await getUserActiveSubscription(req.user!.userId);
    if (!subscription) {
      return res.json({ subscription: null });
    }
    res.json({ subscription });
  } catch (error) {
    console.error('Get subscription error:', error);
    res.status(500).json({ error: 'Failed to fetch subscription' });
  }
});

// GET /api/subscriptions/check-premium
router.get('/check-premium', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const hasPremium = await hasActivePremiumSubscription(req.user!.userId);
    res.json({ hasPremium });
  } catch (error) {
    console.error('Check premium error:', error);
    res.status(500).json({ error: 'Failed to check premium status' });
  }
});

export default router;
