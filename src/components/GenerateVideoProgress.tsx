import React, { useCallback, useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import { IconButton, ProgressBar, useTheme } from "react-native-paper";
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
  const [voterStatuses, setVoterStatuses] = useState<
    Record<string, "not_started" | "in_progress" | "completed">
  >({});

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

  useEffect(() => {
    if (voters.length === 0) return;

    const interval = setInterval(() => {
      setVoterStatuses((prev) => {
        const updated = { ...prev };
        voters.forEach((voter) => {
          if (!updated[voter.id]) {
            updated[voter.id] = "not_started";
          } else if (updated[voter.id] === "not_started") {
            updated[voter.id] = "in_progress";
          } else if (updated[voter.id] === "in_progress") {
            updated[voter.id] = "completed";
          }
        });
        return updated;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [voters]);

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
      flex: 1.5,
      render: (item: Voter) => {
        const status = voterStatuses[item.id] || "not_started";

        switch (status) {
          case "not_started":
            return (
              <View style={{ justifyContent: "flex-start" }}>
                <View
                  style={{
                    width: 80,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: colors.backdrop,
                    opacity: 0.3,
                  }}
                />
              </View>
            );
          case "in_progress":
            return (
              <View style={{ justifyContent: "flex-start" }}>
                <ProgressBar
                  indeterminate
                  color={colors.primary}
                  style={{ width: 80, height: 8, borderRadius: 4 }}
                />
              </View>
            );
          case "completed":
            return (
              <View style={{ justifyContent: "flex-start" }}>
                <IconButton
                  style={{ margin: 0 }}
                  icon={() => (
                    <FontAwesome
                      name="whatsapp"
                      size={20}
                      color={colors.whatsappGreen}
                    />
                  )}
                  onPress={() => onGenerate?.(item)}
                />
              </View>
            );
        }
      },
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
