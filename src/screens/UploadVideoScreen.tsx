import React, { useCallback, useState } from "react";
import { StyleSheet, View, KeyboardAvoidingView, Platform } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Surface, Text, Button, useTheme } from "react-native-paper";
import { useTranslation } from "react-i18next";
import VideoTable from "../components/VideoTable";
import VideoUploadForm from "../components/VideoUploadForm";
import { useToast } from "../components/ToastProvider";
import DeleteConfirmationDialog from "../components/DeleteConfirmationDialog";
import {
  deleteVideoById,
  getVideos,
  shareVideoById,
  uploadVideo,
} from "../api/videoApi";
import { useServerTable } from "../hooks/useServerTable";
import { GetPaginatedVideos } from "../types/Video";
import { extractErrorMessage, sortByDateDesc } from "../utils/common";
import { AppTheme } from "../theme";

export default function UploadVideoScreen() {
  const { t } = useTranslation();
  const theme = useTheme<AppTheme>();
  const { colors } = theme;
  const { showToast } = useToast();

  const [showAddView, setShowAddView] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchVideos = useCallback(async (page: number, pageSize: number) => {
    setLoading(true);
    try {
      const response = await getVideos(page, pageSize);
      const sortedVideos = sortByDateDesc(
        response?.data && Array.isArray(response.data.items)
          ? response.data.items
          : [],
        "createdAt"
      );

      return {
        items: sortedVideos ?? [],
        totalCount: response?.data?.totalRecords ?? 0,
      };
    } catch (error: any) {
      showToast(
        extractErrorMessage(error, t("video.loadVideoFailMessage")),
        "error"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const table = useServerTable<GetPaginatedVideos>(fetchVideos, {
    initialPage: 0,
    initialRowsPerPage: 10,
  });

  useFocusEffect(
    useCallback(() => {
      setShowAddView(false);
      table.setPage(0);
      table.setRowsPerPage(10);
      table.fetchData(0, 10);
    }, [])
  );

  const handleAddVideo = async (videoData: any) => {
    try {
      setUploading(true);
      await uploadVideo(videoData);
      setUploading(false);
      await table.fetchData(0, table.rowsPerPage);
      setShowAddView(false);
    } catch (error) {
      showToast(
        extractErrorMessage(error, t("video.addVideoFailMessage")),
        "error"
      );
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteRequest = (id: string) => {
    setSelectedVideoId(id);
    setDeleteDialogVisible(true);
  };

  const handleShareRequest = async (id: string) => {
    try {
      await shareVideoById(id, true);
      await table.fetchData(table.page, table.rowsPerPage);
    } catch (error) {
      showToast(
        extractErrorMessage(error, t("video.shareVideoFailMessage")),
        "error"
      );
    }
  };

  const handleUnShareRequest = async (id: string) => {
    try {
      await shareVideoById(id, false);
      await table.fetchData(table.page, table.rowsPerPage);
    } catch (error) {
      showToast(
        extractErrorMessage(error, t("video.shareVideoFailMessage")),
        "error"
      );
    }
  };

  const confirmDeleteVideo = async () => {
    if (selectedVideoId) {
      try {
        await deleteVideoById(selectedVideoId);
        await table.fetchData(table.page, table.rowsPerPage);
        showToast(t("video.deleteSucessMessage"), "success");
      } catch (error: any) {
        showToast(
          extractErrorMessage(error, t("video.deleteFailMessage")),
          "error"
        );
      }
      setSelectedVideoId(null);
      setDeleteDialogVisible(false);
    }
  };

  return (
    <>
      <Surface style={styles.container} elevation={1}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
        >
          {!showAddView ? (
            <>
              {/* Heading Row */}
              <View style={styles.headerRow}>
                <Text
                  variant="titleLarge"
                  style={[styles.heading, { color: colors.primary }]}
                >
                  {t("video.plural")}
                </Text>
                <Button
                  mode="contained"
                  icon="plus"
                  onPress={() => setShowAddView(true)}
                  style={{ borderRadius: 6 }}
                  buttonColor={colors.primary}
                  textColor={colors.onPrimary}
                >
                  {t("video.add")}
                </Button>
              </View>

              {/* Video Listing */}
              <VideoTable
                data={table.data}
                page={table.page}
                rowsPerPage={table.rowsPerPage}
                totalCount={table.total}
                loading={loading}
                onPageChange={table.setPage}
                onRowsPerPageChange={(size) => {
                  table.setRowsPerPage(size);
                  table.setPage(0);
                }}
                onShare={handleShareRequest}
                onUnshare={handleUnShareRequest}
                onDelete={handleDeleteRequest}
              />
            </>
          ) : (
            <>
              <View style={styles.headerRow}>
                <Text
                  variant="titleLarge"
                  style={[styles.heading, { color: colors.primary }]}
                >
                  {t('video.add')}
                </Text>
              </View>

              <VideoUploadForm
                onAddVideo={handleAddVideo}
                setShowAddView={setShowAddView}
                uploading={uploading}
              />
            </>
          )}
        </KeyboardAvoidingView>
      </Surface>

      <DeleteConfirmationDialog
        visible={deleteDialogVisible}
        title={t("video.delete")}
        message={t("video.confirmDelete")}
        onCancel={() => setDeleteDialogVisible(false)}
        onConfirm={confirmDeleteVideo}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    flex: 1,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  heading: {
    fontWeight: "bold",
  },
});
