import { BackHandler } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";

export function useInternalBackHandler(
  canGoBack: boolean,
  onBack: () => void
) {
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
        "hardwareBackPress",
        onHardwareBack
      );

      return () => subscription.remove();
    }, [canGoBack, onBack])
  );
}