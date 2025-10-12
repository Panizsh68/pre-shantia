export interface Config {
  NODE_ENV: string;
  MONGO_URL: string;
  ENCRYPTION_KEY?: string;
  JWT_ACCESS_SECRET?: string;
  JWT_REFRESH_SECRET?: string;
  JWT_SECRECT_KEY?: string;
  REDIS_HOST: string;
  REDIS_PORT: number;
  OTP_TTL: number;
  SUPERADMIN_PHONE?: string;
  SUPERADMIN_MELICODE?: string;
  ZIBAL_MERCHANT_ID?: string;
  ZIBAL_SANDBOX?: boolean;
  ZIBAL_ACCESS_TOKEN?: string;
  ZIBAL_CALLBACK_URL?: string;
  ZIBAL_SECRET_KEY?: string;
  ZIBAL_LOG_LEVEL?: number;
  APP_URL: string;
}
