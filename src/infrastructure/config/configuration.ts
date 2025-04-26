export default () => ({
    NODE_ENV: process.env.NODE_ENV || 'DEV',
    MONGO_URL: process.env.MONGO_URL || 'mongodb://localhost:27017/test',
    ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,
    JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
    JWT_SECRECT_KEY: process.env.JWT_SECRECT_KEY,
    REDIS_HOST: process.env.REDIS_HOST || 'localhost',
    REDIS_PORT: parseInt(process.env.REDIS_PORT ?? '6379', 10),
    OTP_TTL: parseInt(process.env.OTP_TTL ?? '300', 10), // 5 minutes default,
    SUPERADMIN_PHONE: process.env.SUPERADMIN_PHONE,
    SUPERADMIN_MELICODE: process.env.SUPERADMIN_MELICODE,
    GOFTINO_API_KEY: process.env.GOFTINO_API_KEY,
    GOFTINO_API_URL: process.env.GOFTINO_API_URL,
  });
  