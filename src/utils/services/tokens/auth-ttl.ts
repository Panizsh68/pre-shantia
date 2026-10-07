import { ConfigService } from '@nestjs/config';

export interface AuthTokenTtl {
  accessSeconds: number;
  refreshSeconds: number;
}

const DEFAULT_ACCESS_SECONDS = 10 * 60;
const DEFAULT_REFRESH_SECONDS = 48 * 60 * 60;

function parseDuration(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) return Math.floor(value);
  if (typeof value !== 'string' || !value.trim()) return fallback;
  if (/^\d+$/.test(value.trim())) return Number(value.trim());
  const match = value.trim().match(/^(\d+)\s*(s|m|h|d)$/i);
  if (!match) return fallback;
  const amount = Number(match[1]);
  const multiplier = { s: 1, m: 60, h: 3600, d: 86400 }[match[2].toLowerCase() as 's' | 'm' | 'h' | 'd'];
  return amount > 0 ? amount * multiplier : fallback;
}

/** One source of truth for JWT, Redis refresh sessions and refresh cookies. */
export function getAuthTokenTtl(config: ConfigService): AuthTokenTtl {
  const accessFromEnv = config.get<string | number>('JWT_ACCESS_TTL_SECONDS');
  const refreshFromEnv = config.get<string | number>('JWT_REFRESH_TTL_SECONDS');
  const accessFallback = parseDuration(config.get<string>('JWT_ACCESS_EXPIRES'), DEFAULT_ACCESS_SECONDS);
  const refreshFallback = parseDuration(config.get<string>('JWT_REFRESH_EXPIRES'), DEFAULT_REFRESH_SECONDS);
  const accessSeconds = parseDuration(accessFromEnv, accessFallback);
  const refreshSeconds = parseDuration(refreshFromEnv, refreshFallback);
  return {
    accessSeconds: Math.max(60, accessSeconds),
    refreshSeconds: Math.max(15 * 60, refreshSeconds),
  };
}
