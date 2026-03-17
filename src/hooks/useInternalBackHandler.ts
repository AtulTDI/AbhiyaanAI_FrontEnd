import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { BackHandler } from 'react-native';

export function useInternalBackHandler(canGoBack: boolean, onBack: () => void) {
  useFocusEffect(
    useCallback(() => {
      const onHardwareBack = () => {
        if (canGoBack) {
          onBack();
          return true;
        }
        return false;
      };

      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        onHardwareBack
      );

      return () => subscription.remove();
    }, [canGoBack, onBack])
  );
}
