import React, { useCallback, useEffect, useState } from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { IconButton, Surface, Text, useTheme } from "react-native-paper";
import dayjs from "dayjs";
import { useFocusEffect } from "@react-navigation/native";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import CommonTable from "../components/CommonTable";
import { Voter } from "../types/Voter";
import { extractErrorMessage } from "../utils/common";
import { useToast } from "../components/ToastProvider";
import FormDropdown from "../components/FormDropdown";
import { getVotersWithCompletedVideoId } from "../api/voterApi";
import { getVideos } from "../api/videoApi";
import { AppTheme } from "../theme";
import { sendVideo } from "../api/whatsappApi";

export default function GeneratedVideoScreen() {
  const theme = useTheme<AppTheme>();
  const styles = createStyles(theme);
  const { colors } = theme;
  const { showToast } = useToast();

  const [baseVideos, setBaseVideos] = useState<any[]>([]);
  const [selectedVideoId, setSelectedVideoId] = useState(null);
  const [voters, setVoters] = useState<Voter[]>([]);
  const [loading, setLoading] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());

  const fetchVoters = async () => {
    setLoading(true);
    try {
      const response = await getVotersWithCompletedVideoId(selectedVideoId);
      setVoters(
        response?.data && Array.isArray(response.data) ? response.data : []
      );
    } catch (error: any) {
      showToast(extractErrorMessage(error, "Failed to load voters"), "error");
    } finally {
      setLoading(false);
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
        await getVotersWithCompletedVideoId(firstId)
          .then((res) => setVoters(res?.data ?? []))
          .catch((e) =>
            showToast(extractErrorMessage(e, "Failed to load voters"), "error")
          )
          .finally(() => setLoading(false));
      }
    } catch (error: any) {
      showToast(extractErrorMessage(error, "Failed to load videos"), "error");
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

  const handleSendVideo = async (item: Voter) => {
    setSendingId(item.id);
    try {
      await sendVideo({
        recipientId: item.id,
        baseVideoID: selectedVideoId,
      });
      showToast("Video sent successfully", "success");
      setSentIds((prev) => new Set(prev).add(item.id));
    } catch (error) {
      showToast("Error sending video", "error");
    } finally {
      setSendingId(null);
    }
  };

  const columns = [
    {
      label: "Name",
      key: "fullName",
      flex: 0.8,
    },
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
      label: "Actions",
      flex: 1,
      smallColumn: true,
      render: (item: Voter) => {
        if (sentIds.has(item.id)) {
          return (
            <Ionicons
              name="checkmark-circle"
              size={24}
              color={colors.success}
              style={{ marginLeft: 8 }}
            />
          );
        }

        if (sendingId === item.id) {
          return (
            <ActivityIndicator
              size="small"
              color={colors.primary}
              style={{ marginLeft: 8 }}
            />
          );
        }

        return (
          <View style={{ justifyContent: "flex-start", marginLeft: 8 }}>
            <IconButton
              style={{ margin: 0 }}
              icon={() => (
                <FontAwesome
                  name="whatsapp"
                  size={20}
                  color={colors.whatsappGreen}
                />
              )}
              onPress={() => handleSendVideo(item)}
            />
          </View>
        );
      },
    },
  ];

  return (
    <Surface style={styles.container} elevation={2}>
      <View style={styles.content}>
        <Text
          variant="titleLarge"
          style={[styles.heading, { color: theme.colors.primary }]}
        >
          Generated Videos
        </Text>
        <FormDropdown
          label="Select Campaign"
          value={selectedVideoId}
          options={
            Array.isArray(baseVideos)
              ? (baseVideos as { label: string; value: string }[])
              : []
          }
          onSelect={(val) => setSelectedVideoId(val)}
        />
        <View style={{ flex: 1 }}>
          <CommonTable
            data={voters}
            columns={columns}
            loading={loading}
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
