import { registerAs } from '@nestjs/config';

const PLACEHOLDER_SECRET = /^(?:change(?:[-_ ]?me)?|replace(?:[-_ ]?me)?|use[-_ ]?a[-_ ]?fake|your[-_ ]|example|dummy|default|password|secret|test|changeme|<[^>]+>|\$\{[^}]+\})/i;

export interface ProductionCoreConfig {
  NODE_ENV: 'production'; MONGO_URL: string; ENCRYPTION_KEY: string;
  JWT_ACCESS_SECRET: string; JWT_REFRESH_SECRET: string; JWT_SECRET_KEY: string;
  REDIS_HOST: string; REDIS_PORT: number; REDIS_PASSWORD: string; OTP_TTL: number;
  KAVENEGAR_API_KEY: string; KAVENEGAR_TEMPLATE: string; KAVENEGAR_SENDER: string;
  SHAHKAR_ENABLED: boolean; SHAHKAR_BASE_URL: string; SHAHKAR_API_KEY: string; MOCK_PROVIDERS_ENABLED: boolean;
  ZIBAL_MERCHANT_ID: string; ZIBAL_SANDBOX: boolean; ZIBAL_CALLBACK_URL: string;
  ZIBAL_SECRET_KEY?: string; ZIBAL_LOG_LEVEL: number; APP_URL: string;
  PAYMENT_CALLBACK_SECRET?: string; SUPERADMIN_MELICODE: string; SUPERADMIN_PHONE: string;
  R2_ENDPOINT: string; R2_ACCESS_KEY: string; R2_SECRET_KEY: string;
  R2_BUCKET: string; R2_PUBLIC_BASE_URL: string;
  ENABLE_SWAGGER: boolean; SWAGGER_USERNAME: string; SWAGGER_PASSWORD: string;
  HEALTH_READINESS_TOKEN: string; LOG_LEVEL: string;
  RATE_LIMITS: Record<string, number>;
  TRUSTED_PROXY_HOPS: number;
}

function requiredEnv(name: string, env: NodeJS.ProcessEnv): string {
  const value = env[name]?.trim();
  if (!value) throw new Error(`Missing required production environment variable: ${name}`);
  return value;
}

function requiredHttpsUrl(name: string, env: NodeJS.ProcessEnv): string {
  const value = requiredEnv(name, env);
  try {
    if (new URL(value).protocol !== 'https:') throw new Error('must use HTTPS');
  } catch (error) {
    throw new Error(`Invalid production URL for ${name}: ${error instanceof Error ? error.message : 'must use HTTPS'}`);
  }
  return value;
}

function requiredSecret(name: string, env: NodeJS.ProcessEnv, minimumLength = 16): string {
  const value = requiredEnv(name, env);
  if (value.length < minimumLength || PLACEHOLDER_SECRET.test(value)) {
    throw new Error(`Production secret ${name} is weak, default, or placeholder-like`);
  }
  return value;
}

function optionalSecret(name: string, env: NodeJS.ProcessEnv, minimumLength = 32): string | undefined {
  const value = env[name]?.trim();
  if (!value) return undefined;
  if (value.length < minimumLength || PLACEHOLDER_SECRET.test(value)) {
    throw new Error(`Production secret ${name} is weak, default, or placeholder-like`);
  }
  return value;
}

function parseNumber(name: string, env: NodeJS.ProcessEnv, fallback: number): number {
  const raw = env[name];
  if (raw === undefined || raw.trim() === '') return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 1) throw new Error(`Invalid production number for ${name}`);
  return value;
}

function parseBoolean(name: string, env: NodeJS.ProcessEnv, fallback: boolean): boolean {
  const raw = env[name];
  if (raw === undefined) return fallback;
  if (raw !== 'true' && raw !== 'false') throw new Error(`Invalid production boolean for ${name}`);
  return raw === 'true';
}

