import { CookieOptions, RequestHandler } from 'express';
import { Session, User } from '../models';
import type { Role } from '../models';
import { env } from '../config/env';
import { hashToken } from '../utils/password';

export interface AuthUser {
  id: string;
  name: string;
  username: string;
  role: Role;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export const SESSION_COOKIE = 'wmnn_session';

// httpOnly: page scripts can't read it (protects against XSS token theft)
// sameSite lax: other sites can't make the browser send it on POST/PUT/DELETE (CSRF)
export const sessionCookieOptions = (): CookieOptions => ({
  httpOnly: true,
  sameSite: 'lax',
  secure: env.isProduction, // HTTPS-only in production
  path: '/',
  maxAge: env.SESSION_DAYS * 24 * 60 * 60 * 1000,
});

// Looks up the logged-in user from the session cookie. Responds 401 when there is none.
export const requireAuth: RequestHandler = async (req, res, next) => {
  const token = req.cookies?.[SESSION_COOKIE];
  if (typeof token !== 'string' || !token) {
    res.status(401).json({ error: 'Please log in' });
    return;
  }

  const session = await Session.findOne({ tokenHash: hashToken(token) });
  const user = session && session.expiresAt > new Date() ? await User.findById(session.userId) : null;
  if (!session || !user || !user.active) {
    if (session) await session.deleteOne();
    res.clearCookie(SESSION_COOKIE, { ...sessionCookieOptions(), maxAge: undefined });
    res.status(401).json({ error: 'Your session has ended. Please log in again.' });
    return;
  }

  req.user = { id: user.id, name: user.name, username: user.username, role: user.role as Role };
  next();
};

export const requireRole =
  (...roles: Role[]): RequestHandler =>
  (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Only the owner can do this' });
      return;
    }
    next();
  };

export const ownerOnly = requireRole('owner');
