import { z } from 'zod';
import { text } from './common';
import { ROLES } from '../models';

export const username = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, 'Username must be at least 3 characters')
  .max(40)
  .regex(/^[a-z0-9._-]+$/, 'Username may only use letters, numbers, dots, dashes and underscores');

export const password = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(200, 'Password is too long');

export const loginBody = z
  .object({
    username: z.string().trim().toLowerCase().min(1, 'Enter your username').max(40),
    password: z.string().min(1, 'Enter your password').max(200),
  })
  .strict();

export const changePasswordBody = z
  .object({
    currentPassword: z.string().min(1, 'Enter your current password').max(200),
    newPassword: password,
  })
  .strict();

export const createUserBody = z
  .object({
    name: text(100).min(1, 'Name is required'),
    username,
    password,
    role: z.enum(ROLES).default('staff'),
  })
  .strict();

export const updateUserBody = z
  .object({
    name: text(100).min(1, 'Name is required'),
    role: z.enum(ROLES),
    active: z.boolean(),
    password, // owner resets a forgotten password
  })
  .partial()
  .strict()
  .refine((o) => Object.keys(o).length > 0, 'Provide at least one field to update');
