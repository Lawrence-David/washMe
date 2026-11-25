import { Schema, model } from 'mongoose';

// Running number sequences, e.g. { _id: 'order', seq: 1042 }.
// Numbers only ever go up, so an order code is never handed out twice, even after deletes.
export const Counter = model(
  'Counter',
  new Schema({ _id: { type: String, required: true }, seq: { type: Number, required: true } }, { versionKey: false })
);
