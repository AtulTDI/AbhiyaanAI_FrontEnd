import { useCallback } from 'react';
import { BackHandler } from 'react-native';

import { useFocusEffect } from '@react-navigation/native';

export function useExitAppOnBack() {
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => subscription.remove();
    }, [])
  );
}
