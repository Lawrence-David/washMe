import 'dotenv/config';
import { z } from 'zod';

const isTimeZone = (tz: string) => {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
};

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  MONGODB_URI: z.string().min(1).default('mongodb://127.0.0.1:27017/wash-me-ney-ney'),
  // Comma-separated list of browser origins allowed to call the API
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  // Shop time zone: order dates are stamped in this zone, not in the server's own zone
  APP_TIMEZONE: z.string().default('Asia/Manila').refine(isTimeZone, 'Unknown time zone'),
  // How many days a login stays valid
  SESSION_DAYS: z.coerce.number().int().min(1).max(90).default(7),
  // Number of reverse proxies in front of the API (0 when none). Needed so rate limits see real client IPs.
  TRUST_PROXY: z.coerce.number().int().min(0).max(10).default(0),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment configuration:');
  for (const issue of parsed.error.issues) console.error(`  ${issue.path.join('.')}: ${issue.message}`);
  process.exit(1);
}

export const env = {
  ...parsed.data,
  isProduction: parsed.data.NODE_ENV === 'production',
  corsOrigins: parsed.data.CORS_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean),
};
