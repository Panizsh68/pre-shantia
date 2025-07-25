export default () => ({
  app: {
    NODE_ENV: process.env.NODE_ENV || 'development',
    MONGO_URL: process.env.MONGO_URL || 'mongodb://mongo:27017/test?replicaSet=rs0',
    ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,
    JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
    JWT_SECRET_KEY: process.env.JWT_SECRET_KEY,
    REDIS_HOST: process.env.REDIS_HOST || 'localhost',
    REDIS_PORT: parseInt(process.env.REDIS_PORT ?? '6379', 10),
    OTP_TTL: parseInt(process.env.OTP_TTL ?? '300', 10),
    SUPERADMIN_PHONE: process.env.SUPERADMIN_PHONE,
    SUPERADMIN_MELICODE: process.env.SUPERADMIN_MELICODE,
    ZARINPAL_MERCHANT_ID:
      process.env.ZARINPAL_MERCHANT_ID || 'a3c16110-f184-44e2-ad26-649387845a94',
    ZARINPAL_SANDBOX: process.env.ZARINPAL_SANDBOX || true,
    ZARINPAL_CALLBACK_URL:
      process.env.ZARINPAL_CALLBACK_URL || 'https://yourdomain.com/payment/callback',
    ZARINPAL_ACCESS_TOKEN: process.env.ZARINPAL_ACCESS_TOKEN || 'your-access-token',
    APP_URL: process.env.APP_URL || 'http://localhost:3000',
  },
});
