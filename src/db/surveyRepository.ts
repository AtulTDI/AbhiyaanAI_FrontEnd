import type { Survey } from '../types/Voter';
import { logger } from '../utils/logger';
import { withDB } from './dbHelper';

const mapRowToSurveyLocal = (row: Record<string, unknown>): Survey => ({
  id: row.id as string | null,
  voterId: row.voterId as string,
  supportType: row.supportType as number | null,
  supportStrength: row.supportStrength as number | null,
  dateOfBirth: row.dateOfBirth as string | null,
  remarks: row.remarks as string | null,
  email: row.email as string | null,
  secondaryMobileNumber: row.secondaryMobileNumber as string | null,
  newAddress: row.newAddress as string | null,
  society: row.society as string | null,
  flatNumber: row.flatNumber as string | null,
  casteId: row.casteId as string | null,
  otherCaste: row.otherCaste as string | null,
  needsFollowUp: Boolean(row.needsFollowUp),
  voterDied: Boolean(row.voterDied),
  isVoted: Boolean(row.isVoted),
  specialVisitDone: Boolean(row.specialVisitDone),
  specialVisitDate: row.specialVisitDate as string | null,
  specialVisitRemarks: row.specialVisitRemarks as string | null,
  specialVisitUserId: row.specialVisitUserId as string | null,
  surveyedByUserId: row.surveyedByUserId as string | null,
  surveyedAt: row.surveyedAt as string | null,
  isSynced: row.isSynced as number,
  updatedAt: row.updatedAt as string | null
});

