import React, { useCallback, useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import { IconButton, Surface, Text, useTheme } from "react-native-paper";
import { useFocusEffect } from "@react-navigation/native";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import CommonTable from "../components/CommonTable";
import { Voter } from "../types/Voter";
import { extractErrorMessage } from "../utils/common";
import { useToast } from "../components/ToastProvider";
import FormDropdown from "../components/FormDropdown";
import { getVotersWithCompletedVideoId } from "../api/voterApi";
import { getCustomisedVideoLink, getVideos } from "../api/videoApi";
import { AppTheme } from "../theme";

export default function GeneratedVideoScreen() {
  const theme = useTheme<AppTheme>();
  const styles = createStyles(theme);
  const { colors } = theme;
  const { showToast } = useToast();
  const [baseVideos, setBaseVideos] = useState<any[]>([]);
  const [selectedVideoId, setSelectedVideoId] = useState(null);
  const [voters, setVoters] = useState<Voter[]>([]);

  const fetchVoters = async () => {
    try {
      const response = await getVotersWithCompletedVideoId(selectedVideoId);
      setVoters(
        response?.data && Array.isArray(response.data) ? response.data : []
      );
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

  const handleSendVideo = async (link) => {
    // const response = await
  };

  const handleGetVideoLink = async (item) => {
    const response = await getCustomisedVideoLink({
      RecipientId: item.id,
      BaseVideoID: selectedVideoId,
      PlatformType: "WhatsApp"
    });
    handleSendVideo(response?.data?.sharableLink);
  };

  const columns = [
    {
      label: "Name",
      key: "fullName",
      flex: 2,
      render: (item) => item.firstName + " " + item.lastName,
    },
    { key: "phoneNumber", label: "Mobile", flex: 2 },
    {
      key: "actions",
      label: "Actions",
      flex: 0.8,
      render: (item: Voter) => {
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
              onPress={() => handleGetVideoLink(item)}
            />
          </View>
        );
      },
    },
  ];

  return (
    <Surface style={styles.container} elevation={2}>
      <View>
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
        />
      </View>
    </Surface>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
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
