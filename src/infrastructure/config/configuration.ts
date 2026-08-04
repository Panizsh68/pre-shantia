interface R2Config {
  endpoint: string; accessKey: string; secretKey: string; bucket: string; publicBaseUrl: string;
}

interface AppConfig {
  NODE_ENV: string; MONGO_URL: string; ENCRYPTION_KEY: string;
  JWT_ACCESS_SECRET: string; JWT_REFRESH_SECRET: string; JWT_SECRET_KEY: string;
  REDIS_HOST: string; REDIS_PORT: number; OTP_TTL: number;
  SUPERADMIN_PHONE: string; SUPERADMIN_MELICODE: string;
  ZIBAL_MERCHANT_ID: string; ZIBAL_SANDBOX: boolean; ZIBAL_CALLBACK_URL: string;
  ZIBAL_SECRET_KEY: string; ZIBAL_LOG_LEVEL: number; APP_URL: string;
  R2_ENDPOINT: string; R2_ACCESS_KEY: string; R2_SECRET_KEY: string;
  R2_BUCKET: string; R2_PUBLIC_BASE_URL: string;
  SHAHKAR_BASE_URL: string; SHAHKAR_API_KEY: string; MOCK_PROVIDERS_ENABLED: boolean;
  ENABLE_SWAGGER: boolean; SWAGGER_USERNAME: string; SWAGGER_PASSWORD: string;
  HEALTH_READINESS_TOKEN: string; LOG_LEVEL: string;
  RATE_LIMITS: Record<string, number>;
  TRUSTED_PROXY_HOPS: number;
}

interface AppConfiguration extends AppConfig {
  REDIS_PASSWORD?: string; OTP_TTL: number; KAVENEGAR_API_KEY: string;
  KAVENEGAR_TEMPLATE: string; KAVENEGAR_SENDER: string; PAYMENT_CALLBACK_SECRET?: string;
  app: AppConfig; config: { r2: R2Config };
}

function parseNumber(val: string | undefined, fallback: number): number {
  const n = Number(val);
  return Number.isFinite(n) ? n : fallback;
}

const env = (name: string, fallback = '') => process.env[name] || fallback;

