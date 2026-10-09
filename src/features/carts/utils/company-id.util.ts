import { Types } from 'mongoose';

interface CompanyReference {
  _id?: unknown;
  id?: unknown;
}

/**
 * Returns the canonical string id for either a raw Mongo id or a populated
 * company document. Product queries populate `companyId`, while cart items
 * store it as a string, so comparing the value directly is not reliable.
 */
export function toCompanyIdString(value: unknown): string | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }

  if (typeof value === 'string') {
    return value;
  }

  if (value instanceof Types.ObjectId) {
    return value.toHexString();
  }

  if (typeof value === 'object') {
    const reference = value as CompanyReference;

    if (reference._id !== undefined && reference._id !== null) {
      return toCompanyIdString(reference._id);
    }

    if (reference.id !== undefined && reference.id !== null) {
      return toCompanyIdString(reference.id);
    }
  }

  return undefined;
}
