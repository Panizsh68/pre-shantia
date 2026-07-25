import { registerAs } from '@nestjs/config';

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required production environment variable: ${name}`);
  }
  return value;
}

function parseNumber(val: string | undefined, fallback: number): number {
  const n = Number(val);
  return isNaN(n) ? fallback : n;
}

function parseBoolean(val: string | undefined, fallback: boolean): boolean {
  if (val === undefined) { return fallback; }
  return val.toLowerCase() === 'true';
}

function createCore() {
  return {
  NODE_ENV: process.env.NODE_ENV || 'production',
  MONGO_URL: requiredEnv('MONGO_URL'),
  ENCRYPTION_KEY: requiredEnv('ENCRYPTION_KEY'),
  JWT_ACCESS_SECRET: requiredEnv('JWT_ACCESS_SECRET'),
  JWT_REFRESH_SECRET: requiredEnv('JWT_REFRESH_SECRET'),
  JWT_SECRET_KEY: requiredEnv('JWT_SECRET_KEY'),
  REDIS_HOST: requiredEnv('REDIS_HOST'),
  REDIS_PORT: parseNumber(process.env.REDIS_PORT, 6379),
  REDIS_PASSWORD: requiredEnv('REDIS_PASSWORD'),
  OTP_TTL: parseNumber(process.env.OTP_TTL, 300),
  KAVENEGAR_API_KEY: process.env.KAVENEGAR_API_KEY || '',
  KAVENEGAR_TEMPLATE: process.env.KAVENEGAR_TEMPLATE || '',
  KAVENEGAR_SENDER: process.env.KAVENEGAR_SENDER || '',
  ZIBAL_MERCHANT_ID: requiredEnv('ZIBAL_MERCHANT_ID'),
  ZIBAL_SANDBOX: parseBoolean(process.env.ZIBAL_SANDBOX, false),
  ZIBAL_CALLBACK_URL: requiredEnv('ZIBAL_CALLBACK_URL'),
  ZIBAL_SECRET_KEY: requiredEnv('ZIBAL_SECRET_KEY'),
  ZIBAL_LOG_LEVEL: parseNumber(process.env.ZIBAL_LOG_LEVEL, 2),
  APP_URL: requiredEnv('APP_URL'),
  PAYMENT_CALLBACK_SECRET: requiredEnv('PAYMENT_CALLBACK_SECRET'),
  SUPERADMIN_MELICODE: process.env.SUPERADMIN_MELICODE || '',
  SUPERADMIN_PHONE: process.env.SUPERADMIN_PHONE || '',
  R2_ENDPOINT: process.env.R2_ENDPOINT || '',
  R2_ACCESS_KEY: process.env.R2_ACCESS_KEY || '',
  R2_SECRET_KEY: process.env.R2_SECRET_KEY || '',
  R2_BUCKET: process.env.R2_BUCKET || '',
  R2_PUBLIC_BASE_URL: process.env.R2_PUBLIC_BASE_URL || '',
  };
}

// keep registerAs for consumers that import this config explicitly
export default registerAs('config', () => {
  const core = createCore();

  return {
    ...core,
  // provide legacy camelCase fields too
  port: parseNumber(process.env.PORT, 3000),
  mongoUrl: core.MONGO_URL,
  redis: {
    host: core.REDIS_HOST,
    port: core.REDIS_PORT,
    password: core.REDIS_PASSWORD,
  },
  jwt: {
    accessSecret: core.JWT_ACCESS_SECRET,
    refreshSecret: core.JWT_REFRESH_SECRET,
    secretKey: core.JWT_SECRET_KEY,
  },
  encryptionKey: core.ENCRYPTION_KEY,
  otpTtl: core.OTP_TTL,
  zibal: {
    merchant: core.ZIBAL_MERCHANT_ID,
    sandbox: core.ZIBAL_SANDBOX,
    callbackUrl: core.ZIBAL_CALLBACK_URL,
    secretKey: core.ZIBAL_SECRET_KEY,
    logLevel: core.ZIBAL_LOG_LEVEL,
  },
  appUrl: core.APP_URL,
  superadmin: {
    melicode: core.SUPERADMIN_MELICODE,
    phone: core.SUPERADMIN_PHONE,
  },
  nodeEnv: core.NODE_ENV,
  r2: {
    endpoint: core.R2_ENDPOINT,
    accessKey: core.R2_ACCESS_KEY,
    secretKey: core.R2_SECRET_KEY,
    bucket: core.R2_BUCKET,
    publicBaseUrl: core.R2_PUBLIC_BASE_URL,
  },
  };
});
