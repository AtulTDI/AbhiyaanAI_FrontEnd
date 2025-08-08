import React, { useCallback, useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import { IconButton, ProgressBar, Text, useTheme } from "react-native-paper";
import { useFocusEffect } from "@react-navigation/native";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import CommonTable from "./CommonTable";
import { Voter } from "../types/Voter";
import { extractErrorMessage } from "../utils/common";
import { useToast } from "./ToastProvider";
import { getAuthData } from "../utils/storage";
import { getVotersWithVideoId } from "../api/voterApi";
import {
  joinGroups,
  registerOnServerEvents,
  startConnection,
} from "../services/signalrService";
import { AppTheme } from "../theme";
import { generateCustomisedVideo } from "../api/videoApi";

type VoterStatus =
  | "NotStarted"
  | "InQueue"
  | "Pending"
  | "Processing"
  | "Completed"
  | "Failed";

type Props = {
  stepData: any;
  voters?: Voter[];
  onSendSelected?: (selected: Voter[]) => void;
  onSendAll?: () => void;
  onGenerate?: (voter: Voter) => void;
  generationTriggered?: boolean;
  setGenerationTriggered?: (
    value: boolean | ((prev: boolean) => boolean)
  ) => void;
};

export default function GenerateVideoProgress({
  stepData,
  onGenerate,
  generationTriggered,
  setGenerationTriggered,
}: Props) {
  const theme = useTheme<AppTheme>();
  const { colors } = theme;
  const { showToast } = useToast();
  const [voters, setVoters] = useState<Voter[]>([]);
  const [voterStatuses, setVoterStatuses] = useState<
    Record<string, VoterStatus>
  >({});

  const fetchVoters = useCallback(async () => {
    try {
      const response = await getVotersWithVideoId(stepData?.[0]);
      setVoters(
        response?.data && Array.isArray(response.data) ? response.data : []
      );
    } catch (error: any) {
      showToast(extractErrorMessage(error, "Failed to load voters"), "error");
    }
  }, []);

  const generateVideo = async () => {
    const payload = {
      baseVideoId: stepData[0],
      recipientIds: stepData[1],
    };

    try {
      await generateCustomisedVideo(payload);
    } catch (error: any) {
      showToast(
        extractErrorMessage(error, "Failed to generate videos"),
        "error"
      );
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchVoters();
    }, [fetchVoters])
  );

  useEffect(() => {
    if (!generationTriggered) return;

    const setupSignalR = async () => {
      const { accessToken } = await getAuthData();

      await startConnection(accessToken);
      await joinGroups(stepData?.[1]);

      registerOnServerEvents(
        "ReceiveVideoUpdate",
        (recipientId: string, status: VoterStatus) => {
          setVoterStatuses((prev) => ({
            ...prev,
            [recipientId]: status,
          }));
        }
      );

      await generateVideo();
    };

    setupSignalR();

    return () => {
      setGenerationTriggered(false);
    };
  }, [generationTriggered]);

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
            onPress={() => onGenerate?.(item)}
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
      render: (item) => item.fullName,
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
