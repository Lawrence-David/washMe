import cors from 'cors';
import helmet from 'helmet';
import { Request } from 'express';
import { rateLimit, ipKeyGenerator } from 'express-rate-limit';
import { env } from '../config/env';

export const securityHeaders = helmet();

export const corsPolicy = cors({
  origin: (origin, cb) => {
    // No Origin header = non-browser client (curl, server-to-server); allowed
    if (!origin || env.corsOrigins.includes(origin)) return cb(null, true);
    cb(new Error('Origin not allowed by CORS'));
  },
  credentials: true, // let the browser send the login cookie
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type'],
  maxAge: 600,
});

const WINDOW = 15 * 60 * 1000;
const limiterOptions = { standardHeaders: 'draft-7' as const, legacyHeaders: false, windowMs: WINDOW };

// Logged-in requests are counted per user, so staff sharing the shop's Wi-Fi (one IP)
// don't use up each other's limit. Anonymous requests fall back to the IP address.
const userOrIp = (req: Request) => (req.user ? `user:${req.user.id}` : ipKeyGenerator(req.ip ?? ''));

// Coarse per-IP cap in front of everything (runs before the session lookup)
export const ipLimiter = rateLimit({
  ...limiterOptions,
  limit: 2000,
  message: { error: 'Too many requests, please try again later' },
});

// Failed login attempts per IP; successful logins don't count
export const loginLimiter = rateLimit({
  ...limiterOptions,
  limit: 10,
  skipSuccessfulRequests: true,
  message: { error: 'Too many failed logins. Please wait 15 minutes and try again.' },
});

export const apiLimiter = rateLimit({
  ...limiterOptions,
  limit: 600,
  keyGenerator: userOrIp,
  message: { error: 'Too many requests, please try again later' },
});

// Stricter limit for requests that change data
export const writeLimiter = rateLimit({
  ...limiterOptions,
  limit: 200,
  keyGenerator: userOrIp,
  skip: (req) => req.method === 'GET' || req.method === 'OPTIONS',
  message: { error: 'Too many changes, please slow down' },
});
