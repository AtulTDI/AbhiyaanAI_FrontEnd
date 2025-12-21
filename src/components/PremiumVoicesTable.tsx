import React from "react";
import { Text, useTheme } from "react-native-paper";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import { Voice } from "../types/Voice";
import CommonTable from "./CommonTable";
import { AppTheme } from "../theme";
import { StyleSheet, View } from "react-native";

type Props = {
  data: Voice[];
  page: number;
  rowsPerPage: number;
  totalCount: number;
  loading: boolean;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (size: number) => void;
  onDelete: (id: string) => void;
};

export default function PremiumVoicesTable({
  data,
  page,
  rowsPerPage,
  totalCount,
  loading,
  onPageChange,
  onRowsPerPageChange,
  onDelete,
}: Props) {
  const { t } = useTranslation();
  const theme = useTheme<AppTheme>();
  const { colors } = theme;

  const columns = [
    {
      label: t("id"),
      key: "voiceId",
      flex: 0.6,
    },
    {
      label: t("campaign"),
      key: "campaignName",
      flex: 0.4,
    },
    {
      label: t("voice.lastCampaignRunDate"),
      key: "lastCampaignRunDate",
      flex: 0.4,
      render: (item: Voice) => (
        <Text>
          {dayjs(item.lastCampaignRunDate).format("DD MMM YYYY, hh:mm A")}
        </Text>
      ),
    },
    {
      label: t("actions"),
      key: "actions",
      flex: 0.9,
      smallColumn: true,
      render: (item: Voice) => (
        <View style={styles.actions}>
          <Ionicons
            name="trash-outline"
            size={20}
            color={colors.criticalError}
            onPress={() => onDelete(item.voiceId)}
          />
        </View>
      ),
    },
  ];

  return (
    <CommonTable
      data={data}
      columns={columns}
      loading={loading}
      emptyIcon={
        <Ionicons name="radio-outline" size={48} color={colors.disabledText} />
      }
      emptyText={t("voice.noData")}
      page={page}
      rowsPerPage={rowsPerPage}
      totalCount={totalCount}
      onPageChange={onPageChange}
      onRowsPerPageChange={onRowsPerPageChange}
    />
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginLeft: 18,
  },
});
