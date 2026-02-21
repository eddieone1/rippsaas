/**
 * Simple logger for the integration layer.
 * Can be replaced with a structured logger (pino, winston) in production.
 */

type LogLevel = "debug" | "info" | "warn" | "error";

const LOG_LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const currentLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel) || "info";

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVEL_ORDER[level] >= LOG_LEVEL_ORDER[currentLevel];
}

function formatMessage(prefix: string, message: string, meta?: unknown): string {
  const timestamp = new Date().toISOString();
  const metaStr = meta !== undefined ? ` ${JSON.stringify(meta)}` : "";
  return `[${timestamp}] [${prefix}] ${message}${metaStr}`;
}

export function createLogger(prefix: string) {
  return {
    debug(message: string, meta?: unknown) {
      if (shouldLog("debug")) console.debug(formatMessage(prefix, message, meta));
    },
    info(message: string, meta?: unknown) {
      if (shouldLog("info")) console.info(formatMessage(prefix, message, meta));
    },
    warn(message: string, meta?: unknown) {
      if (shouldLog("warn")) console.warn(formatMessage(prefix, message, meta));
    },
    error(message: string, meta?: unknown) {
      if (shouldLog("error")) console.error(formatMessage(prefix, message, meta));
    },
  };
}

export const logger = createLogger("integrations");
