import React from "react";
import { View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Text, useTheme } from "react-native-paper";
import { useTranslation } from "react-i18next";
import CommonTable from "./CommonTable";
import { Candidate } from "../types/Candidate";
import { AppTheme } from "../theme";

type Props = {
  data: Candidate[];
  page: number;
  rowsPerPage: number;
  totalCount: number;
  loading: boolean;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (size: number) => void;
  onEdit: (item: Candidate) => void;
  onDelete: (id: string) => void;
};

export default function CandidatesTable({
  data,
  page,
  rowsPerPage,
  totalCount,
  loading,
  onPageChange,
  onRowsPerPageChange,
  onEdit,
  onDelete,
}: Props) {
  const { t } = useTranslation();
  const theme = useTheme<AppTheme>();
  const { colors } = theme;

  const columns = [
    {
      label: t("name"),
      key: "name",
      flex: 0.8,
      render: (item: Candidate) => <Text>{item.name}</Text>,
    },
    {
      label: t("candidate.party"),
      key: "partyName",
      flex: 0.8,
      render: (item: Candidate) => <Text>{item.partyName || "-"}</Text>,
    },
    {
      label: t("actions"),
      key: "actions",
      flex: 1,
      smallColumn: true,
      render: (item: Candidate) => (
        <View style={styles.actions}>
          <Ionicons
            name="pencil"
            size={20}
            color={colors.primary}
            onPress={() => onEdit(item)}
          />
          <Ionicons
            name="trash-outline"
            size={20}
            color={colors.criticalError}
            onPress={() => onDelete(item.id)}
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
        <Ionicons
          name="people-circle-outline"
          size={48}
          color={colors.disabledText}
        />
      }
      emptyText={t("candidate.noData")}
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
    gap: 10,
  },
});
