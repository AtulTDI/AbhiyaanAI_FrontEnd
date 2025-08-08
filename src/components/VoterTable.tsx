import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";
import { useTheme } from "react-native-paper";
import { Voter } from "../types/Voter";
import CommonTable from "./CommonTable";
import { AppTheme } from "../theme";

type Props = {
  voters: Voter[];
  onEdit: (item: any) => void;
  onDelete: (id: string) => void;
};

export default function VoterTable({ voters, onEdit, onDelete }: Props) {
  const theme = useTheme<AppTheme>();
  const { colors } = theme;

  const columns = [
    {
      label: "Name",
      key: "fullName",
      flex: 2,
      render: (item) => item.fullName,
    },
    { label: "Mobile", key: "phoneNumber", flex: 2 },
    {
      label: "Actions",
      key: "actions",
      flex: 1,
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
      data={voters}
      columns={columns}
      onEdit={onEdit}
      onDelete={onDelete}
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
    gap: 14,
  },
});
