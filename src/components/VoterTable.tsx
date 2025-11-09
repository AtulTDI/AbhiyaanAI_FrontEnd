import React, { useCallback } from "react";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";
import { useTheme } from "react-native-paper";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import { Voter } from "../types/Voter";
import CommonTable from "./CommonTable";
import { AppTheme } from "../theme";

type Props = {
  data: Voter[];
  page: number;
  rowsPerPage: number;
  totalCount: number;
  loading: boolean;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (size: number) => void;
  onEdit: (item: Voter) => void;
  onDelete: (id: string) => void;
  handleVoterSearch: (text: string) => void;
};

export default function VoterTable({
  data,
  page,
  rowsPerPage,
  totalCount,
  loading,
  onPageChange,
  onRowsPerPageChange,
  onEdit,
  onDelete,
  handleVoterSearch
}: Props) {
  const { t } = useTranslation();
  const theme = useTheme<AppTheme>();
  const { colors } = theme;

  const columns = [
    {
      label: t("name"),
      key: "fullName",
      flex: 0.9,
    },
    {
      label: t("mobile"),
      key: "phoneNumber",
      flex: 0.3,
    },
    {
      label: t("createdAt"),
      key: "createdAt",
      flex: 0.4,
      render: (item: Voter) =>
        item.createdAt
          ? dayjs(item.createdAt).format("DD MMM YYYY, hh:mm A")
          : "-",
    },
    {
      label: t("actions"),
      key: "actions",
      flex: 0.9,
      smallColumn: true,
      render: (item: Voter) => (
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
      tableWithSelection={false}
      keyExtractor={(item) => item.id}
      emptyIcon={
        <Ionicons name="people-outline" size={48} color={colors.disabledText} />
      }
      emptyText={t("voter.noData")}
      page={page}
      rowsPerPage={rowsPerPage}
      totalCount={totalCount}
      enableSearch
      onSearchChange={(filters) => {
        handleVoterSearch(filters.search);
      }}
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
  },
});
