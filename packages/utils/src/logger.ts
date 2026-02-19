type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const WEIGHTS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

function minLevel(): LogLevel {
  const env = process.env.LOG_LEVEL as LogLevel | undefined;
  if (env && env in WEIGHTS) return env;
  return process.env.NODE_ENV === 'production' ? 'info' : 'debug';
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  ns: string;
  msg: string;
  data?: unknown;
}

function emit(entry: LogEntry): void {
  const isProd = process.env.NODE_ENV === 'production';

  if (isProd) {
    // Structured JSON — one line per event, friendly to Netlify's log viewer
    const line = JSON.stringify(entry);
    if (entry.level === 'error') console.error(line);
    else if (entry.level === 'warn') console.warn(line);
    else console.log(line);
  } else {
    // Pretty-printed for local development
    const { timestamp, level, ns, msg, data } = entry;
    const prefix = `[${timestamp}] ${level.toUpperCase().padEnd(5)} [${ns}]`;
    const args: unknown[] = data !== undefined ? [prefix, msg, data] : [prefix, msg];
    if (level === 'error') console.error(...args);
    else if (level === 'warn') console.warn(...args);
    else console.log(...args);
  }
}

export type Logger = {
  debug: (msg: string, data?: unknown) => void;
  info: (msg: string, data?: unknown) => void;
  warn: (msg: string, data?: unknown) => void;
  error: (msg: string, data?: unknown) => void;
};

/**
 * Creates a namespaced logger.
 *
 * Namespace convention:
 *   api:<route>           — Next.js route handlers
 *   webhook:<provider>    — External webhook handlers
 *   netlify:<function>    — Netlify scheduled functions
 *   core:<module>         — packages/core business logic
 *
 * Log level is controlled by the LOG_LEVEL env var.
 * Defaults to 'debug' in development, 'info' in production.
 */
export function createLogger(namespace: string): Logger {
  const min = minLevel();

  function log(level: LogLevel, msg: string, data?: unknown): void {
    if (WEIGHTS[level] < WEIGHTS[min]) return;
    emit({
      timestamp: new Date().toISOString(),
      level,
      ns: namespace,
      msg,
      ...(data !== undefined ? { data } : {}),
    });
  }

  return {
    debug: (msg, data) => log('debug', msg, data),
    info: (msg, data) => log('info', msg, data),
    warn: (msg, data) => log('warn', msg, data),
    error: (msg, data) => log('error', msg, data),
  };
}
