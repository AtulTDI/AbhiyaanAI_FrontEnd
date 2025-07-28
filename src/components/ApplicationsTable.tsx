import React from "react";
import dayjs from "dayjs";
import { Application } from "../types/Application";
import { Ionicons } from "@expo/vector-icons";
import { View, StyleSheet } from "react-native";
import { Text, useTheme, Switch } from "react-native-paper";
import CommonTable from "./CommonTable";
import { AppTheme } from "../theme";

type Props = {
  applications: Application[];
  onEdit: (item: Application) => void;
  onToggleStatus: (item: Application) => void;
};

export default function ApplicationsTable({
  applications,
  onEdit,
  onToggleStatus,
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
      render: (item: Application) => (
        <Text>{dayjs(item.createdAt).format("DD MMM YYYY, hh:mm A")}</Text>
      ),
    },
    {
      label: "Status",
      key: "isActive",
      flex: 2,
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
            {item.isActive ? "Active" : "Inactive"}
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
      label: "Action",
      key: "actions",
      flex: 1,
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
      data={applications}
      columns={columns}
      emptyIcon={<Ionicons name="apps" size={48} color={colors.disabledText} />}
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
  statusToggle: {
    flexDirection: "row",
    alignItems: "center",
  },
});
