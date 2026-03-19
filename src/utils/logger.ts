type LoggerMethod = (...args: unknown[]) => void;

const createLoggerMethod = (method: 'debug' | 'error' | 'log' | 'warn'): LoggerMethod => {
  const consoleMethod = globalThis.console?.[method];

  if (typeof consoleMethod !== 'function') {
    return () => undefined;
  }

  return consoleMethod.bind(globalThis.console);
};

export const logger = {
  debug: createLoggerMethod('debug'),
  error: createLoggerMethod('error'),
  log: createLoggerMethod('log'),
  warn: createLoggerMethod('warn')
} as const;
