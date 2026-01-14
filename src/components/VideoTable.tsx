import React, { useRef } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import { Ionicons } from "@expo/vector-icons";
import {
  Video as ExpoVideo,
  ResizeMode,
  VideoFullscreenUpdate,
  VideoFullscreenUpdateEvent,
} from "expo-av";
import CommonTable from "./CommonTable";
import ApprovalToggle from "./ApprovalToggle";
import { AppTheme } from "../theme";

type Video = {
  id: string;
  campaignName: string;
  createdAt: string;
  isShared: boolean;
  s3Url?: string;
};

type Props = {
  data: Video[];
  page: number;
  rowsPerPage: number;
  totalCount: number;
  loading?: boolean;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (size: number) => void;
  onShare: (id: string) => void;
  onUnshare: (id: string) => void;
  onDelete: (id: string) => void;
};

export default function VideoTable({
  data,
  page,
  rowsPerPage,
  totalCount,
  loading,
  onPageChange,
  onRowsPerPageChange,
  onShare,
  onUnshare,
  onDelete,
}: Props) {
  const { t } = useTranslation();
  const theme = useTheme<AppTheme>();
  const styles = createStyles(theme);
  const { colors } = theme;

  const videoRef = useRef<ExpoVideo>(null);
  const currentUriRef = useRef<string | null>(null);

  const playVideo = async (uri?: string) => {
    if (!uri || !videoRef.current) return;

    currentUriRef.current = uri;

    try {
      await videoRef.current.setPositionAsync(0);
      await videoRef.current.presentFullscreenPlayer();
      await videoRef.current.playAsync();
    } catch (e) {
      console.warn("Failed to play video", e);
    }
  };

  const closeVideo = async () => {
    try {
      await videoRef.current?.stopAsync();
      await videoRef.current?.dismissFullscreenPlayer();
      await videoRef.current?.setPositionAsync(0);
    } catch {
      // ignore
    }
  };

  const handleFullscreenUpdate = async (event: VideoFullscreenUpdateEvent) => {
    if (event.fullscreenUpdate === VideoFullscreenUpdate.PLAYER_DID_DISMISS) {
      await closeVideo();
    }
  };

  const columns = [
    { label: t("campaign"), key: "campaignName", flex: 0.8 },
    {
      label: t("uploadedAt"),
      key: "createdAt",
      flex: 0.4,
      render: (item: Video) => (
        <Text>{dayjs(item.createdAt).format("DD MMM YYYY, hh:mm A")}</Text>
      ),
    },
    {
      label: t("approval"),
      key: "isShared",
      flex: 0.4,
      render: (item: Video) => (
        <ApprovalToggle
          isApproved={item.isShared}
          onToggle={() =>
            item.isShared ? onUnshare(item.id) : onShare(item.id)
          }
          iconSize={20}
          labelStyle={{ fontWeight: "bold" }}
        />
      ),
    },
    {
      label: t("actions"),
      key: "actions",
      flex: 0.9,
      smallColumn: true,
      render: (item: Video) => (
        <View style={styles.actions}>
          <TouchableOpacity onPress={() => playVideo(item.s3Url)}>
            <Ionicons
              name="play-circle-outline"
              size={24}
              color={colors.greenAccent}
            />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => onDelete(item.id)}>
            <Ionicons
              name="trash-outline"
              size={24}
              color={colors.criticalError}
            />
          </TouchableOpacity>
        </View>
      ),
    },
  ];

  return (
    <>
      <CommonTable
        data={data}
        columns={columns}
        loading={loading}
        keyExtractor={(item) => item.id}
        emptyIcon={
          <Ionicons
            name="sparkles-outline"
            size={48}
            color={colors.disabledText}
          />
        }
        emptyText={t("video.noData")}
        page={page}
        rowsPerPage={rowsPerPage}
        totalCount={totalCount}
        onPageChange={onPageChange}
        onRowsPerPageChange={onRowsPerPageChange}
      />

      {/* Hidden fullscreen video player */}
      <ExpoVideo
        ref={videoRef}
        source={
          currentUriRef.current ? { uri: currentUriRef.current } : undefined
        }
        useNativeControls
        resizeMode={ResizeMode.CONTAIN}
        shouldPlay={false}
        onFullscreenUpdate={handleFullscreenUpdate}
        style={styles.hiddenVideo}
      />
    </>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    actions: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },

    hiddenVideo: {
      width: 0,
      height: 0,
    },

    closeButton: {
      position: "absolute",
      top: 12,
      right: 12,
      backgroundColor: "rgba(0,0,0,0.6)",
      zIndex: 1000,
    },
  });
