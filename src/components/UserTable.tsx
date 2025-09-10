import React from "react";
import dayjs from "dayjs";
import { User } from "../types/User";
import { Ionicons } from "@expo/vector-icons";
import { View, StyleSheet } from "react-native";
import { Text, useTheme } from "react-native-paper";
import CommonTable from "./CommonTable";
import { AppTheme } from "../theme";

type Props = {
  role: string;
  data: User[];
  page: number;
  rowsPerPage: number;
  totalCount: number;
  loading: boolean;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (size: number) => void;
  onEdit: (item: any) => void;
  onDelete: (id: string) => void;
  getHeaderTitle: () => string;
};

export default function UserTable({
  role,
  data,
  page,
  rowsPerPage,
  totalCount,
  loading,
  onPageChange,
  onRowsPerPageChange,
  onEdit,
  onDelete,
  getHeaderTitle,
}: Props) {
  const theme = useTheme<AppTheme>();
  const { colors } = theme;
  const columns = [
    {
      label: "Name",
      key: "fullName",
      flex: role === "Admin" ? 0.4 : 0.5,
      render: (item) => item.firstName + " " + item.lastName,
    },
    { label: "Mobile", key: "phoneNumber", flex: 0.2 },
    { label: "Email", key: "email", flex: role === "Admin" ? 0.3 : 0.5 },
    {
      label: "Created At",
      key: "createdAt",
      flex: 0.4,
      render: (item) => (
        <Text>
          {item.createdAt
            ? dayjs(item.createdAt).format("DD MMM YYYY, hh:mm A")
            : "-"}
        </Text>
      ),
    },
    {
      label: "Actions",
      key: "actions",
      flex: 0.9,
      smallColumn: true,
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

  if (role === "Admin") {
    columns.splice(3, 0, {
      label: "Application",
      key: "applicationName",
      flex: 0.4,
    });
  }

  return (
    <CommonTable
      data={data}
      columns={columns}
      loading={loading}
      emptyIcon={
        <Ionicons
          name="person-remove-outline"
          size={48}
          color={colors.disabledText}
        />
      }
      emptyText={`No ${getHeaderTitle().toLowerCase()} found`}
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
  },
});
