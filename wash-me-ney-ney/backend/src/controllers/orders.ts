import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Customer, Service, Order } from '../models';
import type { Status, Payment } from '../models';
import { nextOrderCode } from '../utils/orderCode';
import { shopDate } from '../utils/date';
import { isLocked, statusChangeError, paymentChangeError, finalStateError } from '../utils/orderRules';

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const money = (n: number) => Math.round(n * 100) / 100;

// GET /orders?page=1&limit=20&status=Ready&q=juan&from=2026-11-01&to=2026-11-30
// The history log is left out of the list to keep it light; GET /orders/:id includes it.
export const getOrders = async (_req: Request, res: Response) => {
  const { page, limit, status, q, customerId, from, to } = res.locals.query;
  // mongoose.trusted: these operators are built here, not taken from the user, so they
  // may pass through sanitizeFilter (which strips operators from user input).
  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;
  if (customerId) filter.customerId = customerId;
  if (from || to) filter.date = mongoose.trusted({ ...(from && { $gte: from }), ...(to && { $lte: to }) });
  if (q) {
    const rx = new RegExp(escapeRegex(q), 'i');
    const [customers, services] = await Promise.all([
      Customer.find({ name: mongoose.trusted({ $regex: rx }) }).select('_id'),
      Service.find({ name: mongoose.trusted({ $regex: rx }) }).select('_id'),
    ]);
    filter.$or = [
      { code: mongoose.trusted({ $regex: rx }) },
      { customerId: mongoose.trusted({ $in: customers.map((c) => c._id) }) },
      { serviceId: mongoose.trusted({ $in: services.map((s) => s._id) }) },
    ];
  }

  const [total, items] = await Promise.all([
    Order.countDocuments(filter),
    Order.find(filter)
      .sort({ _id: -1 }) // newest first
      .skip((page - 1) * limit)
      .limit(limit)
      .select('-history'),
  ]);
  res.json({ items, total, page, limit, pages: Math.max(1, Math.ceil(total / limit)) });
};

// Dashboard numbers, counted by the database instead of loading every order
export const getOrderStats = async (_req: Request, res: Response) => {
  const [row] = await Order.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        active: { $sum: { $cond: [{ $in: ['$status', ['Completed', 'Cancelled']] }, 0, 1] } },
        completed: { $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] } },
        readyUnpaid: {
          $sum: { $cond: [{ $and: [{ $eq: ['$status', 'Ready'] }, { $eq: ['$payment', 'Unpaid'] }] }, 1, 0] },
        },
        // Money actually kept: paid orders, including cancelled ones where the payment was kept.
        // Refunded orders are not counted.
        revenue: { $sum: { $cond: [{ $eq: ['$payment', 'Paid'] }, { $multiply: ['$weight', '$price'] }, 0] } },
      },
    },
  ]);
  res.json({
    total: row?.total ?? 0,
    active: row?.active ?? 0,
    completed: row?.completed ?? 0,
    readyUnpaid: row?.readyUnpaid ?? 0,
    revenue: money(row?.revenue ?? 0),
  });
};

export const getOrder = async (req: Request, res: Response) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ error: 'Not found' });
  res.json(order);
};

export const createOrder = async (req: Request, res: Response) => {
  const { customerId, serviceId, weight, payment } = req.body;
  const [customer, service] = await Promise.all([Customer.findById(customerId), Service.findById(serviceId)]);
  if (!customer || !service) return res.status(400).json({ error: 'Invalid customer or service' });

  const now = new Date();
  const who = { at: now, by: req.user!.id, byName: req.user!.name };
  const order = await Order.create({
    code: await nextOrderCode(),
    customerId,
    serviceId,
    weight,
    price: service.price, // price per kg is saved with the order
    status: 'Pending',
    payment,
    date: shopDate(now),
    createdBy: req.user!.id,
    paidAt: payment === 'Paid' ? now : null,
    history: [
      { ...who, action: 'created', to: 'Pending' },
      ...(payment === 'Paid' ? [{ ...who, action: 'payment', from: 'Unpaid', to: 'Paid' }] : []),
    ],
  });
  res.status(201).json(order);
};

