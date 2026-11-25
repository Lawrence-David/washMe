import mongoose from 'mongoose';
import app from './app';
import { env } from './config/env';
import { connectDB } from './config/db';
import { syncOrderCounter } from './utils/orderCode';
import { User, Order, LEGACY_STATUSES } from './models';

connectDB()
  .then(async () => {
    console.log('MongoDB connected');
    await syncOrderCounter();
    if (!(await User.exists({ role: 'owner', active: true }))) {
      console.warn('No owner account yet. Create one with: npm run create-user -- --username <name> --role owner');
    }
    const legacy = await Order.countDocuments({ status: mongoose.trusted({ $in: [...LEGACY_STATUSES] }) });
    if (legacy) {
      console.warn(`${legacy} order(s) still use Washing/Drying/Folding and can't be saved until migrated. Run: npm run migrate-statuses`);
    }
    app.listen(env.PORT, () => console.log(`API running on http://localhost:${env.PORT}`));
  })
  .catch((err) => {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  });
