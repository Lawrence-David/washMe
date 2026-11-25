import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Session, User } from '../models';
import { env } from '../config/env';
import { SESSION_COOKIE, sessionCookieOptions } from '../middleware/auth';
import { fakeVerify, hashPassword, hashToken, newSessionToken, verifyPassword } from '../utils/password';

const WRONG_LOGIN = 'Wrong username or password';

export const login = async (req: Request, res: Response) => {
  const { username, password } = req.body; // validated + lowercased by middleware
  const user = await User.findOne({ username });

  const ok = user ? await verifyPassword(password, user.passwordHash) : await fakeVerify(password);
  if (!user || !ok) return res.status(401).json({ error: WRONG_LOGIN });
  if (!user.active) return res.status(403).json({ error: 'This account is turned off. Ask the owner.' });

  const token = newSessionToken();
  await Session.create({
    tokenHash: hashToken(token),
    userId: user._id,
    expiresAt: new Date(Date.now() + env.SESSION_DAYS * 24 * 60 * 60 * 1000),
  });
  res.cookie(SESSION_COOKIE, token, sessionCookieOptions());
  res.json(user);
};

export const logout = async (req: Request, res: Response) => {
  const token = req.cookies?.[SESSION_COOKIE];
  if (typeof token === 'string' && token) await Session.deleteOne({ tokenHash: hashToken(token) });
  res.clearCookie(SESSION_COOKIE, { ...sessionCookieOptions(), maxAge: undefined });
  res.json({ success: true });
};

export const me = async (req: Request, res: Response) => {
  res.json(req.user);
};

export const changePassword = async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user!.id);
  if (!user || !(await verifyPassword(currentPassword, user.passwordHash))) {
    return res.status(400).json({ error: 'Your current password is wrong' });
  }
  user.passwordHash = await hashPassword(newPassword);
  await user.save();

  // Log out every other browser that was using the old password
  const current = hashToken(req.cookies[SESSION_COOKIE]);
  // mongoose.trusted: sanitizeFilter would otherwise neutralise the $ne operator
  await Session.deleteMany({ userId: user._id, tokenHash: mongoose.trusted({ $ne: current }) });
  res.json({ success: true });
};
