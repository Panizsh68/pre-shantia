import { Document } from 'mongoose';

/**
 * Convert a Mongoose Document or plain object to a strongly-typed plain object.
 * Works with actual Documents, plain objects, and test doubles.
 */
export function toPlain<T>(doc: unknown): T {
  // Some mongoose Document-like objects expose a `toObject()` method.
  // Use a narrow typed shape so we don't rely on `any`.
  const maybeDoc = doc as { toObject?: () => unknown };
  if (maybeDoc && typeof maybeDoc.toObject === 'function') {
    return maybeDoc.toObject() as T;
  }
  return doc as T;
}

export function toPlainArray<T>(docs: unknown[]): T[] {
  return docs.map(d => toPlain<T>(d));
}
