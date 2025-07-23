import React, { useCallback, useState } from "react";
import { View, StyleSheet } from "react-native";
import { IconButton, Surface, Text, useTheme } from "react-native-paper";
import { useFocusEffect } from "@react-navigation/native";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import CommonTable from "../components/CommonTable";
import { Voter } from "../types/Voter";
import { extractErrorMessage } from "../utils/common";
import { useToast } from "../components/ToastProvider";
import { getVoters } from "../api/voterApi";
import { getCustomisedVideoLink } from "../api/videoApi";
import { AppTheme } from "../theme";

export default function GeneratedVideoScreen() {
  const theme = useTheme<AppTheme>();
  const styles = createStyles(theme);
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

  const handleSendVideo = async (link) => {
    // const response = await 
  }

  const handleGetVideoLink = async (item) => {
    const response = await getCustomisedVideoLink({
      recipientId: item.id,
    });
    handleSendVideo(response.data.sharableLink);
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
