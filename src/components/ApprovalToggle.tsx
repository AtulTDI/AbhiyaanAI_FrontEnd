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
import { useTranslation } from "react-i18next";

type Props = {
  isApproved: boolean;
  onToggle: () => void;
  style?: ViewStyle;
  iconSize?: number;
  labelStyle?: TextStyle;
  approvedText?: string;
  pendingText?: string;
};

export default function ApprovalToggle({
  isApproved,
  onToggle,
  style,
  iconSize = 16,
  labelStyle,
  approvedText,
  pendingText,
}: Props) {
  const { t } = useTranslation();
  const theme = useTheme<AppTheme>();
  const { colors } = theme;

  approvedText = approvedText ?? t("approved");
  pendingText = pendingText ?? t("clickToApprove");

  const iconName = isApproved ? "checkmark-circle" : "checkmark-circle-outline";
  const label = isApproved ? approvedText : pendingText;
  const tintColor = isApproved ? colors.success : colors.primary;
  const background = tintColor + "22";

  return (
    <TouchableOpacity
      onPress={onToggle}
      activeOpacity={0.8}
      style={[
        styles.button,
        {
          backgroundColor: background,
          borderColor: tintColor,
        },
        style,
      ]}
    >
      <Ionicons name={iconName} size={iconSize} color={tintColor} />
      <Text style={[styles.label, { color: tintColor }, labelStyle]}>
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
