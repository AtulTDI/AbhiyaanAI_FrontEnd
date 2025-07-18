import React, { useState } from "react";
import { View, Platform, Text, StyleSheet } from "react-native";
import { useTheme } from "react-native-paper";
import { Picker } from "@react-native-picker/picker";
import colors from "../constants/colors";
import { AppTheme } from "../theme";

type Props = {
  selectedValue: string;
  onValueChange: (val: string) => void;
  error?: string;
  children: React.ReactNode;
};

export default function PickerField({
  selectedValue,
  onValueChange,
  error,
  children,
}: Props) {
  const theme = useTheme<AppTheme>();
  const styles = createStyles(theme);
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.container}>
      <View
        style={[focused && styles.focusBorder, error && styles.errorBorder]}
      >
        <Picker
          selectedValue={selectedValue}
          onValueChange={(val) => {
            onValueChange(val);
            setFocused(false);
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={styles.picker}
          dropdownIconColor={colors.black}
        >
          {children}
        </Picker>
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    picker: {
      paddingHorizontal: 12,
      borderColor: theme.colors.mutedBorder,
      borderRadius: 6,
      height: 44,
      fontSize: 16,
      color: colors.black,
    },
    focusBorder: {
      borderColor: colors.primary,
      borderWidth: 1.5,
      ...(Platform.OS === "web"
        ? {
            outlineStyle: "none" as any,
            outlineColor: "transparent" as any,
          }
        : {}),
    },
    errorBorder: {
      borderColor: colors.error,
    },
    errorText: {
      color: colors.error,
      fontSize: 12,
      marginTop: 4,
    },
  });
