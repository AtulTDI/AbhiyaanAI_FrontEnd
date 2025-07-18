import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "react-native-paper";
import { CustomLabelProps } from "../types";
import { AppTheme } from "../theme";

const CustomLabel = ({ label, icon, focused }: CustomLabelProps) => {
  const theme = useTheme<AppTheme>();
  const styles = createStyles(theme);
  const { colors } = theme;
  const iconWithColor =
    React.isValidElement(icon) && typeof icon.type !== "string"
      ? React.cloneElement(icon as React.ReactElement<any>, {
          color: colors.white,
          size: 20,
        })
      : icon;

  return (
    <View style={[styles.labelWrapper, focused && styles.focusedBackground]}>
      {iconWithColor}
      <Text style={styles.labelText} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    labelWrapper: {
      flexDirection: "row",
      alignItems: "center",
      height: 48,
      paddingHorizontal: 16,
      borderRadius: 8,
    },
    focusedBackground: {
      backgroundColor: theme.colors.darkOrange,
    },
    labelText: {
      marginLeft: 12,
      fontSize: 15,
      color: theme.colors.white,
      fontWeight: "500",
    },
  });

export default CustomLabel;
