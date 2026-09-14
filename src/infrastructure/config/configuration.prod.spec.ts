import { validateProductionEnvironment } from './configuration.prod';

const validEnvironment = (): NodeJS.ProcessEnv => ({
  NODE_ENV: 'production', MONGO_URL: 'mongodb://mongo-primary:27017/test?replicaSet=rs0',
  REDIS_HOST: 'redis', REDIS_PASSWORD: 'redis-runtime-secret-1234',
  ENCRYPTION_KEY: 'encryption-runtime-secret-1234567', JWT_ACCESS_SECRET: 'jwt-access-runtime-secret-123456',
  JWT_REFRESH_SECRET: 'jwt-refresh-runtime-secret-123456', JWT_SECRET_KEY: 'jwt-key-runtime-secret-123456789',
  ZIBAL_MERCHANT_ID: 'fake-merchant-id', ZIBAL_CALLBACK_URL: 'https://example.invalid/payment/callback',
  ZIBAL_SECRET_KEY: 'zibal-runtime-secret-1234', APP_URL: 'https://example.invalid',
  KAVENEGAR_API_KEY: 'kavenegar-runtime-key', KAVENEGAR_TEMPLATE: 'verify', KAVENEGAR_SENDER: '10000000',
  SHAHKAR_BASE_URL: 'https://example.invalid/identity', SHAHKAR_API_KEY: 'shahkar-runtime-secret-1234',
  MOCK_PROVIDERS_ENABLED: 'false',
  PAYMENT_CALLBACK_SECRET: 'payment-callback-runtime-secret-1234',
  HEALTH_READINESS_TOKEN: 'health-readiness-runtime-secret-1234',
});

describe('production configuration validation', () => {
  it('accepts complete runtime configuration', () => {
    expect(validateProductionEnvironment(validEnvironment()).PAYMENT_CALLBACK_SECRET).toBeDefined();
  });
  it('supports local upload mode without R2 credentials', () => {
    const env = validEnvironment();
    env.LOCAL_UPLOAD_ENABLED = 'true';
    delete env.R2_ENDPOINT;
    delete env.R2_ACCESS_KEY;
    delete env.R2_SECRET_KEY;
    expect(validateProductionEnvironment(env).LOCAL_UPLOAD_ENABLED).toBe(true);
  });
  it('allows Shahkar to be disabled without provider credentials', () => {
    const env = validEnvironment();
    env.SHAHKAR_ENABLED = 'false';
    delete env.SHAHKAR_BASE_URL;
    delete env.SHAHKAR_API_KEY;
    expect(validateProductionEnvironment(env).SHAHKAR_ENABLED).toBe(false);
  });
  it('allows the optional internal callback secret to be omitted', () => {
    const env = validEnvironment(); delete env.PAYMENT_CALLBACK_SECRET;
    expect(validateProductionEnvironment(env).PAYMENT_CALLBACK_SECRET).toBeUndefined();
  });

  it('rejects a weak optional internal callback secret when configured', () => {
    const env = validEnvironment(); env.PAYMENT_CALLBACK_SECRET = 'too-short';
    expect(() => validateProductionEnvironment(env)).toThrow(/PAYMENT_CALLBACK_SECRET/);
  });

  it('allows the legacy unused Zibal secret to be omitted', () => {
    const env = validEnvironment(); delete env.ZIBAL_SECRET_KEY;
    expect(validateProductionEnvironment(env).ZIBAL_SECRET_KEY).toBeUndefined();
  });
  it('rejects placeholder and weak JWT secrets', () => {
    const env = validEnvironment(); env.JWT_ACCESS_SECRET = 'change-me';
    expect(() => validateProductionEnvironment(env)).toThrow(/JWT_ACCESS_SECRET/);
  });

  it('rejects mock providers in production', () => {
    const env = validEnvironment(); env.MOCK_PROVIDERS_ENABLED = 'true';
    expect(() => validateProductionEnvironment(env)).toThrow(/Mock providers/);
  });

  it('rejects insecure production application and callback URLs', () => {
    const env = validEnvironment(); env.APP_URL = 'http://example.invalid';
    expect(() => validateProductionEnvironment(env)).toThrow(/APP_URL/);
    env.APP_URL = 'https://example.invalid'; env.ZIBAL_CALLBACK_URL = 'http://example.invalid/payment/callback';
    expect(() => validateProductionEnvironment(env)).toThrow(/ZIBAL_CALLBACK_URL/);
  });

  it('requires an exact fixed OTP and an allowlist when the temporary bypass is enabled', () => {
    const env = validEnvironment();
    env.AUTH_FIXED_OTP_ENABLED = 'true';
    env.AUTH_FIXED_OTP = '123456';
    expect(() => validateProductionEnvironment(env)).toThrow(/AUTH_FIXED_OTP_ALLOWED_PHONES/);
    env.AUTH_FIXED_OTP_ALLOWED_PHONES = '+989123456789';
    expect(validateProductionEnvironment(env).AUTH_FIXED_OTP_ENABLED).toBe(true);
  });

  it('allows Kavenegar credentials to be omitted only during the fixed-OTP window', () => {
    const env = validEnvironment();
    env.AUTH_FIXED_OTP_ENABLED = 'true';
    env.AUTH_FIXED_OTP = '123456';
    env.AUTH_FIXED_OTP_ALLOWED_PHONES = '+989123456789';
    delete env.KAVENEGAR_API_KEY;
    delete env.KAVENEGAR_TEMPLATE;
    delete env.KAVENEGAR_SENDER;

    const config = validateProductionEnvironment(env);
    expect(config.KAVENEGAR_API_KEY).toBe('');
    expect(config.KAVENEGAR_TEMPLATE).toBe('');
    expect(config.KAVENEGAR_SENDER).toBe('');
  });

  it('still requires Kavenegar credentials when the fixed-OTP window is disabled', () => {
    const env = validEnvironment();
    delete env.KAVENEGAR_API_KEY;
    expect(() => validateProductionEnvironment(env)).toThrow(/KAVENEGAR_API_KEY/);
  });
});
