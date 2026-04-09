import * as recipientApi from '../api/recipientApi';
import { recipientRepository } from '../db/recipientRepository';
import { offlineQuery } from '../offline/offlineEngine';
import { offlineMutation } from '../offline/offlineMutation';
import type {
  CreateRecipientPayload,
  EditRecipientPayload,
  RecipientLocal,
  RecipientQueryResult
} from '../types/Recipient';

export const recipientService = {
  getRecipients: (
    page: number,
    pageSize: number,
    searchText: string
  ): Promise<RecipientQueryResult> =>
    offlineQuery<RecipientQueryResult>({
      localFetch: () => recipientRepository.getRecipients({ page, pageSize, searchText }),

      remoteFetch: async () => {
        const response = await recipientApi.getRecipients(page, pageSize, searchText);
        const apiData = response.data;
        return {
          data: apiData.items as RecipientLocal[],
          total: apiData.totalRecords
        };
      },

      onRemoteSuccess: async (result) => {
        await recipientRepository.upsertMany(result.data);
      }
    }),

  createRecipient: (data: CreateRecipientPayload): Promise<void> =>
    offlineMutation({
      localUpdate: () =>
        recipientRepository
          .insert({
            fullName: data.fullName,
            phoneNumber: data.phoneNumber
          })
          .then(() => undefined),

      remoteCall: () => recipientApi.createRecipient(data).then(() => undefined),

      queueType: 'recipient_create',
      recordId: Date.now().toString(),
      queuePayload: data as Record<string, unknown>
    }),

  editRecipient: (recipientId: string, data: EditRecipientPayload): Promise<void> =>
    offlineMutation({
      localUpdate: () =>
        recipientRepository.update(recipientId, {
          fullName: data.fullName ?? null,
          phoneNumber: data.phoneNumber ?? null
        }),

      remoteCall: () =>
        recipientApi.editRecipientById(recipientId, data).then(() => undefined),

      queueType: 'recipient_update',
      recordId: recipientId,
      queuePayload: data as Record<string, unknown>
    }),

  deleteRecipient: (recipientId: string): Promise<void> =>
    offlineMutation({
      localUpdate: () => recipientRepository.remove(recipientId),

      remoteCall: () =>
        recipientApi.deleteRecipientById(recipientId).then(() => undefined),

      queueType: 'recipient_delete',
      recordId: recipientId,
      queuePayload: {}
    })
};
