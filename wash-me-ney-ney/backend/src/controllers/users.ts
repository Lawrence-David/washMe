import { Request, Response } from 'express';
import { Session, User } from '../models';
import { hashPassword } from '../utils/password';

// Staff accounts are managed by the owner only (routes are owner-protected).

export const getUsers = async (_req: Request, res: Response) => {
  res.json(await User.find().sort({ _id: 1 }));
};

export const createUser = async (req: Request, res: Response) => {
  const { name, username, password, role } = req.body;
  if (await User.exists({ username })) return res.status(409).json({ error: 'That username is already taken' });
  const user = await User.create({ name, username, role, passwordHash: await hashPassword(password) });
  res.status(201).json(user);
};

export const updateUser = async (req: Request, res: Response) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ error: 'Not found' });

  const { name, role, active, password } = req.body;
  const isSelf = user.id === req.user!.id;
  // Stops the owner from locking themselves (and possibly the whole shop) out
  if (isSelf && role !== undefined && role !== user.role) {
    return res.status(400).json({ error: "You can't change your own role" });
  }
  if (isSelf && active === false) return res.status(400).json({ error: "You can't turn off your own account" });

  if (name !== undefined) user.name = name;
  if (role !== undefined) user.role = role;
  if (active !== undefined) user.active = active;
  if (password !== undefined) user.passwordHash = await hashPassword(password);
  await user.save();

  // A turned-off account or a reset password logs that person out everywhere
  if (active === false || (password !== undefined && !isSelf)) await Session.deleteMany({ userId: user._id });
  res.json(user);
};
