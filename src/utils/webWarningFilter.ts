import { Platform } from 'react-native';

import { logger } from './logger';

const SUPPRESSED_WARNINGS = [
  'pointerEvents',
  'useNativeDriver',
  'shadow*',
  'boxShadow',
  'expo-av',
  'Expo AV has been deprecated'
];

const shouldSuppress = (args: unknown[]): boolean => {
  const message = args
    .map((arg) => {
      if (typeof arg === 'string') return arg;
      if (arg instanceof Error) return arg.message;

      return '';
    })
    .join(' ');

  return SUPPRESSED_WARNINGS.some((warning) => message.includes(warning));
};

if (Platform.OS === 'web' && process.env.NODE_ENV === 'development') {
  const originalError = logger.error;
  const originalWarn = logger.warn;

  globalThis.console.error = (...args: unknown[]) => {
    if (shouldSuppress(args)) return;
    originalError(...args);
  };

  globalThis.console.warn = (...args: unknown[]) => {
    if (shouldSuppress(args)) return;
    originalWarn(...args);
  };
}
