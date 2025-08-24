import React, { useCallback, useState } from "react";
import { View, StyleSheet } from "react-native";
import { IconButton, Surface, Text, useTheme } from "react-native-paper";
import { useFocusEffect } from "@react-navigation/native";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import CommonTable from "../components/CommonTable";
import { Voter } from "../types/Voter";
import { extractErrorMessage } from "../utils/common";
import { useToast } from "../components/ToastProvider";
import { getCustomisedVideoLink } from "../api/videoApi";
import { getSenderVideos } from "../api/senderApi";
import { AppTheme } from "../theme";

export default function CompletedVideosScreen() {
  const theme = useTheme<AppTheme>();
  const styles = createStyles(theme);
  const { colors } = theme;
  const { showToast } = useToast();
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchVideos = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getSenderVideos();

      const videosData =
        response?.data && Array.isArray(response.data) ? response.data : [];

      setVideos(videosData);
    } catch (error: any) {
      if (error?.response || error?.message) {
        showToast(extractErrorMessage(error, "Failed to load videos"), "error");
      } else {
        console.warn("No response received or unknown error:", error);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchVideos();
    }, [])
  );

  const handleSendVideo = async (whatsappLink: string) => {
    try {
      const canOpen = await Linking.canOpenURL(whatsappLink);
      if (canOpen) {
        await Linking.openURL(whatsappLink);
      } else {
        showToast("Unable to open WhatsApp", "error");
      }
    } catch (error) {
      showToast("Error sending video", "error");
    }
  };

  const handleGetVideoLink = async (item) => {
    try {
      const response = await getCustomisedVideoLink({
        recipientId: item.id,
        baseVideoID: "",
        platformType: "WhatsApp",
      });

      if (response?.data?.sharableLink) {
        await handleSendVideo(response.data.sharableLink);
      } else {
        showToast("Failed to get video link", "error");
      }
    } catch (error) {
      showToast("Error sending video link", "error");
    }
  };

  const columns = [
    {
      label: "Name",
      key: "fullName",
      flex: 2,
    },
    { key: "email", label: "Email", flex: 2 },
    { key: "phoneNumber", label: "Mobile", flex: 2 },
    {
      key: "actions",
      label: "Actions",
      flex: 1,
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
      <View style={styles.content}>
        <Text
          variant="titleLarge"
          style={[styles.heading, { color: theme.colors.primary }]}
        >
          Generated Videos
        </Text>

        <View style={{ flex: 1 }}>
          <CommonTable
            data={videos}
            columns={columns}
            loading={loading}
            emptyIcon={
              <Ionicons
                name="videocam-outline"
                size={48}
                color={colors.disabledText}
              />
            }
            emptyText="No videos found"
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
