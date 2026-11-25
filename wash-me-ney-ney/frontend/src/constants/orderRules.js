import { STATUSES } from './index.js';

// Copy of the backend rules (backend/src/utils/orderRules.ts), used to show only valid
// choices. The backend still checks everything. Keep both files in sync.

export const FLOW = ['Pending', 'In Progress', 'Ready', 'Completed'];

export const isClosed = (status) => status === 'Completed' || status === 'Cancelled';

// Paid or closed orders can't change customer, service or weight
export const isLocked = (order) => order.payment !== 'Unpaid' || isClosed(order.status);

// Statuses the user may pick for an order that is currently `status`
export function statusOptions(status, role) {
  if (role === 'owner') return STATUSES; // owner can correct or reopen
  if (isClosed(status)) return [status];
  return [...FLOW.slice(FLOW.indexOf(status)), 'Cancelled']; // forward only
}

// Payment values the user may pick, given the current payment and the status being saved
export function paymentOptions(payment, nextStatus, role) {
  const allowed = new Set([payment]);
  if (payment === 'Unpaid') allowed.add('Paid');
  if (payment === 'Paid') {
    if (role === 'owner') allowed.add('Unpaid');
    if (nextStatus === 'Cancelled') allowed.add('Refunded');
  }
  if (payment === 'Refunded' && role === 'owner') {
    allowed.add('Paid');
    allowed.add('Unpaid');
  }
  return ['Unpaid', 'Paid', 'Refunded'].filter((p) => allowed.has(p));
}

export function finalStateError({ status, payment }) {
  if (status === 'Completed' && payment !== 'Paid') return 'Mark the order as paid before completing it.';
  if (payment === 'Refunded' && status !== 'Cancelled') return 'A refunded order must stay cancelled.';
  return null;
}
