import React from "react";
import dayjs from "dayjs";
import { Ionicons } from "@expo/vector-icons";
import { View, StyleSheet } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { Sender } from "../types/Sender";
import CommonTable from "./CommonTable";
import { AppTheme } from "../theme";

type Props = {
  senders: Sender[];
  onEdit: (item: any) => void;
  onDelete: (id: string) => void;
};

export default function SenderTable({ senders, onEdit, onDelete }: Props) {
  const theme = useTheme<AppTheme>();
  const { colors } = theme;
  const columns = [
    {
      label: "Name",
      key: "fullName",
      flex: 0.5,
      render: (item) => item.firstName + " " + item.lastName,
    },
    { label: "Mobile", key: "phoneNumber", flex: 0.4 },
    { label: "Email", key: "email", flex: 0.4 },
    {
      label: "Created At",
      key: "createdAt",
      flex: 0.4,
      render: (item) =>
        item.createdAt
          ? dayjs(item.createdAt).format("DD MMM YYYY, hh:mm A")
          : "-",
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

  return (
    <CommonTable
      data={senders}
      columns={columns}
      emptyIcon={
        <Ionicons
          name="person-remove-outline"
          size={48}
          color={colors.disabledText}
        />
      }
      emptyText="No senders found"
    />
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginLeft: 10
  },
});
