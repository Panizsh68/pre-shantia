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
  it('allows Shahkar to be disabled without provider credentials', () => {
    const env = validEnvironment();
    env.SHAHKAR_ENABLED = 'false';
    delete env.SHAHKAR_BASE_URL;
    delete env.SHAHKAR_API_KEY;
    expect(validateProductionEnvironment(env).SHAHKAR_ENABLED).toBe(false);
  });
  it('rejects missing callback secret', () => {
    const env = validEnvironment(); delete env.PAYMENT_CALLBACK_SECRET;
    expect(() => validateProductionEnvironment(env)).toThrow(/PAYMENT_CALLBACK_SECRET/);
  });
  it('rejects placeholder and weak JWT secrets', () => {
    const env = validEnvironment(); env.JWT_ACCESS_SECRET = 'change-me';
    expect(() => validateProductionEnvironment(env)).toThrow(/JWT_ACCESS_SECRET/);
  });

  it('rejects mock providers in production', () => {
    const env = validEnvironment(); env.MOCK_PROVIDERS_ENABLED = 'true';
    expect(() => validateProductionEnvironment(env)).toThrow(/Mock providers/);
  });
});