export const surveyRepository = {
  getSurveyByVoterId: (voterId: string): Promise<Survey | null> =>
    withDB(async (db) => {
      const row = await db.getFirstAsync<Record<string, unknown>>(
        `SELECT * FROM surveys WHERE voterId = ?`,
        [voterId]
      );
      return row ? mapRowToSurveyLocal(row) : null;
    }) as Promise<Survey | null>,

  upsertSurvey: (survey: Survey): Promise<void> =>
    withDB(async (db) => {
      await db.runAsync(
        `INSERT OR REPLACE INTO surveys (
          id, voterId, supportType, supportStrength,
          dateOfBirth, remarks, email, secondaryMobileNumber,
          newAddress, society, flatNumber, casteId, otherCaste,
          needsFollowUp, voterDied, isVoted,
          specialVisitDone, specialVisitDate, specialVisitRemarks,
          specialVisitUserId, surveyedByUserId, surveyedAt,
          isSynced, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
        [
          survey.id ?? null,
          survey.voterId,
          survey.supportType ?? null,
          survey.supportStrength ?? null,
          survey.dateOfBirth ?? null,
          survey.remarks ?? null,
          survey.email ?? null,
          survey.secondaryMobileNumber ?? null,
          survey.newAddress ?? null,
          survey.society ?? null,
          survey.flatNumber ?? null,
          survey.casteId ?? null,
          survey.otherCaste ?? null,
          survey.needsFollowUp ? 1 : 0,
          survey.voterDied ? 1 : 0,
          survey.isVoted ? 1 : 0,
          survey.specialVisitDone ? 1 : 0,
          survey.specialVisitDate ?? null,
          survey.specialVisitRemarks ?? null,
          survey.specialVisitUserId ?? null,
          survey.surveyedByUserId ?? null,
          survey.surveyedAt ?? null,
          new Date().toISOString()
        ]
      );
    }) as Promise<void>,

  updateSurveyLocally: (voterId: string, payload: Partial<Survey>): Promise<void> =>
    withDB(async (db) => {
      await db.runAsync(
        `INSERT OR REPLACE INTO surveys (
          id, voterId, supportType, supportStrength,
          dateOfBirth, remarks, email, secondaryMobileNumber,
          newAddress, society, flatNumber, casteId, otherCaste,
          needsFollowUp, voterDied, isVoted,
          specialVisitDone, specialVisitDate, specialVisitRemarks,
          specialVisitUserId, surveyedByUserId, surveyedAt,
          isSynced, updatedAt
        ) VALUES (
          COALESCE((SELECT id FROM surveys WHERE voterId = ?), NULL),
          ?,
          COALESCE(?, (SELECT supportType FROM surveys WHERE voterId = ?)),
          COALESCE(?, (SELECT supportStrength FROM surveys WHERE voterId = ?)),
          COALESCE(?, (SELECT dateOfBirth FROM surveys WHERE voterId = ?)),
          COALESCE(?, (SELECT remarks FROM surveys WHERE voterId = ?)),
          COALESCE(?, (SELECT email FROM surveys WHERE voterId = ?)),
          COALESCE(?, (SELECT secondaryMobileNumber FROM surveys WHERE voterId = ?)),
          COALESCE(?, (SELECT newAddress FROM surveys WHERE voterId = ?)),
          COALESCE(?, (SELECT society FROM surveys WHERE voterId = ?)),
          COALESCE(?, (SELECT flatNumber FROM surveys WHERE voterId = ?)),
          COALESCE(?, (SELECT casteId FROM surveys WHERE voterId = ?)),
          COALESCE(?, (SELECT otherCaste FROM surveys WHERE voterId = ?)),
          COALESCE(?, (SELECT needsFollowUp FROM surveys WHERE voterId = ?)),
          COALESCE(?, (SELECT voterDied FROM surveys WHERE voterId = ?)),
          COALESCE(?, (SELECT isVoted FROM surveys WHERE voterId = ?)),
          COALESCE(?, (SELECT specialVisitDone FROM surveys WHERE voterId = ?)),
          COALESCE(?, (SELECT specialVisitDate FROM surveys WHERE voterId = ?)),
          COALESCE(?, (SELECT specialVisitRemarks FROM surveys WHERE voterId = ?)),
          COALESCE(?, (SELECT specialVisitUserId FROM surveys WHERE voterId = ?)),
          COALESCE(?, (SELECT surveyedByUserId FROM surveys WHERE voterId = ?)),
          COALESCE(?, (SELECT surveyedAt FROM surveys WHERE voterId = ?)),
          0,
          ?
        )`,
        [
          voterId,
          voterId,
          payload.supportType ?? null,
          voterId,
          payload.supportStrength ?? null,
          voterId,
          payload.dateOfBirth ?? null,
          voterId,
          payload.remarks ?? null,
          voterId,
          payload.email ?? null,
          voterId,
          payload.secondaryMobileNumber ?? null,
          voterId,
          payload.newAddress ?? null,
          voterId,
          payload.society ?? null,
          voterId,
          payload.flatNumber ?? null,
          voterId,
          payload.casteId ?? null,
          voterId,
          payload.otherCaste ?? null,
          voterId,
          // boolean → 0/1 for SQLite, null means keep existing value
          payload.needsFollowUp !== undefined ? (payload.needsFollowUp ? 1 : 0) : null,
          voterId,
          payload.voterDied !== undefined ? (payload.voterDied ? 1 : 0) : null,
          voterId,
          payload.isVoted !== undefined ? (payload.isVoted ? 1 : 0) : null,
          voterId,
          payload.specialVisitDone !== undefined
            ? payload.specialVisitDone
              ? 1
              : 0
            : null,
          voterId,
          payload.specialVisitDate ?? null,
          voterId,
          payload.specialVisitRemarks ?? null,
          voterId,
          payload.specialVisitUserId ?? null,
          voterId,
          payload.surveyedByUserId ?? null,
          voterId,
          payload.surveyedAt ?? null,
          voterId,
          new Date().toISOString()
        ]
      );
    }) as Promise<void>,

  getUnsynced: (): Promise<Survey[]> =>
    withDB(async (db) => {
      const rows = await db.getAllAsync<Record<string, unknown>>(
        `SELECT * FROM surveys WHERE isSynced = 0`
      );
      return rows.map(mapRowToSurveyLocal);
    }) as Promise<Survey[]>
};

export const debugGetAllSurveys = (): Promise<Survey[]> =>
  withDB(async (db) => {
    const rows = await db.getAllAsync<Record<string, unknown>>(
      `SELECT * FROM surveys LIMIT 50`
    );
    const surveys = rows.map(mapRowToSurveyLocal);
    logger.log('LOCAL DB SURVEYS:', surveys);
    return surveys;
  }) as Promise<Survey[]>;
