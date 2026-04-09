import type {
  Voter,
  VoterQueryParams,
  VoterQueryResult,
  VoterUpdatePayload
} from '../types/Voter';
import { logger } from '../utils/logger';
import { withDB } from './dbHelper';

const parseAge = (age: number | string | null | undefined): number | null => {
  if (age === null || age === undefined) return null;
  if (typeof age === 'number') return age;
  const parsed = parseInt(age, 10);
  return isNaN(parsed) ? null : parsed;
};

const emptyToNull = (value: string | null | undefined): string | null => {
  if (!value || value.trim() === '') return null;
  return value;
};

export const voterRepository = {
  getVoters: (params: VoterQueryParams): Promise<VoterQueryResult> =>
    withDB(async (db) => {
      const page = params.page ?? 1;
      const pageSize = params.pageSize ?? 50;
      const offset = (page - 1) * pageSize;

      if (params.searchText) {
        const searchPattern = `%${params.searchText}%`;

        const voters = await db.getAllAsync<Voter>(
          `SELECT * FROM voters
           WHERE fullName LIKE ?
           ORDER BY fullName
           LIMIT ? OFFSET ?`,
          [searchPattern, pageSize, offset]
        );

        const countResult = await db.getFirstAsync<{ total: number }>(
          `SELECT COUNT(*) as total FROM voters WHERE fullName LIKE ?`,
          [searchPattern]
        );

        return { data: voters, total: countResult?.total ?? 0 };
      }

      const voters = await db.getAllAsync<Voter>(
        `SELECT * FROM voters ORDER BY fullName LIMIT ? OFFSET ?`,
        [pageSize, offset]
      );

      const countResult = await db.getFirstAsync<{ total: number }>(
        `SELECT COUNT(*) as total FROM voters`
      );

      return { data: voters, total: countResult?.total ?? 0 };
    }) as Promise<VoterQueryResult>,

  upsertMany: (voters: Voter[]): Promise<void> =>
    withDB(async (db) => {
      if (!voters.length) return;

      await db.execAsync('BEGIN TRANSACTION');

      try {
        for (const voter of voters) {
          await db.runAsync(
            `INSERT OR REPLACE INTO voters (
              id, fullName, normalizedName, phoneticName,
              fatherHusbandName, age, gender, listArea,
              address, prabagNumber, epicId,
              isStarVoter, isVerified, updatedAt, isSynced
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
            [
              voter.id,
              voter.fullName,
              null,
              null,
              emptyToNull(voter.fatherHusbandName),
              parseAge(voter.age),
              emptyToNull(voter.gender),
              String(voter.listArea),
              emptyToNull(voter.address),
              voter.prabagNumber,
              voter.epicId ?? null,
              voter.isStarVoter ? 1 : 0,
              voter.isVerified ? 1 : 0,
              new Date().toISOString()
            ]
          );
        }

        await db.execAsync('COMMIT');
      } catch (error) {
        await db.execAsync('ROLLBACK');
        logger.error('voterRepository.upsertMany failed', error);
        throw error;
      }
    }) as Promise<void>,

  upsertOne: (voter: Voter): Promise<void> =>
    withDB(async (db) => {
      await db.runAsync(
        `INSERT OR REPLACE INTO voters (
          id, rank, fullName, normalizedName, phoneticName,
          fatherHusbandName, age, gender, listArea,
          assemblyConstituencyDetails, address, houseNumber,
          prabagNumber, mobileNumber, votingRoomNumber,
          votingDateAndTime, votingBoothAddress, epicId,
          isStarVoter, isVerified, updatedAt, isSynced
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [
          voter.id,
          voter.rank ?? null,
          voter.fullName,
          null,
          null,
          emptyToNull(voter.fatherHusbandName),
          parseAge(voter.age),
          emptyToNull(voter.gender),
          String(voter.listArea),
          voter.assemblyConstituencyDetails ?? null,
          emptyToNull(voter.address),
          emptyToNull(voter.houseNumber),
          voter.prabagNumber,
          voter.mobileNumber ?? null,
          emptyToNull(voter.votingRoomNumber?.toString()),
          emptyToNull(voter.votingDateAndTime),
          emptyToNull(voter.votingBoothAddress),
          voter.epicId ?? null,
          voter.isStarVoter ? 1 : 0,
          voter.isVerified ? 1 : 0,
          new Date().toISOString()
        ]
      );
    }) as Promise<void>,

  update: (voterId: string, updates: VoterUpdatePayload): Promise<void> =>
    withDB(async (db) => {
      await db.runAsync(
        `UPDATE voters SET
           fullName = COALESCE(?, fullName),
           fatherHusbandName = COALESCE(?, fatherHusbandName),
           age = COALESCE(?, age),
           gender = COALESCE(?, gender),
           address = COALESCE(?, address),
           mobileNumber = COALESCE(?, mobileNumber),
           isStarVoter = COALESCE(?, isStarVoter),
           isVerified = COALESCE(?, isVerified),
           isSynced = 0,
           updatedAt = ?
         WHERE id = ?`,
        [
          updates.fullName ?? null,
          updates.fatherHusbandName ?? null,
          updates.age ?? null,
          updates.gender ?? null,
          updates.address ?? null,
          updates.mobileNumber ?? null,
          updates.isStarVoter ?? null,
          updates.isVerified ?? null,
          new Date().toISOString(),
          voterId
        ]
      );
    }) as Promise<void>,

  getById: (voterId: string): Promise<Voter | null> =>
    withDB(async (db) => {
      return db.getFirstAsync<Voter>(`SELECT * FROM voters WHERE id = ?`, [voterId]);
    }) as Promise<Voter | null>,

  getUnsynced: (): Promise<Voter[]> =>
    withDB(async (db) => {
      return db.getAllAsync<Voter>(`SELECT * FROM voters WHERE isSynced = 0`);
    }) as Promise<Voter[]>
};

export const debugGetAllVoters = (): Promise<Voter[]> =>
  withDB(async (db) => {
    const voters = await db.getAllAsync<Voter>(`SELECT * FROM voters LIMIT 50`);
    logger.log('LOCAL DB VOTERS:', voters);
    return voters;
  }) as Promise<Voter[]>;
