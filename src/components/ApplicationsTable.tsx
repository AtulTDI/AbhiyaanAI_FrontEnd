import React from "react";
import dayjs from "dayjs";
import { Application } from "../types/Application";
import { Ionicons } from "@expo/vector-icons";
import { View, StyleSheet } from "react-native";
import { Text, useTheme } from "react-native-paper";
import CommonTable from "./CommonTable";
import { AppTheme } from "../theme";

type Props = {
  applications: Application[];
  onEdit: (item: any) => void;
  onDelete: (id: string) => void;
};

export default function ApplicationsTable({
  applications,
  onEdit,
  onDelete,
}: Props) {
  const theme = useTheme<AppTheme>();
  const { colors } = theme;
  const columns = [
    {
      label: "Name",
      key: "name",
      flex: 2,
    },
    {
      label: "Video Count",
      key: "videoCount",
      flex: 2,
    },
    {
      label: "Created At",
      key: "createdAt",
      flex: 2,
      render: (item) => (
        <Text>{dayjs(item.createdAt).format("DD MMM YYYY, hh:mm A")}</Text>
      ),
    },
    {
      label: "Actions",
      key: "actions",
      flex: 0.8,
      render: (item) => (
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
      data={applications}
      columns={columns}
      emptyIcon={
        <Ionicons
          name="apps"
          size={48}
          color={colors.disabledText}
        />
      }
      emptyText="No applications found"
    />
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
});
