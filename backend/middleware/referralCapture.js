import { isReferralEnabled, referralCookieName } from '../services/referralService.js';

const isValidReferralCode = (code) => /^[a-f0-9]{8,20}$/i.test(code);

const getCookieOptions = () => {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000
  };
};

export const referralCapture = (req, res, next) => {
  try {
    if (!isReferralEnabled()) {
      return next();
    }

    const ref = typeof req.query?.ref === 'string' ? req.query.ref.trim() : '';
    if (!ref || !isValidReferralCode(ref)) {
      return next();
    }

    res.cookie(referralCookieName, ref, getCookieOptions());
    if (req.session) {
      req.session.referralCode = ref;
    }
  } catch (error) {
    console.warn('⚠️ Referral capture ignoré:', error.message);
  }

  next();
};