export function validateProductionEnvironment(env: NodeJS.ProcessEnv = process.env): ProductionCoreConfig {
  if ((env.NODE_ENV || 'production') !== 'production') throw new Error('Production configuration requires NODE_ENV=production');
  if (parseBoolean('MOCK_PROVIDERS_ENABLED', env, false)) throw new Error('Mock providers cannot be enabled in production');
  return {
    NODE_ENV: 'production',
    MONGO_URL: requiredEnv('MONGO_URL', env),
    ENCRYPTION_KEY: requiredSecret('ENCRYPTION_KEY', env, 32),
    JWT_ACCESS_SECRET: requiredSecret('JWT_ACCESS_SECRET', env, 32),
    JWT_REFRESH_SECRET: requiredSecret('JWT_REFRESH_SECRET', env, 32),
    JWT_SECRET_KEY: requiredSecret('JWT_SECRET_KEY', env, 32),
    REDIS_HOST: requiredEnv('REDIS_HOST', env),
    REDIS_PORT: parseNumber('REDIS_PORT', env, 6379),
    REDIS_PASSWORD: requiredSecret('REDIS_PASSWORD', env),
    OTP_TTL: parseNumber('OTP_TTL', env, 300),
    KAVENEGAR_API_KEY: requiredSecret('KAVENEGAR_API_KEY', env, 5),
    KAVENEGAR_TEMPLATE: requiredEnv('KAVENEGAR_TEMPLATE', env),
    KAVENEGAR_SENDER: requiredEnv('KAVENEGAR_SENDER', env),
    SHAHKAR_ENABLED: parseBoolean('SHAHKAR_ENABLED', env, false),
    SHAHKAR_BASE_URL: parseBoolean('SHAHKAR_ENABLED', env, false) ? requiredEnv('SHAHKAR_BASE_URL', env) : (env.SHAHKAR_BASE_URL?.trim() || ''),
    SHAHKAR_API_KEY: parseBoolean('SHAHKAR_ENABLED', env, false) ? requiredSecret('SHAHKAR_API_KEY', env, 16) : (env.SHAHKAR_API_KEY?.trim() || ''),
    MOCK_PROVIDERS_ENABLED: parseBoolean('MOCK_PROVIDERS_ENABLED', env, false),
    ZIBAL_MERCHANT_ID: requiredEnv('ZIBAL_MERCHANT_ID', env),
    ZIBAL_SANDBOX: parseBoolean('ZIBAL_SANDBOX', env, false),
    ZIBAL_CALLBACK_URL: requiredHttpsUrl('ZIBAL_CALLBACK_URL', env),
    // zibal@1.x authenticates with the merchant value. It does not consume a
    // ZIBAL_SECRET_KEY, so keep this legacy variable optional for compatibility.
    ZIBAL_SECRET_KEY: env.ZIBAL_SECRET_KEY?.trim() || undefined,
    ZIBAL_LOG_LEVEL: parseNumber('ZIBAL_LOG_LEVEL', env, 2),
    APP_URL: requiredHttpsUrl('APP_URL', env),
    // Normal Zibal callbacks are authenticated by local trackId lookup and a
    // server-to-server verify call. This optional value is only for trusted
    // internal callbacks sent with X-Callback-Secret.
    PAYMENT_CALLBACK_SECRET: optionalSecret('PAYMENT_CALLBACK_SECRET', env),
    SUPERADMIN_MELICODE: env.SUPERADMIN_MELICODE?.trim() || '',
    SUPERADMIN_PHONE: env.SUPERADMIN_PHONE?.trim() || '',
    R2_ENDPOINT: env.R2_ENDPOINT?.trim() || '', R2_ACCESS_KEY: env.R2_ACCESS_KEY?.trim() || '',
    R2_SECRET_KEY: env.R2_SECRET_KEY?.trim() || '', R2_BUCKET: env.R2_BUCKET?.trim() || '',
    R2_PUBLIC_BASE_URL: env.R2_PUBLIC_BASE_URL?.trim() || '',
    ENABLE_SWAGGER: parseBoolean('ENABLE_SWAGGER', env, false),
    SWAGGER_USERNAME: env.SWAGGER_USERNAME?.trim() || '',
    SWAGGER_PASSWORD: env.SWAGGER_PASSWORD?.trim() || '',
    HEALTH_READINESS_TOKEN: requiredSecret('HEALTH_READINESS_TOKEN', env, 32),
    LOG_LEVEL: env.LOG_LEVEL?.trim() || 'info',
    RATE_LIMITS: {
      LOGIN_MAX: parseNumber('RATE_LIMIT_LOGIN_MAX', env, 5), LOGIN_WINDOW_SECONDS: parseNumber('RATE_LIMIT_LOGIN_WINDOW_SECONDS', env, 900),
      OTP_REQUEST_PHONE_MAX: parseNumber('RATE_LIMIT_OTP_REQUEST_PHONE_MAX', env, 3), OTP_REQUEST_PHONE_WINDOW_SECONDS: parseNumber('RATE_LIMIT_OTP_REQUEST_PHONE_WINDOW_SECONDS', env, 600),
      OTP_REQUEST_IP_MAX: parseNumber('RATE_LIMIT_OTP_REQUEST_IP_MAX', env, 10), OTP_REQUEST_IP_WINDOW_SECONDS: parseNumber('RATE_LIMIT_OTP_REQUEST_IP_WINDOW_SECONDS', env, 3600),
      OTP_VERIFY_MAX: parseNumber('RATE_LIMIT_OTP_VERIFY_MAX', env, 5), OTP_VERIFY_WINDOW_SECONDS: parseNumber('RATE_LIMIT_OTP_VERIFY_WINDOW_SECONDS', env, 900),
      REFRESH_MAX: parseNumber('RATE_LIMIT_REFRESH_MAX', env, 30), REFRESH_WINDOW_SECONDS: parseNumber('RATE_LIMIT_REFRESH_WINDOW_SECONDS', env, 900),
      PUBLIC_FORM_MAX: parseNumber('RATE_LIMIT_PUBLIC_FORM_MAX', env, 5), PUBLIC_FORM_WINDOW_SECONDS: parseNumber('RATE_LIMIT_PUBLIC_FORM_WINDOW_SECONDS', env, 3600),
      PAYMENT_MAX: parseNumber('RATE_LIMIT_PAYMENT_MAX', env, 10), PAYMENT_WINDOW_SECONDS: parseNumber('RATE_LIMIT_PAYMENT_WINDOW_SECONDS', env, 900),
      GLOBAL_MAX: parseNumber('RATE_LIMIT_GLOBAL_MAX', env, 600), GLOBAL_WINDOW_SECONDS: parseNumber('RATE_LIMIT_GLOBAL_WINDOW_SECONDS', env, 900),
    },
    TRUSTED_PROXY_HOPS: parseNumber('TRUSTED_PROXY_HOPS', env, 1),
  };
}

