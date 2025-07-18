import React, { useCallback, useState } from "react";
import { View, StyleSheet } from "react-native";
import { IconButton, useTheme } from "react-native-paper";
import { useFocusEffect } from "@react-navigation/native";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import CommonTable from "./CommonTable";
import { Voter } from "../types/Voter";
import { extractErrorMessage } from "../utils/common";
import { useToast } from "./ToastProvider";
import { getVoters } from "../api/voterApi";
import { AppTheme } from "../theme";

type Props = {
  voters?: Voter[];
  onSendSelected?: (selected: Voter[]) => void;
  onSendAll?: () => void;
  onGenerate?: (voter: Voter) => void;
};

export default function GenerateVideoProgress({ onGenerate }: Props) {
  const theme = useTheme<AppTheme>();
  const { colors } = theme;
  const { showToast } = useToast();
  const [voters, setVoters] = useState<Voter[]>([]);

  const fetchVoters = useCallback(async () => {
    try {
      const response = await getVoters();
      setVoters(
        response?.data && Array.isArray(response.data) ? response.data : []
      );
    } catch (error: any) {
      showToast(extractErrorMessage(error, "Failed to load voters"), "error");
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchVoters();
    }, [fetchVoters])
  );

  const columns = [
    {
      label: "Name",
      key: "fullName",
      flex: 2,
      render: (item) => item.firstName + " " + item.lastName,
    },
    { key: "phoneNumber", label: "Mobile", flex: 1.5 },
    {
      key: "actions",
      label: "Actions",
      flex: 1,
      render: (item: Voter) => (
        <IconButton
          icon={() => (
            <FontAwesome
              name="whatsapp"
              size={20}
              color={colors.whatsappGreen}
            />
          )}
          onPress={() => onGenerate?.(item)}
        />
      ),
    },
  ];

  return (
    <View style={styles.container}>
      <CommonTable
        data={voters}
        columns={columns}
        emptyIcon={
          <Ionicons
            name="people-outline"
            size={48}
            color={colors.disabledText}
          />
        }
        emptyText="No voters found"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
