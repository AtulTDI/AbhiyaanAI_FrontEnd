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
import CommonTable from "../components/CommonTable";
import { Voter } from "../types/Voter";
import { extractErrorMessage } from "../utils/common";
import { useToast } from "../components/ToastProvider";
import FormDropdown from "../components/FormDropdown";
import ProgressChip from "../components/ProgressChip";
import { getAuthData } from "../utils/storage";
import { getVotersWithVideoId } from "../api/voterApi";
import { getVideos } from "../api/videoApi";
import {
  joinGroups,
  leaveGroups,
  registerOnServerEvents,
  startConnection,
} from "../services/signalrService";
import { AppTheme } from "../theme";

type VoterStatus =
  | "NotStarted"
  | "InQueue"
  | "Pending"
  | "Processing"
  | "Completed"
  | "Failed";

export default function ProcessingVideosScreen({ route }) {
  const theme = useTheme<AppTheme>();
  const styles = createStyles(theme);
  const { colors } = theme;
  const { showToast } = useToast();
  const [baseVideos, setBaseVideos] = useState<any[]>([]);
  const [selectedVideoId, setSelectedVideoId] = useState(null);
  const [voters, setVoters] = useState<Voter[]>([]);
  const [voterStatuses, setVoterStatuses] = useState<
    Record<string, VoterStatus>
  >({});
  const [totalCount, setTotalCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const setupSignalR = async (voters) => {
    const fromPage = route?.params?.from;
    const { accessToken } = await getAuthData();

    if (fromPage !== "Generate") {
      await startConnection(accessToken);
      await joinGroups(voters);
    }

    registerOnServerEvents(
      "ReceiveVideoUpdate",
      (recipientId: string, status: VoterStatus) => {
        setVoterStatuses((prev) => ({
          ...prev,
          [recipientId]: status,
        }));

        if (status === "Completed") {
          setCompletedCount((prev) => prev + 1);
          setVoters((prev) => prev.filter((v) => v.id !== recipientId));
          leaveGroups(recipientId);
        }
      }
    );
  };

  const fetchVoters = async () => {
    try {
      const response = await getVotersWithVideoId(selectedVideoId);
      const voterList =
        response?.data && Array.isArray(response.data) ? response.data : [];
      setVoters(voterList);
      setTotalCount(voterList.length);

      await setupSignalR(voterList);
    } catch (error: any) {
      showToast(extractErrorMessage(error, "Failed to load voters"), "error");
    }
  };

  const fetchVideos = useCallback(async () => {
    try {
      const response = await getVideos();

      const videosData =
        response?.data && Array.isArray(response.data) ? response.data : [];

      const transformedVideos = videosData.map((video) => ({
        label: video.campaignName,
        value: video.id,
      }));

      setBaseVideos(transformedVideos);

      if (transformedVideos?.length) {
        const firstId = transformedVideos?.[0]?.value;
        setSelectedVideoId(firstId);

        setLoading(true);
        await getVotersWithVideoId(firstId)
          .then((res) => setVoters(res?.data ?? []))
          .catch((e) =>
            showToast(extractErrorMessage(e, "Failed to load voters"), "error")
          )
          .finally(() => setLoading(false));
      }
    } catch (error: any) {
      if (error?.response || error?.message) {
        showToast(extractErrorMessage(error, "Failed to load videos"), "error");
      } else {
        console.warn("No response received or unknown error:", error);
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchVideos();
    }, [])
  );

  useEffect(() => {
    if (selectedVideoId) {
      fetchVoters();
    }
  }, [selectedVideoId]);

  const getStatusView = (status: VoterStatus, item: Voter) => {
    switch (status) {
      case "NotStarted":
        return (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Ionicons
              name="pause-circle-outline"
              size={16}
              color={colors.disabledText}
            />
            <Text style={{ color: colors.disabledText, fontSize: 12 }}>
              Not Started
            </Text>
          </View>
        );
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
    {
      label: "Name",
      key: "fullName",
      flex: 2,
    },
    { key: "phoneNumber", label: "Mobile", flex: 2 },
    {
      key: "actions",
      label: "Status",
      flex: 0.8,
      render: (item: Voter) => {
        const status = voterStatuses[item.id] || "NotStarted";
        return getStatusView(status, item);
      },
    },
  ];

  return (
    <Surface style={styles.container} elevation={2}>
      <View>
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
            completedCount={completedCount}
            totalCount={totalCount}
          />
        </View>
        <FormDropdown
          label="Select Campaign"
          value={selectedVideoId}
          options={
            Array.isArray(baseVideos)
              ? typeof (baseVideos as unknown[])[0] === "string"
                ? (baseVideos as string[]).map((opt) => ({
                    label: opt,
                    value: opt,
                  }))
                : (baseVideos as { label: string; value: string }[])
              : []
          }
          onSelect={(val) => setSelectedVideoId(val)}
        />
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
      </View>
    </Surface>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    content: {
      flex: 1,
      display: "flex",
    },
    container: {
      padding: 16,
      flex: 1,
      backgroundColor: theme.colors.white,
    },
    heading: {
      fontWeight: "bold",
      marginBottom: 16,
    },
  });
