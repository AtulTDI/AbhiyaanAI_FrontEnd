import type { SyncQueueItem, SyncQueuePayload } from '../types/SyncQueue';
import { logger } from '../utils/logger';
import { withDB } from './dbHelper';

export const syncQueueRepository = {
  addToQueue: (
    type: string,
    recordId: string,
    payload: Record<string, unknown>
  ): Promise<string> =>
    withDB(async (db) => {
      const queueId = `${Date.now()}-${Math.random()}`;

      const queuePayload: SyncQueuePayload = { recordId, ...payload };

      await db.runAsync(
        `INSERT INTO sync_queue (id, type, payload, createdAt) VALUES (?, ?, ?, ?)`,
        [queueId, type, JSON.stringify(queuePayload), new Date().toISOString()]
      );

      return queueId;
    }),

  getPendingItems: (): Promise<SyncQueueItem[]> =>
    withDB(async (db) => {
      return db.getAllAsync<SyncQueueItem>(
        `SELECT * FROM sync_queue ORDER BY createdAt ASC`
      );
    }),

  removeItem: (queueId: string): Promise<void> =>
    withDB(async (db) => {
      await db.runAsync(`DELETE FROM sync_queue WHERE id = ?`, [queueId]);
    }),

  clearAll: (): Promise<void> =>
    withDB(async (db) => {
      await db.runAsync(`DELETE FROM sync_queue`);
    })
};

export const debugGetSyncQueue = (): Promise<SyncQueueItem[]> =>
  withDB(async (db) => {
    const items = await db.getAllAsync<SyncQueueItem>(`SELECT * FROM sync_queue`);
    logger.log('SYNC QUEUE:', items);
    return items;
  });
