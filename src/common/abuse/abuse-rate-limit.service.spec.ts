import { AbuseRateLimitService } from './abuse-rate-limit.service';

describe('AbuseRateLimitService', () => {
  it('uses Redis atomically and reports remaining/retry values', async () => {
    const cache = { incrementRateLimit: jest.fn().mockResolvedValue({ count: 6, retryAfterSeconds: 42 }) };
    const config = { get: jest.fn().mockReturnValue({ LOGIN_MAX: 5, LOGIN_WINDOW_SECONDS: 900 }) };
    const service = new AbuseRateLimitService(cache as any, config as any);
    await expect(service.consume('login', 'phone:09123456789:ip:127.0.0.1', 'LOGIN')).resolves.toEqual({
      allowed: false, limit: 5, remaining: 0, retryAfterSeconds: 42,
    });
    expect(cache.incrementRateLimit).toHaveBeenCalledWith(expect.stringMatching(/^abuse:login:/), 900);
  });
});
