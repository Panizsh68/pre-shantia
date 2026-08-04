import { HttpException } from '@nestjs/common';
import { OtpService } from './otp.service';

describe('OtpService security', () => {
  const cache = {
    setIfAbsent: jest.fn(), setRaw: jest.fn(), delete: jest.fn(), verifyOtpChallenge: jest.fn(),
  };
  const provider = { sendTemplate: jest.fn() };
  const generator = { generate: jest.fn(() => '1234') };
  const config = { get: jest.fn((name: string) => name === 'ENCRYPTION_KEY' ? 'test-encryption-key' : 300) };
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
    expect(stored).not.toContain('1234');
    expect(provider.sendTemplate).toHaveBeenCalledWith('09123456789', 'verify', '1234');
  });

  it('enforces resend cooldown', async () => {
    cache.setIfAbsent.mockResolvedValue(false);
    await expect(service.sendOtpToPhone('09123456789')).rejects.toBeInstanceOf(HttpException);
    expect(provider.sendTemplate).not.toHaveBeenCalled();
  });

  it.each(['invalid', 'expired', 'locked'] as const)('rejects %s challenges generically', async result => {
    cache.verifyOtpChallenge.mockResolvedValue(result);
    await expect(service.verifyOtp('09123456789', '1234')).rejects.toThrow('Invalid or expired OTP');
  });

  it('delegates atomic one-time verification to Redis', async () => {
    await expect(service.verifyOtp('09123456789', '1234')).resolves.toBe(true);
    expect(cache.verifyOtpChallenge).toHaveBeenCalledWith(expect.stringContaining('otp:challenge:'), '', expect.any(String), 5);
    cache.verifyOtpChallenge.mockResolvedValueOnce('valid').mockResolvedValueOnce('invalid');
    await expect(Promise.all([service.verifyOtp('09123456789', '1234'), service.verifyOtp('09123456789', '1234')])).rejects.toThrow();
  });
});
