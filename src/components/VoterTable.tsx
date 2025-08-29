import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";
import { useTheme } from "react-native-paper";
import { Voter } from "../types/Voter";
import CommonTable from "./CommonTable";
import { AppTheme } from "../theme";
import dayjs from "dayjs";

type Props = {
  voters: Voter[];
  onEdit: (item: Voter) => void;
  onDelete: (id: string) => void;
};

export default function VoterTable({ voters, onEdit, onDelete }: Props) {
  const theme = useTheme<AppTheme>();
  const { colors } = theme;

  const columns = [
    {
      label: "Name",
      key: "fullName",
      flex: 1,
    },
    {
      label: "Mobile",
      key: "phoneNumber",
      flex: 0.3,
    },
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
      data={voters}
      columns={columns}
      emptyIcon={
        <Ionicons name="people-outline" size={48} color={colors.disabledText} />
      }
      emptyText="No voters found"
    />
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginLeft: 10,
  },
});
