import { z } from 'zod';
import { objectId } from './common';
import { STATUSES, PAYMENTS } from '../models';

const weight = z.number().finite().min(0.1).max(1000);
const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use a YYYY-MM-DD date');

// New orders always start as Pending. Customers who pay upfront can be marked Paid.
export const createOrderBody = z
  .object({
    customerId: objectId,
    serviceId: objectId,
    weight,
    payment: z.enum(['Unpaid', 'Paid']).default('Unpaid'),
  })
  .strict();

// Only send the fields that changed. The rules in utils/orderRules.ts decide what's allowed.
export const updateOrderBody = z
  .object({
    customerId: objectId,
    serviceId: objectId,
    weight,
    status: z.enum(STATUSES),
    payment: z.enum(PAYMENTS),
  })
  .partial()
  .strict()
  .refine((o) => Object.keys(o).length > 0, 'Provide at least one field to update');

export const orderListQuery = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    status: z.enum(STATUSES).optional(),
    q: z.string().trim().max(100).optional(), // matches order code, customer name or service name
    customerId: objectId.optional(),
    from: day.optional(),
    to: day.optional(),
  })
  .strict();
