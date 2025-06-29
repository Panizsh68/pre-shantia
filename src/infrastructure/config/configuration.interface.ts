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
  ZARINPAL_MERCHANT_ID: string;
  ZARINPAL_SANDBOX: boolean;
  ZARINPAL_ACCESS_TOKEN: string;
  APP_URL: string;
}
