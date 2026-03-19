import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Chip } from 'react-native-paper';

import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import colors from '../constants/colors';
import { usePlatformInfo } from '../hooks/usePlatformInfo';

type ProgressChipProps = {
  completedCount: number;
  totalCount: number;
};

export default function ProgressChip({ completedCount, totalCount }: ProgressChipProps) {
  const { isWeb, isMobileWeb } = usePlatformInfo();
  const { t } = useTranslation();

  const progress = totalCount > 0 ? completedCount / totalCount : 0;

  let bgColor = colors.errorBackground;
  let textColor = colors.errorText;
  let iconColor = colors.errorIcon;

  if (progress >= 1) {
    bgColor = colors.successBackground;
    textColor = colors.successText;
    iconColor = colors.successIcon;
  } else if (progress >= 0.5) {
    bgColor = colors.warningBackground;
    textColor = colors.warningText;
    iconColor = colors.warningIcon;
  }

  return (
    <View>
      <Chip
        icon={() => <Feather name="check-circle" size={16} color={iconColor} />}
        style={[styles.chip, { backgroundColor: bgColor }]}
        textStyle={[styles.text, { color: textColor }]}
      >
        {completedCount} / {totalCount} {isWeb && !isMobileWeb ? t('completed') : ''}
      </Chip>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignSelf: 'flex-start',
    borderRadius: 6,
    paddingHorizontal: 8
  },
  text: {
    fontWeight: '600'
  }
});
