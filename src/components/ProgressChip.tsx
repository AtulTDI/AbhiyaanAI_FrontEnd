import React from "react";
import { Chip } from "react-native-paper";
import { Platform, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Feather } from "@expo/vector-icons";
import colors from "../constants/colors";

type ProgressChipProps = {
  completedCount: number;
  totalCount: number;
};

export default function ProgressChip({
  completedCount,
  totalCount,
}: ProgressChipProps) {
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
        style={{
          backgroundColor: bgColor,
          alignSelf: "flex-start",
          borderRadius: 6,
          paddingHorizontal: 8,
        }}
        textStyle={{ fontWeight: "600", color: textColor }}
      >
        {completedCount} / {totalCount}{" "}
        {Platform.OS === "web" ? t("completed") : ""}
      </Chip>
    </View>
  );
}
