import { Platform } from 'react-native';

import * as SQLite from 'expo-sqlite';

let database: SQLite.SQLiteDatabase | null = null;
let isDBReady = false;

export const initDB = async (): Promise<void> => {
  if (Platform.OS === 'web') return;

  database = await SQLite.openDatabaseAsync('abhiyan.db');

  await database.execAsync(`
  CREATE TABLE IF NOT EXISTS voters (
    id TEXT PRIMARY KEY NOT NULL,
    rank INTEGER,
    fullName TEXT,
    normalizedName TEXT,
    phoneticName TEXT,
    fatherHusbandName TEXT,
    age INTEGER,
    gender TEXT,
    listArea TEXT,
    assemblyConstituencyDetails TEXT,
    address TEXT,
    houseNumber TEXT,
    prabagNumber INTEGER,
    mobileNumber TEXT,
    votingRoomNumber TEXT,
    votingDateAndTime TEXT,
    votingBoothAddress TEXT,
    epicId TEXT,
    isStarVoter INTEGER DEFAULT 0,
    isVerified INTEGER DEFAULT 0,
    updatedAt TEXT,
    isSynced INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS recipients (
    id TEXT PRIMARY KEY NOT NULL,
    fullName TEXT,
    phoneNumber TEXT,
    isSynced INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS sync_queue (
    id TEXT PRIMARY KEY NOT NULL,
    type TEXT NOT NULL,
    payload TEXT NOT NULL,
    createdAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS surveys (
    id TEXT,
    voterId TEXT PRIMARY KEY NOT NULL,
    supportType INTEGER,
    supportStrength INTEGER,
    dateOfBirth TEXT,
    remarks TEXT,
    email TEXT,
    secondaryMobileNumber TEXT,
    newAddress TEXT,
    society TEXT,
    flatNumber TEXT,
    casteId TEXT,
    otherCaste TEXT,
    needsFollowUp INTEGER DEFAULT 0,
    voterDied INTEGER DEFAULT 0,
    isVoted INTEGER DEFAULT 0,
    specialVisitDone INTEGER DEFAULT 0,
    specialVisitDate TEXT,
    specialVisitRemarks TEXT,
    specialVisitUserId TEXT,
    surveyedByUserId TEXT,
    surveyedAt TEXT,
    isSynced INTEGER DEFAULT 1,
    updatedAt TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_voters_fullName ON voters(fullName);
  CREATE INDEX IF NOT EXISTS idx_voters_listArea ON voters(listArea);
  CREATE INDEX IF NOT EXISTS idx_voters_epicId ON voters(epicId);
  CREATE INDEX IF NOT EXISTS idx_recipients_fullName ON recipients(fullName);
  CREATE INDEX IF NOT EXISTS idx_surveys_voterId ON surveys(voterId);
`);

  isDBReady = true;
};

export const getDB = (): SQLite.SQLiteDatabase => {
  if (Platform.OS === 'web') {
    throw new Error('SQLite is not supported on web.');
  }

  if (!database) {
    throw new Error('Database not initialized. Call initDB() before using the database.');
  }

  return database;
};

export const isDatabaseReady = (): boolean => isDBReady;
