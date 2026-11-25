import express from 'express';
import cookieParser from 'cookie-parser';
import routes from './routes';
import authRoutes from './routes/auth';
import { env } from './config/env';
import { securityHeaders, corsPolicy, ipLimiter, apiLimiter, writeLimiter } from './middleware/security';
import { requireAuth } from './middleware/auth';
import { notFound, errorHandler } from './middleware/errorHandler';

const app = express();

if (env.TRUST_PROXY) app.set('trust proxy', env.TRUST_PROXY);

app.use(securityHeaders);
app.use(corsPolicy);
app.use(cookieParser());
app.use(express.json({ limit: '10kb' }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api', ipLimiter);
app.use('/api/auth', authRoutes); // login / logout / me
app.use('/api', requireAuth, apiLimiter, writeLimiter, routes); // everything else needs a login

app.use(notFound);
app.use(errorHandler);

export default app;
