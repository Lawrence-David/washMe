import type { Role, Status, Payment } from '../models';

// The business rules for moving an order along. The frontend keeps a copy of these in
// frontend/src/constants/orderRules.js so it can show only valid choices. Keep both in sync.

// The normal path of an order. Steps may be skipped (e.g. a quick job going straight from
// Pending to Ready), but staff can never move an order backwards.
export const FLOW: Status[] = ['Pending', 'In Progress', 'Ready', 'Completed'];

export const isClosed = (status: Status) => status === 'Completed' || status === 'Cancelled';

// Once money changed hands or the order is closed, what was ordered can't be edited
export const isLocked = (o: { status: Status; payment: Payment }) => o.payment !== 'Unpaid' || isClosed(o.status);

export function statusChangeError(from: Status, to: Status, role: Role): string | null {
  if (from === to || role === 'owner') return null; // the owner may correct or reopen anything
  if (isClosed(from)) return 'Completed and cancelled orders can only be reopened by the owner.';
  if (to === 'Cancelled') return null;
  if (FLOW.indexOf(to) < FLOW.indexOf(from)) return 'Orders can only move forward. Ask the owner to move one back.';
  return null;
}

export function paymentChangeError(from: Payment, to: Payment, nextStatus: Status, role: Role): string | null {
  if (from === to) return null;
  if (to === 'Refunded') {
    if (from !== 'Paid') return 'Only paid orders can be refunded.';
    if (nextStatus !== 'Cancelled') return 'Cancel the order to refund it.';
    return null;
  }
  if (from === 'Refunded') return role === 'owner' ? null : 'Only the owner can change a refunded order.';
  if (from === 'Paid' && to === 'Unpaid') return role === 'owner' ? null : 'Only the owner can mark a paid order as unpaid.';
  return null;
}

// Checks the order as it would look after the change
export function finalStateError(next: { status: Status; payment: Payment }): string | null {
  if (next.status === 'Completed' && next.payment !== 'Paid') return 'Mark the order as paid before completing it.';
  if (next.payment === 'Refunded' && next.status !== 'Cancelled') return 'A refunded order must stay cancelled.';
  return null;
}
