// src/services/surveyService.ts

import * as surveyApi from '../api/voterSurveyApi';
import { surveyRepository } from '../db/surveyRepository';
import { offlineQuery } from '../offline/offlineEngine';
import { offlineMutation } from '../offline/offlineMutation';
import type { Survey } from '../types/Voter';
import { logger } from '../utils/logger';

export const surveyService = {
  getSurveyByVoterId: (voterId: string): Promise<Survey | null> =>
    offlineQuery<Survey | null, Survey | null>({
      localFetch: async () => {
        const survey = await surveyRepository.getSurveyByVoterId(voterId);
        if (survey) {
          logger.log(
            `[surveyService.getSurveyByVoterId] LOCAL DB found — voterId: ${voterId}`
          );
          logger.log(
            `[surveyService.getSurveyByVoterId] LOCAL DB data:`,
            JSON.stringify(survey)
          );
        } else {
          logger.log(
            `[surveyService.getSurveyByVoterId] LOCAL DB empty — voterId: ${voterId}`
          );
        }
        return survey;
      },

      remoteFetch: async () => {
        logger.log(
          `[surveyService.getSurveyByVoterId] API fetching — voterId: ${voterId}`
        );
        const response = await surveyApi.getSurveyByVoterId(voterId);
        const survey = response.data ?? null;
        if (survey) {
          logger.log(
            `[surveyService.getSurveyByVoterId] API returned — surveyId: ${survey.id}`
          );
          logger.log(
            `[surveyService.getSurveyByVoterId] API data:`,
            JSON.stringify(survey)
          );
        } else {
          logger.log(`[surveyService.getSurveyByVoterId] API returned null`);
        }
        return survey;
      },

      onRemoteSuccess: async (survey) => {
        if (survey === null) return;

        const localSurvey = await surveyRepository.getSurveyByVoterId(voterId);

        if (localSurvey && localSurvey.isSynced === 0) {
          logger.log(
            `[surveyService.getSurveyByVoterId] LOCAL has unsynced changes (isSynced=0) — skipping API overwrite`
          );
          logger.log(
            `[surveyService.getSurveyByVoterId] keeping local data:`,
            JSON.stringify(localSurvey)
          );
          return;
        }

        logger.log(`[surveyService.getSurveyByVoterId] saving API response to LOCAL DB`);
        await surveyRepository.upsertSurvey(survey);
        logger.log(`[surveyService.getSurveyByVoterId] LOCAL DB save complete`);
      },

      transformRemote: async (_survey) => {
        const localSurvey = await surveyRepository.getSurveyByVoterId(voterId);
        logger.log(
          `[surveyService.getSurveyByVoterId] transformRemote reading LOCAL DB — result:`,
          JSON.stringify(localSurvey)
        );
        return localSurvey;
      }
    }),

  addSurvey: (payload: Survey): Promise<void> =>
    offlineMutation({
      localUpdate: async () => {
        logger.log(
          `[surveyService.addSurvey] saving to LOCAL DB — voterId: ${payload.voterId}`
        );
        logger.log(`[surveyService.addSurvey] payload:`, JSON.stringify(payload));
        await surveyRepository.updateSurveyLocally(payload.voterId, {
          supportType: payload.supportType,
          supportStrength: payload.supportStrength,
          casteId: payload.casteId ?? null,
          otherCaste: payload.otherCaste ?? null,
          remarks: payload.remarks ?? null,
          needsFollowUp: payload.needsFollowUp ? 1 : 0,
          voterDied: payload.voterDied ? 1 : 0,
          isVoted: payload.isVoted ? 1 : 0,
          newAddress: payload.newAddress ?? null,
          society: payload.society ?? null,
          flatNumber: payload.flatNumber ?? null,
          email: payload.email ?? null,
          secondaryMobileNumber: payload.secondaryMobileNumber ?? null,
          dateOfBirth: payload.dateOfBirth ?? null,
          specialVisitDone: payload.specialVisitDone ? 1 : 0,
          specialVisitDate: payload.specialVisitDate ?? null,
          specialVisitRemarks: payload.specialVisitRemarks ?? null,
          surveyedByUserId: payload.surveyedByUserId ?? null
        });
        const saved = await surveyRepository.getSurveyByVoterId(payload.voterId);
        logger.log(
          `[surveyService.addSurvey] LOCAL DB after save:`,
          JSON.stringify(saved)
        );
      },

      remoteCall: async () => {
        logger.log(`[surveyService.addSurvey] calling API — voterId: ${payload.voterId}`);
        const response = await surveyApi.addSurvey(payload);
        const surveyId = response.data?.id;
        if (surveyId) {
          logger.log(
            `[surveyService.addSurvey] API returned surveyId: ${surveyId} — saving to LOCAL DB`
          );
          await surveyRepository.updateSurveyLocally(payload.voterId, { id: surveyId });
          logger.log(`[surveyService.addSurvey] surveyId saved to LOCAL DB`);
        }
        logger.log(`[surveyService.addSurvey] API call success`);
      },

      queueType: 'survey_add',
      recordId: payload.voterId,
      queuePayload: { ...payload } as Record<string, unknown>
    }),

  updateSurvey: (surveyId: string, payload: Survey): Promise<void> =>
    offlineMutation({
      localUpdate: async () => {
        logger.log(
          `[surveyService.updateSurvey] saving to LOCAL DB — voterId: ${payload.voterId}`
        );
        logger.log(`[surveyService.updateSurvey] payload:`, JSON.stringify(payload));
        await surveyRepository.updateSurveyLocally(payload.voterId, {
          supportType: payload.supportType,
          supportStrength: payload.supportStrength,
          casteId: payload.casteId ?? null,
          otherCaste: payload.otherCaste ?? null,
          remarks: payload.remarks ?? null,
          needsFollowUp: payload.needsFollowUp ? 1 : 0,
          voterDied: payload.voterDied ? 1 : 0,
          isVoted: payload.isVoted ? 1 : 0,
          newAddress: payload.newAddress ?? null,
          society: payload.society ?? null,
          flatNumber: payload.flatNumber ?? null,
          email: payload.email ?? null,
          secondaryMobileNumber: payload.secondaryMobileNumber ?? null,
          dateOfBirth: payload.dateOfBirth ?? null,
          specialVisitDone: payload.specialVisitDone ? 1 : 0,
          specialVisitDate: payload.specialVisitDate ?? null,
          specialVisitRemarks: payload.specialVisitRemarks ?? null,
          surveyedByUserId: payload.surveyedByUserId ?? null
        });
        const saved = await surveyRepository.getSurveyByVoterId(payload.voterId);
        logger.log(
          `[surveyService.updateSurvey] LOCAL DB after save:`,
          JSON.stringify(saved)
        );
      },

      remoteCall: async () => {
        logger.log(`[surveyService.updateSurvey] calling API — surveyId: ${surveyId}`);
        await surveyApi.updateSurvey(surveyId, payload);
        logger.log(`[surveyService.updateSurvey] API call success`);
      },

      queueType: 'survey_update',
      recordId: surveyId,
      queuePayload: { surveyId, ...payload } as Record<string, unknown>
    })
};
