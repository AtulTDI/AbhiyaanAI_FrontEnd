import NetInfo from '@react-native-community/netinfo';

import { logger } from '../utils/logger';

export const isOnline = async (): Promise<boolean> => {
  try {
    const networkState = await NetInfo.fetch();
    const result = !!networkState.isConnected && !!networkState.isInternetReachable;
    logger.log(
      `[networkService] isOnline: ${result} — connected: ${networkState.isConnected}, reachable: ${networkState.isInternetReachable}`
    );
    return result;
  } catch (error) {
    logger.error('[networkService] NetInfo.fetch failed', error);
    return true;
  }
};
