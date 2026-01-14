import React from "react";
import { Text, useTheme } from "react-native-paper";
import { AppTheme } from "../theme";

export function FixedLabel({
  label,
  required,
  disabled,
}: {
  label: string;
  required?: boolean;
  disabled?: boolean;
}) {
  const theme = useTheme<AppTheme>();

  return (
    <Text
      style={{
        fontSize: 14,
        marginBottom: 6,
        color: disabled ? theme.colors.disabledText : theme.colors.textPrimary,
        opacity: disabled ? 0.7 : 1,
      }}
    >
      {label}
      {required && (
        <Text
          style={{
            color: disabled ? theme.colors.disabledText : theme.colors.deepRed,
          }}
        >
          *
        </Text>
      )}
    </Text>
  );
}
