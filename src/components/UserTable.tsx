import React from "react";
import dayjs from "dayjs";
import { User } from "../types/User";
import { Ionicons } from "@expo/vector-icons";
import { View, StyleSheet } from "react-native";
import { Text, useTheme } from "react-native-paper";
import CommonTable from "./CommonTable";
import { AppTheme } from "../theme";

type Props = {
  users: User[];
  onEdit: (item: any) => void;
  onDelete: (id: string) => void;
};

export default function UserTable({ users, onEdit, onDelete }: Props) {
  const theme = useTheme<AppTheme>();
  const { colors } = theme;
  const columns = [
    {
      label: "Name",
      key: "fullName",
      flex: 3.5,
      render: (item) => item.firstName + " " + item.lastName,
    },
    { label: "Mobile", key: "phoneNumber", flex: 2.2 },
    { label: "Email", key: "email", flex: 3.5 },
    { label: "Role", key: "role", flex: 1.5 },
    {
      label: "Created At",
      key: "createdAt",
      flex: 2.6,
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
      flex: 1.5,
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
      data={users}
      columns={columns}
      emptyIcon={
        <Ionicons
          name="person-remove-outline"
          size={48}
          color={colors.disabledText}
        />
      }
      emptyText="No users found"
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
