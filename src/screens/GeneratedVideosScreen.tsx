import React, { useCallback, useEffect, useState } from "react";
import { View, StyleSheet, Platform } from "react-native";
import { IconButton, Surface, Text, useTheme } from "react-native-paper";
import { useFocusEffect } from "@react-navigation/native";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
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
  const [loading, setLoading] = useState(false);

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
        baseVideoID: selectedVideoId,
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
    // finally {
    //   await handleSendVideo(
    //     `https://api.whatsapp.com/send?phone=+91${item.phoneNumber}&text=https://5f26bb7e4034.ngrok-free.app/api/preview/${selectedVideoId}`
    //   );
    // }
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
