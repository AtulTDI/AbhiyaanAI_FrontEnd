import React from "react";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import { Application } from "../types/Application";
import { Ionicons } from "@expo/vector-icons";
import { View, StyleSheet } from "react-native";
import { Text, useTheme, Switch } from "react-native-paper";
import CommonTable from "./CommonTable";
import { AppTheme } from "../theme";

type Props = {
  data: Application[];
  page: number;
  rowsPerPage: number;
  totalCount: number;
  loading: boolean;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (size: number) => void;
  onEdit: (item: Application) => void;
  onToggleStatus: (item: Application) => void;
};

export default function ApplicationsTable({
  data,
  page,
  rowsPerPage,
  totalCount,
  loading,
  onPageChange,
  onRowsPerPageChange,
  onEdit,
  onToggleStatus,
}: Props) {
  const { t } = useTranslation();
  const theme = useTheme<AppTheme>();
  const { colors } = theme;

  const columns = [
    {
      label: t("name"),
      key: "name",
      flex: 1,
    },
    {
      label: t("videoCount"),
      key: "videoCount",
      flex: 0.8,
      render: (item: Application) => (
        <Text>{`${item.remainingVideoCount} / ${item.totalVideoCount}`}</Text>
      ),
    },
    {
      label: t("videoRate"),
      key: "videoGenerationRate",
      flex: 0.8,
    },
    {
      label: t("distributorButtonLabel"),
      key: "salesAgentName",
      flex: 1,
    },
    {
      label: t("createdBy"),
      key: "createdByUserName",
      flex: 1,
    },
    {
      label: t("createdAt"),
      key: "createdAt",
      flex: 1,
      render: (item: Application) => (
        <Text>{dayjs(item.createdAt).format("DD MMM YYYY, hh:mm A")}</Text>
      ),
    },
    {
      label: t("status"),
      key: "isActive",
      flex: 0.8,
      render: (item: Application) => (
        <View style={styles.statusToggle}>
          <Text
            style={{
              fontSize: 12,
              marginRight: 8,
              color: item.isActive ? colors.success : colors.error,
              fontWeight: "600",
            }}
          >
            {item.isActive ? t("active") : t("inactive")}
          </Text>
          <Switch
            value={item.isActive}
            onValueChange={() => onToggleStatus(item)}
            color={item.isActive ? colors.success : colors.error}
          />
        </View>
      ),
    },
    {
      label: t("actions"),
      key: "actions",
      flex: 0.9,
      smallColumn: true,
      render: (item: Application) => (
        <View style={styles.actions}>
          <Ionicons
            name="pencil"
            size={20}
            color={colors.primary}
            onPress={() => onEdit(item)}
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
      emptyIcon={<Ionicons name="apps" size={48} color={colors.disabledText} />}
      emptyText={t("application.noData")}
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
    marginLeft: 8,
  },
  statusToggle: {
    flexDirection: "row",
    alignItems: "center",
  },
});
