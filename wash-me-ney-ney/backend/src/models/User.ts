import { Schema, model } from 'mongoose';

export const ROLES = ['owner', 'staff'] as const;
export type Role = (typeof ROLES)[number];

export const User = model(
  'User',
  new Schema(
    {
      name: { type: String, required: true, trim: true, maxlength: 100 },
      username: { type: String, required: true, unique: true, trim: true, lowercase: true, maxlength: 40 },
      passwordHash: { type: String, required: true },
      role: { type: String, enum: ROLES, default: 'staff' },
      // Users are deactivated, never deleted, so order history keeps pointing at a real person
      active: { type: Boolean, default: true },
    },
    {
      versionKey: false,
      timestamps: true,
      toJSON: {
        virtuals: true,
        transform: (_doc: unknown, ret: any) => {
          delete ret._id;
          delete ret.passwordHash; // never send password hashes to the browser
          return ret;
        },
      },
    }
  )
);
