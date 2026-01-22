import dotenv from 'dotenv';
import { connectDB } from '../config/database.js';
import User from '../models/User.js';
import { ensureReferralCodeForUser } from '../services/referralService.js';

dotenv.config();

const run = async () => {
  await connectDB();

  const users = await User.find({ referralCode: { $exists: false } }).select('_id');
  console.log(`🔁 Backfill referralCode: ${users.length} utilisateurs`);

  let updated = 0;
  for (const user of users) {
    const code = await ensureReferralCodeForUser(user._id);
    if (code) updated += 1;
  }

  console.log(`✅ Codes générés: ${updated}`);
  process.exit(0);
};

run().catch((error) => {
  console.error('❌ Erreur backfill referralCode:', error);
  process.exit(1);
});
