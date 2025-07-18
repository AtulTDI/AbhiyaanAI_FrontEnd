import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from "react-native";
import { useTheme } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { AppTheme } from "../theme";

type Props = {
  isApproved: boolean;
  onPress: () => void;
  style?: ViewStyle;
  iconSize?: number;
  labelStyle?: TextStyle;
};

export default function ApprovalToggle({
  isApproved,
  onPress,
  style,
  iconSize = 16,
  labelStyle,
}: Props) {
  const theme = useTheme<AppTheme>();
  const { colors } = theme;

  const iconName = isApproved ? "checkmark-circle" : "close-circle";
  const bgColor = isApproved ? colors.success : colors.error;
  const label = isApproved ? "Approved" : "Rejected";

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[
        styles.button,
        {
          backgroundColor: bgColor + "22", // light tint
          borderColor: bgColor,
        },
        style,
      ]}
    >
      <Ionicons name={iconName} size={iconSize} color={bgColor} />
      <Text style={[styles.label, { color: bgColor }, labelStyle]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 5,
    borderWidth: 1,
    alignSelf: "flex-start",
    gap: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: "500",
  },
});
