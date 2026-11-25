import { Schema, model } from 'mongoose';

// One row per logged-in browser. Only a SHA-256 hash of the cookie token is stored,
// so a leaked database does not hand out working logins.
export const Session = model(
  'Session',
  new Schema(
    {
      tokenHash: { type: String, required: true, unique: true },
      userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
      // MongoDB deletes the row by itself once this time has passed (TTL index)
      expiresAt: { type: Date, required: true, expires: 0 },
    },
    { versionKey: false, timestamps: { createdAt: true, updatedAt: false } }
  )
);
