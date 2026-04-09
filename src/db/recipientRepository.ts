import type {
  RecipientLocal,
  RecipientQueryParams,
  RecipientQueryResult
} from '../types/Recipient';
import { withDB } from './dbHelper';

export const recipientRepository = {
  getRecipients: (params: RecipientQueryParams): Promise<RecipientQueryResult> =>
    withDB(async (db) => {
      const page = params.page ?? 1;
      const pageSize = params.pageSize ?? 50;
      const offset = (page - 1) * pageSize;

      if (params.searchText) {
        const searchPattern = `%${params.searchText}%`;

        const recipients = await db.getAllAsync<RecipientLocal>(
          `SELECT * FROM recipients
           WHERE fullName LIKE ?
           ORDER BY fullName
           LIMIT ? OFFSET ?`,
          [searchPattern, pageSize, offset]
        );

        const countResult = await db.getFirstAsync<{ total: number }>(
          `SELECT COUNT(*) as total FROM recipients WHERE fullName LIKE ?`,
          [searchPattern]
        );

        return { data: recipients, total: countResult?.total ?? 0 };
      }

      const recipients = await db.getAllAsync<RecipientLocal>(
        `SELECT * FROM recipients ORDER BY fullName LIMIT ? OFFSET ?`,
        [pageSize, offset]
      );

      const countResult = await db.getFirstAsync<{ total: number }>(
        `SELECT COUNT(*) as total FROM recipients`
      );

      return { data: recipients, total: countResult?.total ?? 0 };
    }),

  upsertMany: (items: RecipientLocal[]): Promise<void> =>
    withDB(async (db) => {
      if (!items.length) return;

      await db.execAsync('BEGIN TRANSACTION');

      try {
        for (const item of items) {
          await db.runAsync(
            `INSERT OR REPLACE INTO recipients (id, fullName, phoneNumber, isSynced)
             VALUES (?, ?, ?, 1)`,
            [item.id, item.fullName ?? null, item.phoneNumber ?? null]
          );
        }

        await db.execAsync('COMMIT');
      } catch (error) {
        await db.execAsync('ROLLBACK');
        throw error;
      }
    }),

  insert: (data: Pick<RecipientLocal, 'fullName' | 'phoneNumber'>): Promise<string> =>
    withDB(async (db) => {
      const newId = `${Date.now()}-${Math.random()}`;

      await db.runAsync(
        `INSERT INTO recipients (id, fullName, phoneNumber, isSynced)
         VALUES (?, ?, ?, 0)`,
        [newId, data.fullName ?? null, data.phoneNumber ?? null]
      );

      return newId;
    }),

  update: (
    recipientId: string,
    updates: Pick<RecipientLocal, 'fullName' | 'phoneNumber'>
  ): Promise<void> =>
    withDB(async (db) => {
      await db.runAsync(
        `UPDATE recipients
         SET fullName = ?, phoneNumber = ?, isSynced = 0
         WHERE id = ?`,
        [updates.fullName ?? null, updates.phoneNumber ?? null, recipientId]
      );
    }),

  remove: (recipientId: string): Promise<void> =>
    withDB(async (db) => {
      await db.runAsync(`DELETE FROM recipients WHERE id = ?`, [recipientId]);
    })
};
