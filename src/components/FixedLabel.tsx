import React from "react";
import { Text, useTheme } from "react-native-paper";
import { AppTheme } from "../theme";

export function FixedLabel({
  label,
  required,
}: {
  label: string;
  required?: boolean;
}) {
  const theme = useTheme<AppTheme>();

  return (
    <Text style={{ fontSize: 14, marginBottom: 6, color: theme.colors.textPrimary }}>
      {label}
      {required && <Text style={{ color: theme.colors.deepRed }}> *</Text>}
    </Text>
  );
}