export default (): AppConfiguration => {
  const app: AppConfig = {
    NODE_ENV: env('NODE_ENV', 'development'),
    MONGO_URL: env('MONGO_URL', 'mongodb://localhost:27017/test?replicaSet=rs0'),
    ENCRYPTION_KEY: env('ENCRYPTION_KEY'),
    JWT_ACCESS_SECRET: env('JWT_ACCESS_SECRET'),
    JWT_REFRESH_SECRET: env('JWT_REFRESH_SECRET'),
    JWT_SECRET_KEY: env('JWT_SECRET_KEY'),
    REDIS_HOST: env('REDIS_HOST', 'localhost'),
    REDIS_PORT: parseNumber(process.env.REDIS_PORT, 6379),
    OTP_TTL: parseNumber(process.env.OTP_TTL, 300),
    SUPERADMIN_PHONE: env('SUPERADMIN_PHONE'),
    SUPERADMIN_MELICODE: env('SUPERADMIN_MELICODE'),
    ZIBAL_MERCHANT_ID: env('ZIBAL_MERCHANT_ID'),
    ZIBAL_SANDBOX: env('ZIBAL_SANDBOX').toLowerCase() === 'true',
    ZIBAL_CALLBACK_URL: env('ZIBAL_CALLBACK_URL', 'http://localhost:3001/api/payment/callback'),
    ZIBAL_SECRET_KEY: env('ZIBAL_SECRET_KEY'),
    ZIBAL_LOG_LEVEL: parseNumber(process.env.ZIBAL_LOG_LEVEL, 2),
    APP_URL: env('APP_URL', 'http://localhost:3001'),
    R2_ENDPOINT: env('R2_ENDPOINT'), R2_ACCESS_KEY: env('R2_ACCESS_KEY'),
    R2_SECRET_KEY: env('R2_SECRET_KEY'), R2_BUCKET: env('R2_BUCKET'),
    R2_PUBLIC_BASE_URL: env('R2_PUBLIC_BASE_URL'),
    ENABLE_SWAGGER: env('ENABLE_SWAGGER', 'true').toLowerCase() === 'true',
    SWAGGER_USERNAME: env('SWAGGER_USERNAME'),
    SWAGGER_PASSWORD: env('SWAGGER_PASSWORD'),
    HEALTH_READINESS_TOKEN: env('HEALTH_READINESS_TOKEN'),
    LOG_LEVEL: env('LOG_LEVEL', 'debug'),
    SHAHKAR_BASE_URL: env('SHAHKAR_BASE_URL'), SHAHKAR_API_KEY: env('SHAHKAR_API_KEY'),
    MOCK_PROVIDERS_ENABLED: env('MOCK_PROVIDERS_ENABLED').toLowerCase() === 'true',
    RATE_LIMITS: {}, TRUSTED_PROXY_HOPS: parseNumber(process.env.TRUSTED_PROXY_HOPS, 0),
  };

  return {
    ...app,
    REDIS_PASSWORD: process.env.REDIS_PASSWORD || undefined,
    KAVENEGAR_API_KEY: env('KAVENEGAR_API_KEY'),
    KAVENEGAR_TEMPLATE: env('KAVENEGAR_TEMPLATE'),
    KAVENEGAR_SENDER: env('KAVENEGAR_SENDER'),
    SHAHKAR_BASE_URL: env('SHAHKAR_BASE_URL'), SHAHKAR_API_KEY: env('SHAHKAR_API_KEY'),
    MOCK_PROVIDERS_ENABLED: env('MOCK_PROVIDERS_ENABLED').toLowerCase() === 'true',
    PAYMENT_CALLBACK_SECRET: process.env.PAYMENT_CALLBACK_SECRET || undefined,
    RATE_LIMITS: {
      LOGIN_MAX: parseNumber(process.env.RATE_LIMIT_LOGIN_MAX, 5), LOGIN_WINDOW_SECONDS: parseNumber(process.env.RATE_LIMIT_LOGIN_WINDOW_SECONDS, 900),
      OTP_REQUEST_PHONE_MAX: parseNumber(process.env.RATE_LIMIT_OTP_REQUEST_PHONE_MAX, 3), OTP_REQUEST_PHONE_WINDOW_SECONDS: parseNumber(process.env.RATE_LIMIT_OTP_REQUEST_PHONE_WINDOW_SECONDS, 600),
      OTP_REQUEST_IP_MAX: parseNumber(process.env.RATE_LIMIT_OTP_REQUEST_IP_MAX, 10), OTP_REQUEST_IP_WINDOW_SECONDS: parseNumber(process.env.RATE_LIMIT_OTP_REQUEST_IP_WINDOW_SECONDS, 3600),
      OTP_VERIFY_MAX: parseNumber(process.env.RATE_LIMIT_OTP_VERIFY_MAX, 5), OTP_VERIFY_WINDOW_SECONDS: parseNumber(process.env.RATE_LIMIT_OTP_VERIFY_WINDOW_SECONDS, 900),
      REFRESH_MAX: parseNumber(process.env.RATE_LIMIT_REFRESH_MAX, 30), REFRESH_WINDOW_SECONDS: parseNumber(process.env.RATE_LIMIT_REFRESH_WINDOW_SECONDS, 900),
      PUBLIC_FORM_MAX: parseNumber(process.env.RATE_LIMIT_PUBLIC_FORM_MAX, 5), PUBLIC_FORM_WINDOW_SECONDS: parseNumber(process.env.RATE_LIMIT_PUBLIC_FORM_WINDOW_SECONDS, 3600),
      PAYMENT_MAX: parseNumber(process.env.RATE_LIMIT_PAYMENT_MAX, 10), PAYMENT_WINDOW_SECONDS: parseNumber(process.env.RATE_LIMIT_PAYMENT_WINDOW_SECONDS, 900),
      GLOBAL_MAX: parseNumber(process.env.RATE_LIMIT_GLOBAL_MAX, 600), GLOBAL_WINDOW_SECONDS: parseNumber(process.env.RATE_LIMIT_GLOBAL_WINDOW_SECONDS, 900),
    },
    TRUSTED_PROXY_HOPS: app.TRUSTED_PROXY_HOPS,
    app,
    config: { r2: {
      endpoint: app.R2_ENDPOINT, accessKey: app.R2_ACCESS_KEY, secretKey: app.R2_SECRET_KEY,
      bucket: app.R2_BUCKET, publicBaseUrl: app.R2_PUBLIC_BASE_URL,
    } },
  };
};
