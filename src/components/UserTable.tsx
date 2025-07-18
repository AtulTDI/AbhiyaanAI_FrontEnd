import React from "react";
import { User } from "../types/User";
import { Ionicons } from "@expo/vector-icons";
import { View, StyleSheet } from "react-native";
import { useTheme } from "react-native-paper";
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
      flex: 4,
      render: (item) => item.firstName + " " + item.lastName,
    },
    { label: "Mobile", key: "phoneNumber", flex: 2.5 },
    { label: "Email", key: "email", flex: 4 },
    { label: "Role", key: "role", flex: 1.5 },
    { label: "Created At", key: "createdAt", flex: 3 },
    {
      label: "Actions",
      key: "actions",
      flex: 2,
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
    gap: 14,
  },
});
