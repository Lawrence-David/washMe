// Adds sample data for development: an owner + a staff login (from SEED_* in .env),
// 5 customers, 5 services and 5 orders.
//   npm run seed            -> sample data only if the database is empty
//   npm run seed -- --reset -> deletes existing customers/services/orders first (logins are kept)
import { env } from '../config/env';
import mongoose from 'mongoose';
import { Customer, Service, Order, User, Counter } from '../models';
import { hashPassword } from '../utils/password';
import { createUserBody } from '../validators/user';

async function seedUser(prefix: 'OWNER' | 'STAFF', role: 'owner' | 'staff') {
  const username = process.env[`SEED_${prefix}_USERNAME`];
  const password = process.env[`SEED_${prefix}_PASSWORD`];
  if (!username || !password) return null;

  const parsed = createUserBody.safeParse({
    username,
    password,
    role,
    name: process.env[`SEED_${prefix}_NAME`] || username,
  });
  if (!parsed.success) {
    console.warn(`Skipping SEED_${prefix}_*: ${parsed.error.issues[0].message}`);
    return null;
  }
  const existing = await User.findOne({ username: parsed.data.username });
  if (existing) return existing;
  const user = await User.create({ ...parsed.data, passwordHash: await hashPassword(parsed.data.password) });
  console.log(`Created ${role} login "${user.username}".`);
  return user;
}

async function seed() {
  await mongoose.connect(env.MONGODB_URI);

  if (env.isProduction) {
    console.log('Not seeding a production database. Use "npm run create-user" to add the owner account.');
    return;
  }

  const owner = await seedUser('OWNER', 'owner');
  await seedUser('STAFF', 'staff');
  if (!owner && !(await User.exists({ role: 'owner' }))) {
    console.log('No owner login yet: set SEED_OWNER_USERNAME / SEED_OWNER_PASSWORD in .env, or run "npm run create-user".');
  }

  if (process.argv.includes('--reset')) {
    await Promise.all([
      Customer.deleteMany({}),
      Service.deleteMany({}),
      Order.deleteMany({}),
      Counter.deleteMany({ _id: 'order' }),
    ]);
  } else if ((await Customer.countDocuments()) + (await Service.countDocuments()) + (await Order.countDocuments()) > 0) {
    console.log('Database already has data. Use "npm run seed -- --reset" to replace it.');
    return;
  }

  const customers = await Customer.insertMany([
    { name: 'Juan Dela Cruz', phone: '0917 123 4567', email: 'juan@example.com' },
    { name: 'Maria Santos', phone: '0918 234 5678', email: 'maria@example.com' },
    { name: 'Alex Reyes', phone: '0919 345 6789', email: 'alex@example.com' },
    { name: 'Angela Bautista', phone: '0920 456 7890', email: 'angela@example.com' },
    { name: 'Mark Villanueva', phone: '0921 567 8901', email: 'mark@example.com' },
  ]);

  const services = await Service.insertMany([
    { name: 'Wash & Fold', price: 60, detail: 'Everyday cleaning + fresh folding' },
    { name: 'Wash Only', price: 40, detail: 'Gentle washing for your clothes' },
    { name: 'Dry Only', price: 30, detail: 'Quick tumble drying' },
    { name: 'Premium Care', price: 95, detail: 'Special care for delicate garments' },
    { name: 'Bedding & Comforters', price: 120, detail: 'Deep wash for bulky items' },
  ]);

  // [customer index, service index, weight, status, payment, date]
  const rows: [number, number, number, string, string, string][] = [
    [0, 0, 5, 'In Progress', 'Unpaid', '2026-11-10'],
    [1, 3, 3, 'Ready', 'Paid', '2026-11-11'],
    [2, 1, 4, 'Pending', 'Unpaid', '2026-11-12'],
    [3, 4, 6, 'In Progress', 'Unpaid', '2026-11-13'],
    [4, 2, 2, 'Completed', 'Paid', '2026-11-14'],
  ];

  const byName = 'Sample data';
  await Order.insertMany(
    rows.map(([c, s, weight, status, payment, date], i) => {
      const at = new Date(`${date}T09:00:00+08:00`);
      return {
        code: `WMNN-${1001 + i}`,
        customerId: customers[c]._id,
        serviceId: services[s]._id,
        weight,
        price: services[s].price,
        status,
        payment,
        date,
        createdBy: owner?._id,
        paidAt: payment === 'Paid' ? at : null,
        completedAt: status === 'Completed' ? at : null,
        history: [
          { at, byName, action: 'created', to: 'Pending' },
          ...(status !== 'Pending' ? [{ at, byName, action: 'status', from: 'Pending', to: status }] : []),
          ...(payment === 'Paid' ? [{ at, byName, action: 'payment', from: 'Unpaid', to: 'Paid' }] : []),
        ],
      };
    })
  );
  await Counter.updateOne({ _id: 'order' }, { $set: { seq: 1000 + rows.length } }, { upsert: true });

  console.log('Seeded 5 customers, 5 services and 5 orders.');
}

seed()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
