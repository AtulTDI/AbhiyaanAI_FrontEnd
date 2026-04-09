import { Platform } from 'react-native';

import { logger } from '../utils/logger';
import { getDB } from './database';

type Database = ReturnType<typeof getDB>;

export const withDB = async <T>(
  callback: (db: Database) => Promise<T>
): Promise<T | null> => {
  if (Platform.OS === 'web') {
    logger.log('withDB: skipped on web');
    return null;
  }

  const db = getDB();

  try {
    return await callback(db);
  } catch (error) {
    logger.error('Database operation failed', error);
    throw error;
  }
};
