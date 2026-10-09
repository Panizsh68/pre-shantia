import { toReferenceIdString } from 'src/utils/reference-id.util';

/**
 * Returns the canonical string id for either a raw Mongo id or a populated
 * company document. Product queries populate `companyId`, while cart items
 * store it as a string, so comparing the value directly is not reliable.
 */
export function toCompanyIdString(value: unknown): string | undefined {
  return toReferenceIdString(value);
}
