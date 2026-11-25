import { Counter, Order } from '../models';

// Makes sure the counter is at least as high as the highest existing order code
// (needed the first time this runs on a database that already has orders).
export async function syncOrderCounter() {
  const [latest] = await Order.aggregate([
    {
      $project: {
        n: {
          $convert: { input: { $arrayElemAt: [{ $split: ['$code', '-'] }, 1] }, to: 'int', onError: 0, onNull: 0 },
        },
      },
    },
    { $sort: { n: -1 } },
    { $limit: 1 },
  ]);
  const highest = Math.max(1000, latest?.n ?? 0);
  try {
    await Counter.updateOne({ _id: 'order' }, { $max: { seq: highest } }, { upsert: true });
  } catch (err: any) {
    if (err.code !== 11000) throw err; // another request created it at the same moment; fine
  }
}

let synced: Promise<void> | undefined;

// Next order code: WMNN-1001, WMNN-1002, ... Atomic, and never reuses a deleted order's code.
export async function nextOrderCode() {
  synced ??= syncOrderCounter().catch((err) => {
    synced = undefined; // try again on the next order
    throw err;
  });
  await synced;
  const counter = await Counter.findOneAndUpdate({ _id: 'order' }, { $inc: { seq: 1 } }, { new: true, upsert: true });
  return `WMNN-${counter!.seq}`;
}
