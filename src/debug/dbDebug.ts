import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { withDB } from '../db/dbHelper';
import type { SyncQueueItem } from '../types/SyncQueue';
import type { Voter } from '../types/Voter';
import { logger } from '../utils/logger';

export const debugVoters = (): Promise<Voter[]> =>
  withDB(async (db) => {
    const voters = await db.getAllAsync<Voter>(`SELECT * FROM voters LIMIT 50`);
    logger.log('LOCAL DB VOTERS:', JSON.stringify(voters, null, 2));
    return voters;
  }) as Promise<Voter[]>;

export const debugSyncQueue = (): Promise<SyncQueueItem[]> =>
  withDB(async (db) => {
    const items = await db.getAllAsync<SyncQueueItem>(`SELECT * FROM sync_queue`);
    logger.log('SYNC QUEUE:', JSON.stringify(items, null, 2));
    return items;
  }) as Promise<SyncQueueItem[]>;

export const debugCountVoters = (): Promise<number> =>
  withDB(async (db) => {
    const result = await db.getFirstAsync<{ total: number }>(
      `SELECT COUNT(*) as total FROM voters`
    );
    const count = result?.total ?? 0;
    logger.log('VOTER COUNT:', count);
    return count;
  }) as Promise<number>;

export const exportDB = async (): Promise<void> => {
  try {
    const sourcePath = `${FileSystem.documentDirectory}SQLite/abhiyan.db`;

    const exportPath = `${FileSystem.cacheDirectory}abhiyan-export.db`;

    const sourceInfo = await FileSystem.getInfoAsync(sourcePath);
    if (!sourceInfo.exists) {
      logger.error('exportDB: source DB file not found at', sourcePath);
      return;
    }

    await FileSystem.copyAsync({
      from: sourcePath,
      to: exportPath
    });

    logger.log('DB copied to:', exportPath);

    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      logger.error('exportDB: sharing not available on this device');
      return;
    }

    await Sharing.shareAsync(exportPath, {
      mimeType: 'application/octet-stream',
      dialogTitle: 'Save AbhiyanAI DB'
    });
  } catch (error) {
    logger.error('exportDB failed:', error);
  }
};
