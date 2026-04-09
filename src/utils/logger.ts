import { Platform } from 'react-native';

type LoggerMethod = (...args: unknown[]) => void;

const isWebProd = Platform.OS === 'web' && !__DEV__;

const createLoggerMethod = (method: 'debug' | 'error' | 'log' | 'warn'): LoggerMethod => {
  if (isWebProd) return () => undefined;

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
