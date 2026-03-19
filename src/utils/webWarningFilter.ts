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

const shouldSuppress = (args: unknown[]): boolean =>
  SUPPRESSED_WARNINGS.some((w) => (args[0] as string)?.includes?.(w));

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
