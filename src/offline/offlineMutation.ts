import { Platform } from 'react-native';

import { syncQueueRepository } from '../db/syncQueueRepository';
import { isOnline } from '../services/networkService';

interface OfflineMutationOptions {
  localUpdate: () => Promise<void>;
  remoteCall?: () => Promise<void>;
  queueType: string;
  recordId: string;
  queuePayload: Record<string, unknown>;
}

export const offlineMutation = async ({
  localUpdate,
  remoteCall,
  queueType,
  recordId,
  queuePayload
}: OfflineMutationOptions): Promise<void> => {
  const isWeb = Platform.OS === 'web';

  if (isWeb) {
    if (remoteCall) await remoteCall();
    return;
  }

  await localUpdate();

  const online = await isOnline();

  if (!online || !remoteCall) {
    await syncQueueRepository.addToQueue(queueType, recordId, queuePayload);
    return;
  }

  try {
    await remoteCall();
  } catch {
    await syncQueueRepository.addToQueue(queueType, recordId, queuePayload);
  }
};
