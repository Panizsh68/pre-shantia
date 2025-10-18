function parseNumber(val: string | undefined, fallback: number): number {
  const n = Number(val);
  return isNaN(n) ? fallback : n;
}

export default () => {
  const MONGO_URL = process.env.MONGO_URL || 'mongodb://mongo:27017/test?replicaSet=rs0';
  const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '';
  const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || '';
  const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || '';
  const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY || '';
  const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
  const REDIS_PORT = parseNumber(process.env.REDIS_PORT, 6379);
  const OTP_TTL = parseNumber(process.env.OTP_TTL, 300);
  const SUPERADMIN_PHONE = process.env.SUPERADMIN_PHONE || '';
  const SUPERADMIN_MELICODE = process.env.SUPERADMIN_MELICODE || '';
  const ZIBAL_MERCHANT_ID = process.env.ZIBAL_MERCHANT_ID || '68b44a2ca45c720011a852e0';
  const ZIBAL_SANDBOX = (process.env.ZIBAL_SANDBOX || '').toLowerCase() === 'true';
  const ZIBAL_CALLBACK_URL = process.env.ZIBAL_CALLBACK_URL || 'http://localhost:3000/payment/callback';
  const ZIBAL_SECRET_KEY = process.env.ZIBAL_SECRET_KEY || '';
  const ZIBAL_LOG_LEVEL = parseNumber(process.env.ZIBAL_LOG_LEVEL, 2);
  const APP_URL = process.env.APP_URL || 'http://localhost:3000';
  const R2_ENDPOINT = process.env.R2_ENDPOINT || '';
  const R2_ACCESS_KEY = process.env.R2_ACCESS_KEY || '';
  const R2_SECRET_KEY = process.env.R2_SECRET_KEY || '';
  const R2_BUCKET = process.env.R2_BUCKET || '';
  const R2_PUBLIC_BASE_URL = process.env.R2_PUBLIC_BASE_URL || '';

  // Provide both flat keys and an `app` nested object to avoid breaking changes.
  return {
    NODE_ENV: process.env.NODE_ENV || 'development',
    MONGO_URL,
    ENCRYPTION_KEY,
    JWT_ACCESS_SECRET,
    JWT_REFRESH_SECRET,
    JWT_SECRET_KEY,
    REDIS_HOST,
    REDIS_PORT,
    REDIS_PASSWORD: process.env.REDIS_PASSWORD || undefined,
    OTP_TTL,
    KAVENEGAR_API_KEY: process.env.KAVENEGAR_API_KEY || '',
    KAVENEGAR_TEMPLATE: process.env.KAVENEGAR_TEMPLATE || '',
    KAVENEGAR_SENDER: process.env.KAVENEGAR_SENDER || '',
    SUPERADMIN_PHONE,
    SUPERADMIN_MELICODE,
    ZIBAL_MERCHANT_ID,
    ZIBAL_SANDBOX,
    ZIBAL_CALLBACK_URL,
    ZIBAL_SECRET_KEY,
    ZIBAL_LOG_LEVEL,
    APP_URL,
    R2_ENDPOINT,
    R2_ACCESS_KEY,
    R2_SECRET_KEY,
    R2_BUCKET,
    R2_PUBLIC_BASE_URL,
    app: {
      NODE_ENV: process.env.NODE_ENV || 'development',
      MONGO_URL,
      ENCRYPTION_KEY,
      JWT_ACCESS_SECRET,
      JWT_REFRESH_SECRET,
      JWT_SECRET_KEY,
      REDIS_HOST,
      REDIS_PORT,
      OTP_TTL,
      SUPERADMIN_PHONE,
      SUPERADMIN_MELICODE,
      ZIBAL_MERCHANT_ID,
      ZIBAL_SANDBOX,
      ZIBAL_CALLBACK_URL,
      ZIBAL_SECRET_KEY,
      ZIBAL_LOG_LEVEL,
      APP_URL,
      R2_ENDPOINT,
      R2_ACCESS_KEY,
      R2_SECRET_KEY,
      R2_BUCKET,
      R2_PUBLIC_BASE_URL,
    },
  };
};
