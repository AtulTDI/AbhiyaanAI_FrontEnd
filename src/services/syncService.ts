import * as recipientApi from '../api/recipientApi';
import * as voterApi from '../api/voterApi';
import * as surveyApi from '../api/voterSurveyApi';
import { isDatabaseReady } from '../db/database';
import { syncQueueRepository } from '../db/syncQueueRepository';
import type { CreateRecipientPayload, EditRecipientPayload } from '../types/Recipient';
import type { SyncQueuePayload } from '../types/SyncQueue';
import type { VoterSurveyRequest } from '../types/Voter';
import { logger } from '../utils/logger';
import { isOnline } from './networkService';

export const syncData = async (): Promise<void> => {
  if (!isDatabaseReady()) {
    logger.log('[syncService] DB not ready — skipping');
    return;
  }

  const online = await isOnline();
  if (!online) {
    logger.log('[syncService] offline — skipping');
    return;
  }

  const pendingItems = await syncQueueRepository.getPendingItems();

  if (!pendingItems.length) {
    logger.log('[syncService] no pending items');
    return;
  }

  logger.log(`[syncService] starting sync — ${pendingItems.length} items pending`);

  for (const item of pendingItems) {
    try {
      const payload = JSON.parse(item.payload) as SyncQueuePayload;
      const { recordId, ...rest } = payload;

      logger.log(`[syncService] syncing — type: ${item.type}, recordId: ${recordId}`);

      switch (item.type) {
        case 'voter_update_mobile':
          await voterApi.updateMobileNumber(recordId, rest.mobileNumber as string);
          break;

        case 'voter_update_star':
          await voterApi.updateStarVoter(recordId, rest.isStarVoter as boolean);
          break;

        case 'voter_verify':
          await voterApi.verifyVoter(recordId, rest.isVerified as boolean);
          break;

        case 'recipient_create':
          await recipientApi.createRecipient(rest as CreateRecipientPayload);
          break;

        case 'recipient_update':
          await recipientApi.editRecipientById(recordId, rest as EditRecipientPayload);
          break;

        case 'recipient_delete':
          await recipientApi.deleteRecipientById(recordId);
          break;

        case 'survey_add':
          await surveyApi.addSurvey(rest as unknown as VoterSurveyRequest);
          break;

        case 'survey_update':
          logger.log(`[syncService] survey_update — surveyId: ${recordId}`);
          await surveyApi.updateSurvey(recordId, rest as unknown as VoterSurveyRequest);
          break;

        default:
          logger.warn(`[syncService] unknown type: ${item.type} — removing`);
          break;
      }

      await syncQueueRepository.removeItem(item.id);
      logger.log(`[syncService] synced — type: ${item.type}, recordId: ${recordId}`);
    } catch (error) {
      logger.error(`[syncService] failed — type: ${item.type}`, error);
    }
  }

  logger.log('[syncService] sync complete');
};
