import { env } from '../config/env';

const shopDay = new Intl.DateTimeFormat('en-CA', {
  timeZone: env.APP_TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

// Today's date (YYYY-MM-DD) in the shop's time zone, whatever zone the server runs in.
// Example: 2 AM in Manila is still "yesterday" on a UTC server; this returns the Manila date.
export const shopDate = (d = new Date()) => shopDay.format(d);
