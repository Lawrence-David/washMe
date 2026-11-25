// One-time upgrade: the statuses Washing, Drying and Folding were merged into "In Progress".
// Moves existing orders over and notes the change in each order's activity log.
//
//   npm run migrate-statuses -- --dry-run   -> only shows how many orders would change
//   npm run migrate-statuses                -> applies the change (safe to run more than once)
import { env } from '../config/env';
import mongoose from 'mongoose';
import { Order, LEGACY_STATUSES } from '../models';

async function main() {
  await mongoose.connect(env.MONGODB_URI);
  const dryRun = process.argv.includes('--dry-run');
  const at = new Date();
  let total = 0;

  for (const old of LEGACY_STATUSES) {
    const count = await Order.countDocuments({ status: old });
    if (!count) continue;
    total += count;
    console.log(`${old}: ${count} order(s)${dryRun ? '' : ' -> In Progress'}`);
    if (!dryRun) {
      await Order.updateMany(
        { status: old },
        {
          $set: { status: 'In Progress' },
          $push: { history: { at, byName: 'Status update', action: 'status', from: old, to: 'In Progress' } },
        }
      );
    }
  }

  if (!total) console.log('Nothing to migrate: no orders use Washing, Drying or Folding.');
  else if (dryRun) console.log(`${total} order(s) would move to In Progress. Run without --dry-run to apply.`);
  else console.log(`Moved ${total} order(s) to In Progress.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
