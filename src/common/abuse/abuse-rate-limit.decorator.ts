import { SetMetadata } from '@nestjs/common';

export type AbuseIdentity = 'ip' | 'phone' | 'phone-ip' | 'user' | 'session';
export interface AbuseRateRule { name: string; identity: AbuseIdentity; config: string; }
export const ABUSE_RATE_RULES = 'abuse-rate-rules';
export const AbuseRateLimit = (...rules: AbuseRateRule[]) => SetMetadata(ABUSE_RATE_RULES, rules);