export default registerAs('config', () => {
  const core = validateProductionEnvironment();
  if (core.ENABLE_SWAGGER) {
    if (!core.SWAGGER_USERNAME || !core.SWAGGER_PASSWORD) {
      throw new Error('Swagger credentials are required when ENABLE_SWAGGER=true');
    }
    requiredSecret('SWAGGER_PASSWORD', process.env, 16);
  }
  return {
    ...core, port: parseNumber('PORT', process.env, 3000), mongoUrl: core.MONGO_URL,
    redis: { host: core.REDIS_HOST, port: core.REDIS_PORT, password: core.REDIS_PASSWORD },
    jwt: { accessSecret: core.JWT_ACCESS_SECRET, refreshSecret: core.JWT_REFRESH_SECRET, secretKey: core.JWT_SECRET_KEY },
    encryptionKey: core.ENCRYPTION_KEY, otpTtl: core.OTP_TTL,
    zibal: { merchant: core.ZIBAL_MERCHANT_ID, sandbox: core.ZIBAL_SANDBOX, callbackUrl: core.ZIBAL_CALLBACK_URL, secretKey: core.ZIBAL_SECRET_KEY, logLevel: core.ZIBAL_LOG_LEVEL },
    appUrl: core.APP_URL, superadmin: { melicode: core.SUPERADMIN_MELICODE, phone: core.SUPERADMIN_PHONE },
    nodeEnv: core.NODE_ENV,
    r2: { endpoint: core.R2_ENDPOINT, accessKey: core.R2_ACCESS_KEY, secretKey: core.R2_SECRET_KEY, bucket: core.R2_BUCKET, publicBaseUrl: core.R2_PUBLIC_BASE_URL },
  };
});
