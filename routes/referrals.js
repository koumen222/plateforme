import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  buildAccessFlags,
  ensureReferralCodeForUser,
  getReferralStatsForUser,
  isReferralEnabled
} from '../services/referralService.js';

const router = express.Router();

router.get('/referrals/me', authenticate, async (req, res) => {
  try {
    if (!isReferralEnabled()) {
      return res.json({ enabled: false });
    }

    const referralCode = await ensureReferralCodeForUser(req.user._id);
    const stats = await getReferralStatsForUser(req.user._id);
    const access = buildAccessFlags(req.user);
    const frontendUrl = process.env.FRONTEND_URL || 'https://safitech.shop';
    const referralLink = referralCode ? `${frontendUrl}/?ref=${referralCode}` : null;

    res.json({
      enabled: true,
      referralCode,
      referralLink,
      pendingCount: stats?.pendingCount || 0,
      validatedCount: stats?.validatedCount || 0,
      status: access.hasReferralAccess ? 'unlocked' : 'locked'
    });
  } catch (error) {
    console.error('❌ Erreur stats parrainage:', error);
    res.status(500).json({ enabled: true, error: 'Impossible de récupérer les données de parrainage' });
  }
});

export default router;
