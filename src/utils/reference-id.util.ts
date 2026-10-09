import { Types } from 'mongoose';

interface ReferenceWithId {
  _id?: unknown;
  id?: unknown;
}

/** Normalize a raw id, ObjectId, or populated Mongoose reference. */
export function toReferenceIdString(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value === 'string') return value;
  if (value instanceof Types.ObjectId) return value.toHexString();

  if (typeof value === 'object') {
    const reference = value as ReferenceWithId;
    if (reference._id !== undefined && reference._id !== null) {
      return toReferenceIdString(reference._id);
    }
    if (reference.id !== undefined && reference.id !== null) {
      return toReferenceIdString(reference.id);
    }
  }

  return undefined;
}
