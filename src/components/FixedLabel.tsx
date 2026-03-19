import { AppTheme } from '../theme';
import React from 'react';
import { StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

type Props = {
  label: string;
  required?: boolean;
  disabled?: boolean;
};

export function FixedLabel({ label, required, disabled }: Props) {
  const theme = useTheme<AppTheme>();
  const styles = getStyles(theme, disabled);

  return (
    <Text style={styles.label}>
      {label}
      {required && <Text style={styles.required}>*</Text>}
    </Text>
  );
}

const getStyles = (theme: AppTheme, disabled?: boolean) =>
  StyleSheet.create({
    label: {
      fontSize: 14,
      marginBottom: 6,
      color: disabled ? theme.colors.disabledText : theme.colors.textPrimary,
      opacity: disabled ? 0.7 : 1
    },
    required: {
      color: disabled ? theme.colors.disabledText : theme.colors.deepRed
    }
  });
