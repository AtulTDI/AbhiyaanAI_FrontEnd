import React, { useCallback, useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import {
  IconButton,
  ProgressBar,
  Surface,
  Text,
  useTheme,
} from "react-native-paper";
import { useFocusEffect } from "@react-navigation/native";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Voter } from "../types/Voter";
import { extractErrorMessage } from "../utils/common";
import { useToast } from "../components/ToastProvider";
import ProgressChip from "../components/ProgressChip";
import CommonTable from "../components/CommonTable";
import { getAuthData } from "../utils/storage";
import { getVotersWithInProgressVidoes } from "../api/voterApi";
import {
  startConnection,
  joinGroups,
  leaveGroups,
  onEvent,
} from "../services/signalrService";
import { AppTheme } from "../theme";

type VoterStatus =
  | "InQueue"
  | "Pending"
  | "Processing"
  | "Completed"
  | "Failed";

export default function ProcessingVideosScreen() {
  const theme = useTheme<AppTheme>();
  const styles = createStyles(theme);
  const { colors } = theme;
  const { showToast } = useToast();
  const [voters, setVoters] = useState<Voter[]>([]);
  const [voterStatuses, setVoterStatuses] = useState<
    Record<string, VoterStatus>
  >({});
  const [totalCount, setTotalCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleProgressUpdate = (recipientId: string, status: VoterStatus) => {
      console.log("📩 Update:", recipientId, status);

      setVoterStatuses((prev) => ({ ...prev, [recipientId]: status }));

      if (status === "Completed") {
        setCompletedCount((prev) => prev + 1);
        setVoters((prev) => prev.filter((v) => v.id !== recipientId));
        leaveGroups(recipientId);
      }
    };

    onEvent("ReceiveVideoUpdate", handleProgressUpdate);
  }, []);

  const fetchVoters = async () => {
    setLoading(true);
    try {
      const response = await getVotersWithInProgressVidoes();
      const voterList = Array.isArray(response?.data) ? response.data : [];

      setVoters(voterList);
      setTotalCount(voterList.length);

      const { accessToken } = await getAuthData();
      await startConnection(accessToken);
      await joinGroups(voterList.map((v) => v.id));
    } catch (error: any) {
      showToast(extractErrorMessage(error, "Failed to load voters"), "error");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchVoters();
    }, [])
  );

  const getStatusView = (status: VoterStatus, item: Voter) => {
    switch (status) {
      case "InQueue":
        return (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <MaterialCommunityIcons
              name="clock-time-four-outline"
              size={16}
              color={colors.warning}
            />
            <Text style={{ fontSize: 12, color: colors.warning }}>
              In Queue
            </Text>
          </View>
        );
      case "Pending":
        return (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <MaterialCommunityIcons
              name="clock-outline"
              size={16}
              color={colors.primaryLight}
            />
            <Text style={{ fontSize: 12, color: colors.primaryLight }}>
              Pending
            </Text>
          </View>
        );
      case "Processing":
        return (
          <View style={{ justifyContent: "flex-start" }}>
            <ProgressBar
              indeterminate
              color={colors.primary}
              style={{ width: 80, height: 8, borderRadius: 4 }}
            />
          </View>
        );
      case "Completed":
        return (
          <IconButton
            style={{ margin: 0 }}
            icon={() => (
              <Feather
                name="check-circle"
                size={20}
                color={colors.greenAccent}
              />
            )}
          />
        );
      case "Failed":
        return (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Ionicons
              name="close-circle-outline"
              size={18}
              color={colors.criticalError}
            />
            <Text style={{ fontSize: 12, color: colors.criticalError }}>
              Failed
            </Text>
          </View>
        );
      default:
        return null;
    }
  };

  const columns = [
    { label: "Name", key: "fullName", flex: 2 },
    { key: "phoneNumber", label: "Mobile", flex: 2 },
    {
      key: "actions",
      label: "Status",
      flex: 0.8,
      render: (item: Voter) =>
        getStatusView(voterStatuses[item.id] || "InQueue", item),
    },
  ];

  return (
    <Surface style={styles.container} elevation={1}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <Text
          variant="titleLarge"
          style={[styles.heading, { color: theme.colors.primary }]}
        >
          Processing Videos
        </Text>
        <ProgressChip
          completedCount={totalCount === 0 ? 0 : completedCount}
          totalCount={totalCount === 0 ? 0 : totalCount}
        />
      </View>

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
        loading={loading}
      />
    </Surface>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: { padding: 16, flex: 1, backgroundColor: theme.colors.white },
    heading: { fontWeight: "bold", marginBottom: 16 },
  });
