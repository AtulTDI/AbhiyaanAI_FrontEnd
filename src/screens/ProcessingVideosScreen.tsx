import React, { useCallback, useEffect, useState, useMemo } from "react";
import { View, StyleSheet } from "react-native";
import {
  IconButton,
  ProgressBar,
  Surface,
  Text,
  useTheme,
} from "react-native-paper";
import { useFocusEffect } from "@react-navigation/native";
import dayjs from "dayjs";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { GetPaginatedVoters, Voter } from "../types/Voter";
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
import { useServerTable } from "../hooks/useServerTable";
import { generateCustomisedVideo } from "../api/videoApi";

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
  const [voterStatuses, setVoterStatuses] = useState<
    Record<string, VoterStatus>
  >({});
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchVoters = useCallback(async (page: number, pageSize: number) => {
    setLoading(true);
    try {
      const response = await getVotersWithInProgressVidoes(page, pageSize);
      const voterList = Array.isArray(response?.data?.items)
        ? response.data.items
        : [];

      setTotalCount(response?.data?.totalRecords);

      const { accessToken } = await getAuthData();
      await startConnection(accessToken);
      await joinGroups(voterList.map((v) => v.id));

      return {
        items: voterList ?? [],
        totalCount: response?.data?.totalRecords ?? 0,
      };
    } catch (error: any) {
      showToast(extractErrorMessage(error, "Failed to load voters"), "error");
    } finally {
      setLoading(false);
    }
  }, []);

  const table = useServerTable<GetPaginatedVoters>(fetchVoters, {
    initialPage: 0,
    initialRowsPerPage: 10,
  });

  const completedCount = useMemo(() => {
    return table.total - table.data.length;
  }, [table.total, table.data.length]);

  useEffect(() => {
    const handleProgressUpdate = (recipientId: string, status: VoterStatus) => {
      setVoterStatuses((prev) => ({ ...prev, [recipientId]: status }));

      if (status === "Completed") {
        table.fetchData(table.page, table.rowsPerPage);
        leaveGroups(recipientId);
      }
    };

    onEvent("ReceiveVideoUpdate", handleProgressUpdate);
  }, [table.page, table.rowsPerPage, table.fetchData]);

  useFocusEffect(
    useCallback(() => {
      table.fetchData(0, 10);
    }, [])
  );

  const handleRerun = async (voter: Voter) => {
    const payload = {
      baseVideoId: voter.baseVideoId,
      recipientIds: [voter.id],
    };

    try {
      await generateCustomisedVideo(payload);
      setTimeout(() => {
        table.fetchData(table.page, table.rowsPerPage);
      }, 1000);
      showToast(`Re-running video for ${voter.fullName}`, "info");
    } catch (error: any) {
      showToast(
        extractErrorMessage(error, "Failed to generate videos"),
        "error"
      );
    }
  };

  const getStatusView = (status: VoterStatus, item: Voter) => {
    switch (status) {
      case "InQueue":
        return (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
            }}
          >
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
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
            }}
          >
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
          <View style={{ justifyContent: "flex-start", marginLeft: 8 }}>
            <ProgressBar
              indeterminate
              color={colors.primary}
              style={{ width: 80, height: 8, borderRadius: 4 }}
            />
          </View>
        );
      case "Completed":
        return (
          <View>
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
          </View>
        );
      case "Failed":
        return (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Ionicons
              name="close-circle-outline"
              size={18}
              color={colors.criticalError}
            />
            <Text style={{ fontSize: 12, color: colors.criticalError }}>
              Failed
            </Text>
            <IconButton
              icon={() => (
                <Feather name="rotate-cw" size={15} color={colors.primary} />
              )}
              onPress={() => handleRerun(item)}
              accessibilityLabel="Rerun processing"
              style={{ margin: 0, width: 15 }}
            />
          </View>
        );
      default:
        return null;
    }
  };

  const columns = [
    { label: "Name", key: "fullName", flex: 0.8 },
    { key: "phoneNumber", label: "Mobile", flex: 0.4 },
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
      key: "actions",
      label: "Status",
      flex: 1,
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
        data={table.data}
        columns={columns}
        emptyIcon={
          <Ionicons
            name="videocam-outline"
            size={48}
            color={colors.disabledText}
          />
        }
        emptyText="No vides found"
        loading={loading}
        page={table.page}
        rowsPerPage={table.rowsPerPage}
        totalCount={table.total}
        onPageChange={table.setPage}
        onRowsPerPageChange={(size) => {
          table.setRowsPerPage(size);
          table.setPage(0);
        }}
      />
    </Surface>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: { padding: 16, flex: 1, backgroundColor: theme.colors.white },
    heading: { fontWeight: "bold" },
  });
