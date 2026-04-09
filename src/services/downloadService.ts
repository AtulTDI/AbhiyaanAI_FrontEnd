import * as voterApi from '../api/voterApi';
import { isDatabaseReady } from '../db/database';
import { voterRepository } from '../db/voterRepository';
import { logger } from '../utils/logger';
import { isOnline } from './networkService';

const BATCH_SIZE = 200;

export const downloadVoters = async (): Promise<void> => {
  if (!isDatabaseReady()) {
    logger.error('downloadVoters: DB not ready');
    return;
  }

  const online = await isOnline();
  if (!online) {
    logger.log('downloadVoters: skipped — offline');
    return;
  }

  let currentPage = 1;
  let totalDownloaded = 0;
  let hasMorePages = true;

  logger.log('Starting voter download');

  while (hasMorePages) {
    const response = await voterApi.getVotersByCategory(
      currentPage,
      BATCH_SIZE,
      undefined, // searchText
      undefined, // age
      undefined, // gender
      'fullname', // searchType
      0, // type = All
      undefined, // supportColor
      undefined, // surname
      undefined, // casteId
      undefined, // booth
      undefined // booth address
    );

    const apiData = response.data;
    const voters = apiData.data ?? [];

    if (voters.length > 0) {
      await voterRepository.upsertMany(voters);
      totalDownloaded += voters.length;
      logger.log(`Downloaded ${totalDownloaded} / ${apiData.totalRecords} voters`);
    }

    hasMorePages = voters.length === BATCH_SIZE && totalDownloaded < apiData.totalRecords;

    currentPage += 1;
  }

  logger.log(`Voter download complete. Total: ${totalDownloaded}`);
};
