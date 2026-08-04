import { ConsoleLogger } from '@nestjs/common';
import { getRequestId, redactLogValue } from './redaction';

/**
 * Nest 9+ rejects custom loggers derived from Logger. ConsoleLogger is the
 * supported extension point and retains the LoggerService contract.
 */
export class RedactingLogger extends ConsoleLogger {
  private write(level: string, message: unknown, context?: string): void {
    const configured = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');
    const order = { debug: 10, log: 20, warn: 30, error: 40, verbose: 10, fatal: 50 };
    if (order[level as keyof typeof order] < (order[configured as keyof typeof order] || 20)) return;
    const record = {
      timestamp: new Date().toISOString(), level, context: context || this.context,
      requestId: getRequestId(), message: redactLogValue(message),
    };
    super.log(JSON.stringify(record));
  }

  log(message: unknown, context?: string): void { this.write('log', message, context); }
  error(message: unknown, _stack?: string, context?: string): void { this.write('error', message, context); }
  warn(message: unknown, context?: string): void { this.write('warn', message, context); }
  debug(message: unknown, context?: string): void { this.write('debug', message, context); }
  /**
   * Logs a development-only OTP without passing it through the generic
   * redactor, which intentionally masks OTP-looking values.
   */
  debugOtp(otp: string, enabled = false): void {
    if (!enabled) return;
    super.log(JSON.stringify({
      timestamp: new Date().toISOString(), level: 'debug', context: this.context,
      requestId: getRequestId(), message: `Development verification code: ${otp}`,
    }));
  }
  verbose(message: unknown, context?: string): void { this.write('verbose', message, context); }
  fatal(message: unknown, context?: string): void { this.write('fatal', message, context); }
}
