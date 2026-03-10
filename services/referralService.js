import crypto from 'crypto';
import User from '../models/User.js';
import Referral from '../models/Referral.js';

const REFERRAL_COOKIE_NAME = 'safitech_ref';
const REFERRAL_SYSTEM_ENABLED = process.env.REFERRAL_SYSTEM_ENABLED !== 'false';

const createReferralCode = () => crypto.randomBytes(5).toString('hex');

const isReferralCodeValid = (code) => {
  if (!code) return false;
  return /^[a-f0-9]{8,20}$/i.test(code);
};

const getClientIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.connection?.remoteAddress || null;
};

export const isReferralEnabled = () => REFERRAL_SYSTEM_ENABLED;

export const getReferralCodeFromRequest = (req) => {
  const queryCode = typeof req.query?.ref === 'string' ? req.query.ref.trim() : '';
  const headerCode = typeof req.headers?.['x-referral-code'] === 'string'
    ? req.headers['x-referral-code'].trim()
    : '';
  const cookieCode = typeof req.cookies?.[REFERRAL_COOKIE_NAME] === 'string'
    ? req.cookies[REFERRAL_COOKIE_NAME].trim()
    : '';
  const sessionCode = typeof req.session?.referralCode === 'string'
    ? req.session.referralCode.trim()
    : '';

  const code = queryCode || headerCode || cookieCode || sessionCode;
  return isReferralCodeValid(code) ? code : null;
};

export const ensureReferralCodeForUser = async (userOrId) => {
  if (!isReferralEnabled()) return null;
  const userId = typeof userOrId === 'string' ? userOrId : userOrId?._id?.toString();
  if (!userId) return null;

  const existing = await User.findById(userId).select('referralCode').lean();
  if (existing?.referralCode) return existing.referralCode;

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const referralCode = createReferralCode();
    try {
      const updated = await User.findOneAndUpdate(
        { _id: userId, referralCode: { $exists: false } },
        { $set: { referralCode } },
        { new: true }
      ).select('referralCode');
      if (updated?.referralCode) return updated.referralCode;
    } catch (error) {
      if (error?.code !== 11000) {
        console.error('⚠️ Erreur création referralCode:', error.message);
      }
    }
  }

  return null;
};

export const createReferralFromRequest = async ({ userId, req }) => {
  if (!isReferralEnabled()) return null;
  if (!userId || !req) return null;

  const referralCode = getReferralCodeFromRequest(req);
  if (!referralCode) return null;

  const referredId = userId.toString();

  const referrer = await User.findOne({ referralCode }).select('_id referralCode').lean();
  if (!referrer?._id) return null;

  if (referrer._id.toString() === referredId) {
    return null;
  }

  const existingReferral = await Referral.findOne({ referredId }).lean();
  if (existingReferral) return null;

  const ipAddress = getClientIp(req);
  if (ipAddress) {
    const recentReferral = await Referral.findOne({
      referrerId: referrer._id,
      ipAddress
    }).sort({ createdAt: -1 }).lean();
    if (recentReferral) return null;
  }

  const userAgent = req.headers['user-agent'] || null;

  const referral = await Referral.create({
    referrerId: referrer._id,
    referredId,
    status: 'pending',
    ipAddress,
    userAgent
  });

  // Débloquer immédiatement l'accès du parrain, même si le filleul est encore pending
  await User.updateOne(
    {
      _id: referrer._id,
      status: { $ne: 'blocked' },
      accountStatus: { $ne: 'blocked' }
    },
    {
      $set: {
        referralAccessUnlocked: true,
        referralUnlockedAt: new Date(),
        status: 'active',
        accountStatus: 'active'
      }
    }
  );

  return referral;
};

export const maybeValidateReferralForUser = async (userOrId) => {
  if (!isReferralEnabled()) return false;

  const userId = typeof userOrId === 'string' ? userOrId : userOrId?._id?.toString();
  if (!userId) return false;

  const user = await User.findById(userId).select('emailVerified status accountStatus').lean();
  if (!user) return false;

  const isVerified = Boolean(user.emailVerified);
  const isActive = user.status === 'active' || user.accountStatus === 'active';
  if (!isVerified && !isActive) return false;

  const referral = await Referral.findOne({ referredId: userId, status: 'pending' });
  if (!referral) return false;

  referral.status = 'validated';
  referral.validatedAt = new Date();
  await referral.save();

  await User.updateOne(
    { _id: referral.referrerId, referralAccessUnlocked: { $ne: true } },
    { $set: { referralAccessUnlocked: true, referralUnlockedAt: new Date() } }
  );

  return true;
};

export const getReferralStatsForUser = async (userOrId) => {
  const userId = typeof userOrId === 'string' ? userOrId : userOrId?._id?.toString();
  if (!userId) return null;

  const [pendingCount, validatedCount] = await Promise.all([
    Referral.countDocuments({ referrerId: userId, status: 'pending' }),
    Referral.countDocuments({ referrerId: userId, status: 'validated' })
  ]);

  return { pendingCount, validatedCount };
};

export const buildAccessFlags = (user) => {
  const hasActiveStatus = user?.status === 'active';
  const hasReferralAccess = Boolean(user?.referralAccessUnlocked);
  return {
    hasReferralAccess,
    hasAccess: hasActiveStatus || hasReferralAccess
  };
};

export const referralCookieName = REFERRAL_COOKIE_NAME;
