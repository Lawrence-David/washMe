import { Request, Response } from 'express';
import { Customer, Order } from '../models';

// Each customer comes with orderCount, counted by the database (the frontend no longer
// has every order loaded, because the order list is paged)
export const getCustomers = async (_req: Request, res: Response) => {
  const [customers, counts] = await Promise.all([
    Customer.find().sort({ _id: 1 }),
    Order.aggregate<{ _id: unknown; n: number }>([{ $group: { _id: '$customerId', n: { $sum: 1 } } }]),
  ]);
  const byId = new Map(counts.map((c) => [String(c._id), c.n]));
  res.json(customers.map((c) => ({ ...c.toJSON(), orderCount: byId.get(c.id) ?? 0 })));
};

export const getCustomer = async (req: Request, res: Response) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) return res.status(404).json({ error: 'Not found' });
  res.json(customer);
};

export const createCustomer = async (req: Request, res: Response) => {
  const { name, phone, email } = req.body; // already validated by middleware
  res.status(201).json(await Customer.create({ name, phone, email }));
};

export const updateCustomer = async (req: Request, res: Response) => {
  const { name, phone, email } = req.body; // already validated by middleware
  const customer = await Customer.findByIdAndUpdate(
    req.params.id,
    { name, phone, email },
    { new: true, runValidators: true }
  );
  if (!customer) return res.status(404).json({ error: 'Not found' });
  res.json(customer);
};

export const deleteCustomer = async (req: Request, res: Response) => {
  if (await Order.exists({ customerId: req.params.id })) {
    return res.status(409).json({ error: 'This customer has orders, so they are kept for your records.' });
  }
  const customer = await Customer.findByIdAndDelete(req.params.id);
  if (!customer) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true });
};
