import { registerAs } from '@nestjs/config';

function parseNumber(val: string | undefined, fallback: number): number {
  const n = Number(val);
  return isNaN(n) ? fallback : n;
}

function parseBoolean(val: string | undefined, fallback: boolean): boolean {
  if (val === undefined) {return fallback;}
  return val.toLowerCase() === 'true';
}

export default registerAs('config', () => ({
  port: parseNumber(process.env.PORT, 3000),
  mongoUrl: process.env.MONGO_URL || 'mongodb://mongo:27017/test?replicaSet=rs0',
  redis: {
    host: process.env.REDIS_HOST || 'redis',
    port: parseNumber(process.env.REDIS_PORT, 6379),
    password: process.env.REDIS_PASSWORD || 'shantia_ariaSakht0425',
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || '',
    refreshSecret: process.env.JWT_REFRESH_SECRET || '',
    secretKey: process.env.JWT_SECRET_KEY || '',
  },
  encryptionKey: process.env.ENCRYPTION_KEY || '',
  otpTtl: parseNumber(process.env.OTP_TTL, 300),
  zibal: {
    merchant: process.env.ZIBAL_MERCHANT_ID || '68b44a2ca45c720011a852e0',
    sandbox: parseBoolean(process.env.ZIBAL_SANDBOX, false),
    callbackUrl: process.env.ZIBAL_CALLBACK_URL || 'https://ariasakht.com/payment/callback',
    secretKey: process.env.ZIBAL_SECRET_KEY || '',
    logLevel: parseNumber(process.env.ZIBAL_LOG_LEVEL, 2),
  },
  tabanSms: {
    key: process.env.TABAN_SMS_KEY || '',
    url: process.env.TABAN_SMS_URL || '',
  },
  appUrl: process.env.APP_URL || 'https://ariasakht.com',
  superadmin: {
    melicode: process.env.SUPERADMIN_MELICODE || '',
    phone: process.env.SUPERADMIN_PHONE || '',
  },
  nodeEnv: process.env.NODE_ENV || 'production',
}));
