import { Types } from 'mongoose';

export function isValidObjectId(id?: string): boolean {
  if (!id) return false;
  return Types.ObjectId.isValid(id);
}

export function toObjectId(id: string): Types.ObjectId {
  if (!Types.ObjectId.isValid(id)) throw new Error(`Invalid ObjectId: ${id}`);
  return new Types.ObjectId(id);
}

export function toObjectIdOrUndefined(id?: string): Types.ObjectId | undefined {
  if (!id) return undefined;
  return Types.ObjectId.isValid(id) ? new Types.ObjectId(id) : undefined;
}

export function toObjectIdString(id?: string): string | undefined {
  const obj = toObjectIdOrUndefined(id);
  return obj ? obj.toString() : undefined;
}

export function toObjectIdArray(ids?: string[]): Types.ObjectId[] {
  return ids?.map(id => toObjectId(id)) || [];
}
