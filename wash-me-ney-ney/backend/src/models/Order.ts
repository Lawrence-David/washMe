import { Schema, model } from 'mongoose';
import { schemaOptions } from './schemaOptions';

export const STATUSES = ['Pending', 'In Progress', 'Ready', 'Completed', 'Cancelled'] as const;
// Statuses used before "In Progress" replaced them. Only the migration script uses this.
export const LEGACY_STATUSES = ['Washing', 'Drying', 'Folding'] as const;
export const PAYMENTS = ['Unpaid', 'Paid', 'Refunded'] as const;
export type Status = (typeof STATUSES)[number];
export type Payment = (typeof PAYMENTS)[number];

// One line in an order's activity log: who changed what, and when
const historyEntry = new Schema(
  {
    at: { type: Date, required: true },
    by: { type: Schema.Types.ObjectId, ref: 'User' },
    byName: { type: String, required: true }, // copied so the log survives renames
    action: { type: String, required: true }, // created | status | payment | weight | service | customer
    from: { type: String, default: '' },
    to: { type: String, default: '' },
  },
  { _id: false }
);

const orderSchema = new Schema(
  {
    code: { type: String, required: true, unique: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    serviceId: { type: Schema.Types.ObjectId, ref: 'Service', required: true },
    weight: { type: Number, required: true, min: 0.1 },
    price: { type: Number, required: true, min: 0 }, // per kg, copied from the service when ordered
    status: { type: String, enum: STATUSES, default: 'Pending' },
    payment: { type: String, enum: PAYMENTS, default: 'Unpaid' },
    date: { type: String, required: true }, // YYYY-MM-DD in the shop's time zone
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    paidAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    history: { type: [historyEntry], default: [] },
  },
  schemaOptions
);

orderSchema.index({ status: 1 });
orderSchema.index({ customerId: 1 });
orderSchema.index({ date: 1 });

export const Order = model('Order', orderSchema);
