export const schemaOptions = {
  versionKey: false as const,
  timestamps: true, // createdAt / updatedAt on every record
  toJSON: {
    virtuals: true,
    transform: (_doc: unknown, ret: any) => {
      delete ret._id;
      return ret;
    },
  },
};
