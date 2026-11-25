import { RequestHandler } from 'express';
import { ZodType } from 'zod';

// Validates req.params, req.query and/or req.body against zod schemas.
// On success the parsed (trimmed, defaulted, unknown-key-free) body replaces req.body,
// and the parsed query is put in res.locals.query (Express 5 makes req.query read-only).
export const validate =
  (schemas: { params?: ZodType; query?: ZodType; body?: ZodType }): RequestHandler =>
  (req, res, next) => {
    const errors: { field: string; message: string }[] = [];
    const collect = (where: string, result: { success: boolean; error?: any }) => {
      if (result.success) return;
      for (const issue of result.error.issues) {
        errors.push({ field: [where, ...issue.path].join('.'), message: issue.message });
      }
    };

    if (schemas.params) collect('params', schemas.params.safeParse(req.params));
    if (schemas.query) {
      const result = schemas.query.safeParse(req.query);
      collect('query', result);
      if (result.success) res.locals.query = result.data;
    }
    if (schemas.body) {
      const result = schemas.body.safeParse(req.body);
      collect('body', result);
      if (result.success) req.body = result.data;
    }

    if (errors.length) {
      res.status(400).json({ error: errors[0].message, details: errors });
      return;
    }
    next();
  };
