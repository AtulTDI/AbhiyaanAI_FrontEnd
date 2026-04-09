import { Platform } from 'react-native';

import { isOnline } from '../services/networkService';

interface OfflineQueryOptions<TLocal, TRemote = TLocal> {
  localFetch: () => Promise<TLocal>;
  remoteFetch?: () => Promise<TRemote>;
  onRemoteSuccess?: (data: TRemote) => Promise<void>;
  transformRemote?: (data: TRemote) => Promise<TLocal>;
}

export const offlineQuery = async <TLocal, TRemote = TLocal>({
  localFetch,
  remoteFetch,
  onRemoteSuccess,
  transformRemote
}: OfflineQueryOptions<TLocal, TRemote>): Promise<TLocal> => {
  const isWeb = Platform.OS === 'web';

  if (isWeb) {
    if (!remoteFetch) return localFetch();
    const remoteData = await remoteFetch();
    if (onRemoteSuccess) await onRemoteSuccess(remoteData);
    return remoteData as unknown as TLocal;
  }

  const localData = await localFetch();
  const online = await isOnline();

  if (!online || !remoteFetch) return localData;

  try {
    const remoteData = await remoteFetch();
    if (onRemoteSuccess) await onRemoteSuccess(remoteData);
    if (transformRemote) return await transformRemote(remoteData);
    if (onRemoteSuccess) return await localFetch();
    return localData;
  } catch {
    return localData;
  }
};
