import { redactLogValue } from './redaction';

describe('log redaction', () => {
  it('recursively redacts sensitive fields and masks identifiers', () => {
    const value = redactLogValue({
      password: 'password-value',
      nested: { accessToken: 'token-value', phoneNumber: '09123456789', userId: 'user-123456' },
      items: [{ otp: '123456', headers: { authorization: 'Bearer abc.def' } }],
    }) as Record<string, unknown>;
    expect(JSON.stringify(value)).not.toContain('password-value');
    expect(JSON.stringify(value)).not.toContain('token-value');
    expect(JSON.stringify(value)).not.toContain('09123456789');
    expect(JSON.stringify(value)).not.toContain('123456');
    expect((value.nested as Record<string, unknown>).userId).toBe('*******3456');
  });

  it('redacts secrets in strings, URLs, and errors', () => {
    const result = redactLogValue('Authorization: Bearer abc.def?token=secret phone=09123456789');
    expect(result).toContain('Bearer [REDACTED]');
    expect(result).toContain('token=[REDACTED]');
    expect(result).not.toContain('09123456789');
    expect(redactLogValue(new Error('provider secret=hidden'))).toEqual({ name: 'Error', message: 'provider secret=[REDACTED]' });
  });
});
