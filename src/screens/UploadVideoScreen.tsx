import { useCallback, useState } from "react";
import { StyleSheet, View, KeyboardAvoidingView, Platform } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Surface, Text, Button, useTheme } from "react-native-paper";
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
import { extractErrorMessage, sortByDateDesc } from "../utils/common";
import { AppTheme } from "../theme";

export default function UploadVideoScreen() {
  const theme = useTheme<AppTheme>();
  const { colors } = theme;
  const { showToast } = useToast();

  const [videos, setVideos] = useState<any[]>([]);
  const [showAddView, setShowAddView] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const fetchVideos = useCallback(async () => {
    try {
      const response = await getVideos();
      const sortedVideos = sortByDateDesc(
        response?.data && Array.isArray(response.data) ? response.data : [],
        "createdAt"
      );
      setVideos(sortedVideos);
    } catch (error: any) {
      showToast(extractErrorMessage(error, "Failed to load videos"), "error");
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setShowAddView(false);
      fetchVideos();
    }, [fetchVideos])
  );

  const handleAddVideo = async (videoData: any) => {
    try {
      setUploading(true);
      await uploadVideo(videoData);
      setUploading(false);
      await fetchVideos();
      setShowAddView(false);
    } catch (error) {
      showToast(extractErrorMessage(error, "Failed to add video"), "error");
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
      await fetchVideos();
    } catch (error) {
      showToast(extractErrorMessage(error, "Failed to share video"), "error");
    }
  };

  const handleUnShareRequest = async (id: string) => {
    try {
      await shareVideoById(id, false);
      await fetchVideos();
    } catch (error) {
      showToast(extractErrorMessage(error, "Failed to share video"), "error");
    }
  };

  const confirmDeleteVideo = async () => {
    if (selectedVideoId) {
      try {
        await deleteVideoById(selectedVideoId);
        await fetchVideos();
        showToast("Video deleted successfully!", "success");
      } catch (error: any) {
        showToast(
          extractErrorMessage(error, "Failed to delete video"),
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
                  Videos
                </Text>
                <Button
                  mode="contained"
                  icon="plus"
                  onPress={() => setShowAddView(true)}
                  style={{ borderRadius: 6 }}
                  buttonColor={colors.primary}
                  textColor={colors.onPrimary}
                >
                  Add Video(s)
                </Button>
              </View>

              {/* Video Listing */}
              <VideoTable
                videos={videos}
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
                  Add Video
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
        title="Delete Video"
        message="Are you sure you want to delete this video?"
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