export const updateOrder = async (req: Request, res: Response) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ error: 'Not found' });

  const role = req.user!.role;
  const body = req.body as Partial<{
    customerId: string;
    serviceId: string;
    weight: number;
    status: Status;
    payment: Payment;
  }>;
  const current = { status: order.status as Status, payment: order.payment as Payment };

  const customerChanged = body.customerId !== undefined && body.customerId !== String(order.customerId);
  const serviceChanged = body.serviceId !== undefined && body.serviceId !== String(order.serviceId);
  const weightChanged = body.weight !== undefined && body.weight !== order.weight;

  // 1. What was ordered can't change once it's paid or closed
  if ((customerChanged || serviceChanged || weightChanged) && isLocked(current)) {
    return res.status(400).json({
      error:
        role === 'owner'
          ? 'This order is paid or closed, so its customer, service and weight are locked. Mark it Unpaid first to correct it.'
          : 'This order is paid or closed, so its customer, service and weight are locked.',
    });
  }

  const next = { status: body.status ?? current.status, payment: body.payment ?? current.payment };

  // 2. Cancelling a paid order needs an explicit decision about the money
  if (next.status === 'Cancelled' && current.status !== 'Cancelled' && current.payment === 'Paid' && !body.payment) {
    return res.status(400).json({
      error: 'This order is paid. Choose whether to refund the customer or keep the payment.',
      code: 'PAYMENT_DECISION_REQUIRED',
    });
  }

  // 3. Status / payment rules
  const ruleError =
    statusChangeError(current.status, next.status, role) ||
    paymentChangeError(current.payment, next.payment, next.status, role) ||
    finalStateError(next);
  if (ruleError) return res.status(400).json({ error: ruleError });

  // 4. Apply the changes and log each one
  const now = new Date();
  const log = (action: string, from: string, to: string) =>
    order.history.push({ at: now, by: req.user!.id, byName: req.user!.name, action, from, to });

  if (customerChanged) {
    const [oldC, newC] = await Promise.all([Customer.findById(order.customerId), Customer.findById(body.customerId)]);
    if (!newC) return res.status(400).json({ error: 'Invalid customer' });
    order.set('customerId', body.customerId);
    log('customer', oldC?.name ?? 'Deleted customer', newC.name);
  }
  if (serviceChanged) {
    const [oldS, newS] = await Promise.all([Service.findById(order.serviceId), Service.findById(body.serviceId)]);
    if (!newS) return res.status(400).json({ error: 'Invalid service' });
    log('service', `${oldS?.name ?? 'Deleted service'} @ ${order.price}/kg`, `${newS.name} @ ${newS.price}/kg`);
    order.set('serviceId', body.serviceId);
    order.price = newS.price; // re-price only when the service changes
  }
  if (weightChanged) {
    log('weight', `${order.weight} kg`, `${body.weight} kg`);
    order.weight = body.weight!;
  }
  if (next.status !== current.status) {
    log('status', current.status, next.status);
    order.status = next.status;
    order.completedAt = next.status === 'Completed' ? now : null;
  }
  if (next.payment !== current.payment) {
    log('payment', current.payment, next.payment);
    order.payment = next.payment;
    if (next.payment === 'Paid') order.paidAt = now;
    if (next.payment === 'Unpaid') order.paidAt = null;
  }

  if (order.isModified()) await order.save();
  res.json(order);
};

// Owner only (see routes). Paid orders are kept for the records: cancel them instead.
export const deleteOrder = async (req: Request, res: Response) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ error: 'Not found' });
  if (order.payment === 'Paid') {
    return res.status(409).json({
      error: "Paid orders can't be deleted. Cancel the order and choose to refund or keep the payment instead.",
    });
  }
  await order.deleteOne();
  res.json({ success: true });
};
