import { HttpException } from '@nestjs/common';
import { OtpService } from './otp.service';

describe('OtpService security', () => {
  const cache = {
    setIfAbsent: jest.fn(), setRaw: jest.fn(), delete: jest.fn(), verifyOtpChallenge: jest.fn(),
  };
  const provider = { sendTemplate: jest.fn() };
  const generator = { generate: jest.fn(() => '123456') };
  const config = { get: jest.fn((name: string) => {
    if (name === 'ENCRYPTION_KEY') return 'test-encryption-key';
    if (name === 'OTP_TTL') return 300;
    return undefined;
  }) };
  let service: OtpService;

  beforeEach(() => {
    jest.clearAllMocks();
    cache.setIfAbsent.mockResolvedValue(true); cache.setRaw.mockResolvedValue(true);
    provider.sendTemplate.mockResolvedValue(undefined); cache.verifyOtpChallenge.mockResolvedValue('valid');
    service = new OtpService(cache as any, provider as any, generator as any, config as any);
  });

  it('uses a cryptographic generator and never stores the OTP value', async () => {
    await service.sendOtpToPhone('09123456789');
    const stored = cache.setRaw.mock.calls[0][1] as string;
    expect(stored).not.toContain('123456');
    expect(provider.sendTemplate).toHaveBeenCalledWith('09123456789', 'verify', '123456');
  });

  it('enforces resend cooldown', async () => {
    cache.setIfAbsent.mockResolvedValue(false);
    await expect(service.sendOtpToPhone('09123456789')).rejects.toBeInstanceOf(HttpException);
    expect(provider.sendTemplate).not.toHaveBeenCalled();
  });

  it.each(['invalid', 'expired', 'locked'] as const)('rejects %s challenges generically', async result => {
    cache.verifyOtpChallenge.mockResolvedValue(result);
    await expect(service.verifyOtp('09123456789', '123456')).rejects.toThrow('Invalid or expired OTP');
  });

  it('delegates atomic one-time verification to Redis', async () => {
    await expect(service.verifyOtp('09123456789', '123456')).resolves.toBe(true);
    expect(cache.verifyOtpChallenge).toHaveBeenCalledWith(expect.stringContaining('otp:challenge:'), '', expect.any(String), 5);
    cache.verifyOtpChallenge.mockResolvedValueOnce('valid').mockResolvedValueOnce('invalid');
    await expect(Promise.all([service.verifyOtp('09123456789', '123456'), service.verifyOtp('09123456789', '123456')])).rejects.toThrow();
  });

  it('bypasses SMS only for an explicitly allowlisted phone', async () => {
    const bypassConfig = {
      get: jest.fn((name: string) => ({
        ENCRYPTION_KEY: 'test-encryption-key',
        OTP_TTL: 300,
        AUTH_FIXED_OTP_ENABLED: true,
        AUTH_FIXED_OTP: '123456',
        AUTH_FIXED_OTP_ALLOWED_PHONES: '+989123456789',
      } as Record<string, unknown>)[name]),
    };
    const bypassService = new OtpService(cache as any, provider as any, generator as any, bypassConfig as any);

    expect(bypassService.isFixedOtpEnabledForPhone('09123456789')).toBe(true);
    await bypassService.sendOtpToPhone('09123456789');
    expect(provider.sendTemplate).not.toHaveBeenCalled();
    expect(cache.setRaw).toHaveBeenCalled();
  });
});
