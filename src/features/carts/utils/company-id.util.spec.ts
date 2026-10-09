import { Types } from 'mongoose';
import { toCompanyIdString } from './company-id.util';

describe('toCompanyIdString', () => {
  const companyId = '6a8a1f8c9ae367e780009afd';

  it('extracts the id from a populated company document', () => {
    expect(toCompanyIdString({ _id: new Types.ObjectId(companyId), name: 'تجاریس' })).toBe(companyId);
  });

  it('supports a populated response that exposes id instead of _id', () => {
    expect(toCompanyIdString({ id: companyId, name: 'تجاریس' })).toBe(companyId);
  });

  it('supports a raw ObjectId and string id', () => {
    expect(toCompanyIdString(new Types.ObjectId(companyId))).toBe(companyId);
    expect(toCompanyIdString(companyId)).toBe(companyId);
  });

  it('returns undefined when the company reference has no id', () => {
    expect(toCompanyIdString({ name: 'تجاریس' })).toBeUndefined();
    expect(toCompanyIdString(undefined)).toBeUndefined();
  });
});
