/**
 * Logger utility for consistent logging across the application.
 * Info/debug/log are silenced; warn/error still go to the console.
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : "";
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  debug(_message: string, _context?: LogContext): void {
    // Intentionally silent — avoid noisy action logs in the console
  }

  info(_message: string, _context?: LogContext): void {
    // Intentionally silent — avoid noisy action logs in the console
  }

  warn(message: string, context?: LogContext): void {
    console.warn(this.formatMessage("warn", message, context));
  }

  error(message: string, context?: LogContext): void {
    console.error(this.formatMessage("error", message, context));
  }

  log(_message: string, _context?: LogContext): void {
    // Intentionally silent
  }
}

export const logger = new Logger();
