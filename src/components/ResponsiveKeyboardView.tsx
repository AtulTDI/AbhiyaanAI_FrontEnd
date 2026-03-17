import { usePlatformInfo } from '../hooks/usePlatformInfo';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

type Props = {
  children: React.ReactNode;
  style?: object;
  contentContainerStyle?: object;
  extraScrollHeight?: number;
};

export default function ResponsiveKeyboardView({
  children,
  style,
  contentContainerStyle,
  extraScrollHeight = 60
}: Props) {
  const { isMobileApp } = usePlatformInfo();

  if (isMobileApp) {
    return (
      <KeyboardAwareScrollView
        enableOnAndroid
        keyboardOpeningTime={0}
        extraScrollHeight={extraScrollHeight}
        contentContainerStyle={[styles.flexGrow, contentContainerStyle]}
        style={style}
      >
        {children}
      </KeyboardAwareScrollView>
    );
  }

  return <View style={[styles.flexGrow, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  flexGrow: { flexGrow: 1 }
});
