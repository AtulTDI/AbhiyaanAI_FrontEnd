import React, { useCallback, useState } from "react";
import { StyleSheet, View } from "react-native";
import { RadioButton, useTheme } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import CommonTable from "./CommonTable";
import { getVideos } from "../api/videoApi";
import { useToast } from "./ToastProvider";
import { useVideoPreview } from "./VideoPreviewContext";
import { extractErrorMessage } from "../utils/common";
import { useFocusEffect } from "@react-navigation/native";
import { AppTheme } from "../theme";

type BaseVideo = {
  id: string;
  campaign: string;
};

export default function SelectBaseVideo({ stepData, setStepData }) {
  const theme = useTheme<AppTheme>();
  const styles = createStyles(theme);
  const { colors } = theme;
  const { open } = useVideoPreview();
  const [videos, setVideos] = useState<any[]>([]);
  const { showToast } = useToast();
  
  const fetchVideos = useCallback(async () => {
    try {
      const response = await getVideos();

      const videosData =
        response?.data && Array.isArray(response.data) ? response.data : [];

      setVideos(videosData);

      setStepData((prev) => ({
        ...prev,
        0: prev[0] ? prev[0] : videosData.length > 0 ? videosData[0].id : null,
      }));
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
    }, [fetchVideos])
  );

  const columns = [
    {
      label: "",
      key: "radio",
      flex: 0.5,
      render: (item: BaseVideo) => (
        <RadioButton
          value={item.id}
          status={stepData[0] === item.id ? "checked" : "unchecked"}
          onPress={() =>
            setStepData({
              ...stepData,
              0: item.id,
            })
          }
        />
      ),
    },
    {
      label: "Campaign",
      key: "campaignName" as const,
      flex: 3,
    },
    {
      label: "Actions",
      key: "actions",
      flex: 0.8,
      render: (item) => (
        <View style={styles.actions}>
          <Ionicons
            name="play-circle-outline"
            size={24}
            color={colors.greenAccent}
            onPress={() => open(item.s3Url || "")}
          />
        </View>
      ),
    },
  ];

  const renderCustomRadio = (item: BaseVideo) => (
    <RadioButton
      value={item.id}
      status={stepData[0] === item.id ? "checked" : "unchecked"}
      onPress={() =>
        setStepData({
          ...stepData,
          0: item.id,
        })
      }
      color={theme.colors.primary}
    />
  );

  const customColumns = columns.map((col) => {
    if (col.key === "radio") {
      return {
        ...col,
        render: renderCustomRadio,
      };
    }
    return col;
  });

  return (
    <View style={{ flex: 1 }}>
      <CommonTable
        data={videos}
        columns={customColumns}
        keyExtractor={(item) => item.id}
        emptyIcon={
          <Ionicons
            name="videocam-outline"
            size={48}
            color={colors.disabledText}
          />
        }
        emptyText="No videos found"
        tableWithSelection={true}
      />
    </View>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    actions: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
    },
    fullscreenContainer: {
      flex: 1,
      backgroundColor: theme.colors.black,
      justifyContent: "center",
      alignItems: "center",
      paddingTop: 40,
    },
    video: {
      width: "100%",
      height: "100%",
    },
    closeButton: {
      marginTop: 20,
      alignSelf: "center",
    },
  });
