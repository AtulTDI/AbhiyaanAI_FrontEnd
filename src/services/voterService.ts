import * as voterApi from '../api/voterApi';
import { voterRepository } from '../db/voterRepository';
import { offlineQuery } from '../offline/offlineEngine';
import { offlineMutation } from '../offline/offlineMutation';
import type {
  GetPaginatedVoters,
  Voter,
  VoterQueryParams,
  VoterQueryResult
} from '../types/Voter';
import { logger } from '../utils/logger';

export const voterService = {
  getVoters: (params: VoterQueryParams): Promise<VoterQueryResult> =>
    offlineQuery<VoterQueryResult, { data: Voter[]; total: number }>({
      localFetch: async () => {
        const result = await voterRepository.getVoters(params);
        logger.log(
          `[voterService.getVoters] local DB returned ${result.data.length} voters (total: ${result.total})`
        );
        return result;
      },

      remoteFetch: async () => {
        logger.log('[voterService.getVoters] fetching from API...');
        const response = await voterApi.getVoters(
          params.page ?? 1,
          params.pageSize ?? 50,
          params.searchText
        );
        const apiData = response.data as GetPaginatedVoters;
        logger.log(
          `[voterService.getVoters] API returned ${apiData.data.length} voters (total: ${apiData.totalRecords})`
        );
        return { data: apiData.data, total: apiData.totalRecords };
      },

      onRemoteSuccess: async (remoteResult) => {
        logger.log(
          `[voterService.getVoters] upserting ${remoteResult.data.length} voters into local DB...`
        );
        await voterRepository.upsertMany(remoteResult.data);
        logger.log('[voterService.getVoters] local DB upsert complete');
      },

      transformRemote: (_remoteResult) => {
        logger.log(
          '[voterService.getVoters] reading fresh data from local DB after upsert...'
        );
        return voterRepository.getVoters(params);
      }
    }),

  getVoterById: (voterId: string): Promise<Voter | null> =>
    offlineQuery<Voter | null, Voter | null>({
      localFetch: async () => {
        const voter = await voterRepository.getById(voterId);
        if (voter) {
          logger.log(`[voterService.getVoterById] found in local DB: ${voter.fullName}`);
        } else {
          logger.log(
            `[voterService.getVoterById] not found in local DB for id: ${voterId}`
          );
        }
        return voter as unknown as Voter | null;
      },

      remoteFetch: async () => {
        logger.log(`[voterService.getVoterById] fetching from API for id: ${voterId}`);
        const response = await voterApi.getVoterById(voterId);
        const voter = (response.data as Voter) ?? null;
        logger.log(
          `[voterService.getVoterById] API returned: ${voter?.fullName ?? 'null'}`
        );
        return voter;
      },

      onRemoteSuccess: async (voter) => {
        if (voter !== null) {
          logger.log(
            `[voterService.getVoterById] saving full voter detail to local DB: ${voter.fullName}`
          );
          await voterRepository.upsertOne(voter);
          logger.log('[voterService.getVoterById] local DB upsert complete');
        }
      }
    }),

  updateMobileNumber: (voterId: string, mobileNumber: string): Promise<void> =>
    offlineMutation({
      localUpdate: async () => {
        logger.log(
          `[voterService.updateMobileNumber] saving mobile to local DB — voterId: ${voterId}, mobile: ${mobileNumber}`
        );
        await voterRepository.update(voterId, { mobileNumber });
        logger.log('[voterService.updateMobileNumber] local DB updated');
      },

      remoteCall: async () => {
        logger.log(
          `[voterService.updateMobileNumber] calling API for voterId: ${voterId}`
        );
        await voterApi.updateMobileNumber(voterId, mobileNumber);
        logger.log('[voterService.updateMobileNumber] API call success');
      },

      queueType: 'voter_update_mobile',
      recordId: voterId,
      queuePayload: { mobileNumber } as Record<string, unknown>
    }),

  updateStarVoter: (voterId: string, isStarVoter: boolean): Promise<void> =>
    offlineMutation({
      localUpdate: async () => {
        logger.log(
          `[voterService.updateStarVoter] updating local DB — voterId: ${voterId}, isStarVoter: ${isStarVoter}`
        );
        await voterRepository.update(voterId, { isStarVoter: isStarVoter ? 1 : 0 });
        logger.log('[voterService.updateStarVoter] local DB updated');
      },

      remoteCall: async () => {
        logger.log(`[voterService.updateStarVoter] calling API for voterId: ${voterId}`);
        await voterApi.updateStarVoter(voterId, isStarVoter);
        logger.log('[voterService.updateStarVoter] API call success');
      },

      queueType: 'voter_update_star',
      recordId: voterId,
      queuePayload: { isStarVoter } as Record<string, unknown>
    }),

  verifyVoter: (voterId: string, isVerified: boolean): Promise<void> =>
    offlineMutation({
      localUpdate: async () => {
        logger.log(
          `[voterService.verifyVoter] updating local DB — voterId: ${voterId}, isVerified: ${isVerified}`
        );
        await voterRepository.update(voterId, { isVerified: isVerified ? 1 : 0 });
        logger.log('[voterService.verifyVoter] local DB updated');
      },

      remoteCall: async () => {
        logger.log(`[voterService.verifyVoter] calling API for voterId: ${voterId}`);
        await voterApi.verifyVoter(voterId, isVerified);
        logger.log('[voterService.verifyVoter] API call success');
      },

      queueType: 'voter_verify',
      recordId: voterId,
      queuePayload: { isVerified } as Record<string, unknown>
    })
};
