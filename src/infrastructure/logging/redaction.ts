import { AsyncLocalStorage } from 'node:async_hooks';

const requestStorage = new AsyncLocalStorage<{ requestId: string }>();
const sensitiveKey = /password|passwd|secret|token|authorization|cookie|csrf|otp|one.?time|api.?key|access.?key|private.?key|signature|signed.?url|national.?id|melicode|phone|callback.?payload|payload|dto/i;
const identifierKey = /^(?:id|_id|userId|orderId|companyId|transactionId|trackId|localId|refNumber)$/i;

export function runWithRequestId<T>(requestId: string, callback: () => T): T {
  return requestStorage.run({ requestId }, callback);
}

export function getRequestId(): string | undefined {
  return requestStorage.getStore()?.requestId;
}

function maskIdentifier(value: string): string {
  return value.length <= 4 ? '[masked]' : `${'*'.repeat(Math.min(8, value.length - 4))}${value.slice(-4)}`;
}

function redactString(value: string): string {
  return value
    .replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, 'Bearer [REDACTED]')
    .replace(/((?:password|passwd|secret|token|signature|api[_-]?key|access[_-]?key|otp|csrf)["'=:\s]+)[^,\s;&}]+/gi, '$1[REDACTED]')
    .replace(/([?&](?:token|secret|signature|X-Amz-[^=]+|password|key)=)[^&\s]+/gi, '$1[REDACTED]')
    .replace(/(?<!\d)(?:\+98|0098|0)?9\d{9}(?!\d)/g, '[PHONE_REDACTED]');
}

export function redactLogValue(value: unknown, key?: string, seen = new WeakSet<object>()): unknown {
  if (key && sensitiveKey.test(key)) return '[REDACTED]';
  if (value === null || value === undefined) return value;
  if (typeof value === 'string') return key && identifierKey.test(key) ? maskIdentifier(value) : redactString(value);
  if (typeof value !== 'object') return value;
  if (seen.has(value)) return '[CIRCULAR]';
  seen.add(value);
  if (value instanceof Error) return { name: value.name, message: redactString(value.message) };
  if (Array.isArray(value)) return value.map(item => redactLogValue(item, undefined, seen));
  const result: Record<string, unknown> = {};
  for (const [childKey, childValue] of Object.entries(value as Record<string, unknown>)) {
    result[childKey] = redactLogValue(childValue, childKey, seen);
  }
  return result;
}

export function redactLogArgs(values: unknown[]): unknown[] {
  return values.map(value => redactLogValue(value));
}

export function installRedactedConsole(): void {
  const methods = ['log', 'info', 'warn', 'error', 'debug'] as const;
  for (const method of methods) {
    const original = console[method].bind(console);
    console[method] = (...args: unknown[]) => {
      const level = method === 'debug' ? 'debug' : method === 'error' ? 'error' : method === 'warn' ? 'warn' : 'info';
      const configured = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');
      const order = { debug: 10, info: 20, warn: 30, error: 40 };
      if (order[level] < (order[configured as keyof typeof order] || 20)) return;
      original(JSON.stringify({ timestamp: new Date().toISOString(), level, requestId: getRequestId(), data: redactLogArgs(args) }));
    };
  }
}
