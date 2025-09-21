import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Image,
  Platform,
  Linking,
  PermissionsAndroid,
} from "react-native";
import {
  IconButton,
  Surface,
  Text,
  useTheme,
  Portal,
  Modal,
  Button,
} from "react-native-paper";
import dayjs from "dayjs";
import { useFocusEffect } from "@react-navigation/native";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import CommonTable from "../components/CommonTable";
import { Voter } from "../types/Voter";
import { extractErrorMessage } from "../utils/common";
import { getAuthData } from "../utils/storage";
import { useToast } from "../components/ToastProvider";
import FormDropdown from "../components/FormDropdown";
import { getVotersWithCompletedVideoId } from "../api/voterApi";
import { getVideos } from "../api/videoApi";
import {
  getRegistrationStatus,
  generateQr,
  whatsAppLogout,
  sendVideo,
  getWhatsAppVideoDetails,
} from "../api/whatsappApi";
import { useServerTable } from "../hooks/useServerTable";
import { AppTheme } from "../theme";

let RNFS: any = null;
let Share: any = null;
if (Platform.OS !== "web") {
  RNFS = require("react-native-fs");
  Share = require("react-native-share").default;
}

export default function GeneratedVideoScreen() {
  const theme = useTheme<AppTheme>();
  const styles = createStyles(theme);
  const { colors } = theme;
  const { showToast } = useToast();
  const [baseVideos, setBaseVideos] = useState<any[]>([]);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [waRegistered, setWaRegistered] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null);
  const [waLoading, setWaLoading] = useState(false);

  const fetchVideos = useCallback(async () => {
    try {
      const response = await getVideos(0, 100000);
      const videosData =
        response?.data && Array.isArray(response.data.videos.items)
          ? response.data.videos.items
          : [];

      const transformedVideos = videosData.map((video) => ({
        label: video.campaignName,
        value: video.id,
      }));

      setBaseVideos(transformedVideos);
      if (transformedVideos?.length) {
        setSelectedVideoId((prev) => prev ?? transformedVideos[0]?.value);
      }
    } catch (error: any) {
      showToast(extractErrorMessage(error, "Failed to load videos"), "error");
    }
  }, []);

  const fetchVoters = useCallback(
    async (page: number, pageSize: number, videoId: string | null) => {
      if (!videoId) return { items: [], totalCount: 0 };

      setLoading(true);
      try {
        const response = await getVotersWithCompletedVideoId(
          videoId,
          page,
          pageSize
        );

        return {
          items: Array.isArray(response?.data?.items)
            ? response.data.items
            : [],
          totalCount: response?.data?.totalRecords ?? 0,
        };
      } catch (error: any) {
        showToast(extractErrorMessage(error, "Failed to load voters"), "error");
        return { items: [], totalCount: 0 };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const table = useServerTable<Voter, string>(
    fetchVoters,
    { initialPage: 0, initialRowsPerPage: 10 },
    selectedVideoId
  );

  const loadWhatsAppStatus = useCallback(async () => {
    setWaLoading(true);
    try {
      const { userId } = await getAuthData();
      const response = await getRegistrationStatus(userId);
      const isRegistered = JSON.parse(response.data)?.isReady;

      setWaRegistered(isRegistered);
    } catch (error) {
      setWaRegistered(false);
    } finally {
      setWaLoading(false);
    }
  }, []);

  const handleConnect = async () => {
    setQrImageUrl(null);
    setModalVisible(true);

    try {
      const { userId } = await getAuthData();
      const qrRes = await generateQr(userId);
      const base64Qr = JSON.parse(qrRes.data)?.qr;

      if (base64Qr) {
        setQrImageUrl(base64Qr);
      } else {
        showToast("Failed to generate QR", "error");
        setModalVisible(false);
      }
    } catch (error) {
      console.error("QR Error:", error);
      showToast("Something went wrong while generating QR", "error");
      setModalVisible(false);
    }
  };

  const handleLogout = async () => {
    try {
      const { userId } = await getAuthData();
      const response = await whatsAppLogout(userId);
      const parsedResponse = JSON.parse(response.data);

      if (parsedResponse?.success) {
        showToast(parsedResponse.message, "success");
        setWaRegistered(false);
        setQrImageUrl(null);
      } else {
        showToast("Something went wrong", "error");
      }
    } catch {
      showToast("Logout failed", "error");
    }
  };

  const clearCacheFiles = async () => {
    try {
      const files = await RNFS.readDir(RNFS.CachesDirectoryPath);

      console.log("======Files=======", files);

      for (const file of files) {
        await RNFS.unlink(file.path);
      }

      console.log("Cache cleared successfully");
    } catch (error) {
      console.error("Error clearing cache:", error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchVideos();
      clearCacheFiles();

      if (Platform.OS === "web") {
        loadWhatsAppStatus();
      }
    }, [fetchVideos, loadWhatsAppStatus])
  );

  useEffect(() => {
    const openWhatsApp = async () => {
      const url = "whatsapp://app";

      try {
        const supported = await Linking.canOpenURL(url);

        if (supported) {
          await Linking.openURL(url);
        } else {
          showToast("WhatsApp is not installed", "error");
        }
      } catch (err) {
        console.error("Error opening WhatsApp:", err);
        showToast("Could not open WhatsApp", "error");
      }
    };

    if (modalVisible && Platform.OS !== "web") {
      const timer = setTimeout(() => {
        openWhatsApp();
      }, 800);

      return () => clearTimeout(timer);
    }
  }, [modalVisible]);

  const updateRowStatus = (id: string, newStatus: Partial<Voter>) => {
    table.setData((prev) =>
      prev.map((row) => (row.id === id ? { ...row, ...newStatus } : row))
    );
  };

  const requestAndroidPermissions = async () => {
    if (Platform.OS !== "android") return true;

    try {
      if (Platform.Version >= 33) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } else {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        ]);
        return (
          granted["android.permission.READ_EXTERNAL_STORAGE"] ===
            PermissionsAndroid.RESULTS.GRANTED &&
          granted["android.permission.WRITE_EXTERNAL_STORAGE"] ===
            PermissionsAndroid.RESULTS.GRANTED
        );
      }
    } catch (err) {
      console.warn("Permissions request error", err);
      return false;
    }
  };

  const handleSendVideo = async (item: Voter) => {
    const { userId } = await getAuthData();
    setSendingId(item.id);

    if (Platform.OS === "web") {
      try {
        await sendVideo(
          {
            userId: userId,
            recipientId: item.id,
            baseVideoID: selectedVideoId,
          },
          userId
        );
        showToast("Video sent successfully", "success");
        updateRowStatus(item.id, { sendStatus: "sent" });
      } catch (error) {
        showToast("Error sending video", "error");
        updateRowStatus(item.id, { sendStatus: "pending" });
      } finally {
        setSendingId(null);
      }
    } else {
      let isWhatsAppAvailable = false;
      const whatsAppVideoDetails: any = await getWhatsAppVideoDetails(
        userId,
        item.id,
        selectedVideoId
      );

      if (Platform.OS === "android") {
        try {
          const granted = await requestAndroidPermissions();
          if (!granted) {
            showToast("Storage permissions are required", "error");
            setSendingId(null);
            return;
          }

          const pkgRes = await Share.isPackageInstalled("com.whatsapp");
          isWhatsAppAvailable = pkgRes?.isInstalled;
        } catch {
          isWhatsAppAvailable = false;
        }
      } else {
        try {
          isWhatsAppAvailable = await Linking.canOpenURL("whatsapp://send");
        } catch {
          isWhatsAppAvailable = false;
        }
      }

      if (!isWhatsAppAvailable) {
        showToast("WhatsApp not installed", "error");
        setSendingId(null);
        return;
      }

      try {
        const uniqueFileName = `video_${Date.now()}.mp4`;
        const localPath = `${RNFS.CachesDirectoryPath}/${uniqueFileName}`;

        console.log(
          "=========WhatsAppVideoDetails Url=========",
          whatsAppVideoDetails?.data?.videoUrl
        );

        console.log(
          "=========WhatsAppVideoDetails Message=========",
          whatsAppVideoDetails?.data?.message
        );

        const download = await RNFS.downloadFile({
          fromUrl: whatsAppVideoDetails?.data?.videoUrl,
          toFile: localPath,
        }).promise;

        if (download.statusCode !== 200) {
          console.error("Video download failed");
          updateRowStatus(item.id, { sendStatus: "pending" });
          setSendingId(null);
          return;
        }

        await Share.shareSingle({
          title: "Video",
          url: Platform.OS === "android" ? "file://" + localPath : localPath,
          type: "video/mp4",
          social: Share.Social.WHATSAPP,
          whatsAppNumber: `91${item.phoneNumber}`,
          message: `🙏 ${whatsAppVideoDetails?.data?.message}`,
        });

        updateRowStatus(item.id, { sendStatus: "sent" });
      } catch (err) {
        console.error("Error sending video:", err);
        updateRowStatus(item.id, { sendStatus: "pending" });
      } finally {
        setSendingId(null);
      }
    }
  };

  const columns = [
    { label: "Name", key: "fullName", flex: 0.8 },
    { label: "Mobile", key: "phoneNumber", flex: 0.4 },
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
        const sendStatus = item?.sendStatus?.toLowerCase?.() ?? "pending";
        const disableRowActions = sendingId !== null && sendingId !== item.id;

        return (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {sendingId === item.id ? (
              <View
                style={{
                  width: 40,
                  height: 40,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : !waRegistered && Platform.OS === "web" ? (
              <IconButton
                icon={() => (
                  <FontAwesome
                    name="whatsapp"
                    size={22}
                    color={colors.mediumGray}
                  />
                )}
                style={{ margin: 0 }}
                disabled
              />
            ) : sendStatus === "pending" ? (
              <IconButton
                icon={() => (
                  <FontAwesome
                    name="whatsapp"
                    size={22}
                    color={
                      disableRowActions
                        ? colors.mediumGray
                        : colors.whatsappGreen
                    }
                  />
                )}
                onPress={() => handleSendVideo(item)}
                style={{ margin: 0 }}
                disabled={disableRowActions}
              />
            ) : (
              <IconButton
                icon={() => (
                  <FontAwesome
                    name="check-circle"
                    size={22}
                    color={colors.success}
                  />
                )}
                disabled
                style={{ margin: 0 }}
              />
            )}
          </View>
        );
      },
    },
  ];

  return (
    <Surface style={styles.container} elevation={2}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text variant="titleLarge" style={styles.heading}>
          Generated Videos
        </Text>
      </View>

      {Platform.OS === "web" && (
        <Surface style={styles.toolbar} elevation={1}>
          <FormDropdown
            label="Select Campaign"
            value={selectedVideoId}
            options={baseVideos}
            noMargin={true}
            onSelect={(val) => setSelectedVideoId(val)}
          />

          <View
            style={[
              styles.waChip,
              {
                backgroundColor: waRegistered
                  ? colors.successBackground
                  : colors.errorBackground,
                borderColor: waRegistered ? colors.success : colors.error,
                gap: 12,
              },
            ]}
          >
            <FontAwesome
              name="whatsapp"
              size={24}
              color={waRegistered ? colors.whatsappGreen : colors.errorIcon}
            />

            <View style={{ flex: 1 }}>
              {waLoading ? (
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
                >
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text
                    style={[styles.waChipText, { color: colors.textSecondary }]}
                  >
                    Checking status...
                  </Text>
                </View>
              ) : (
                <>
                  <Text
                    style={[
                      styles.waChipText,
                      {
                        color: waRegistered
                          ? colors.successText
                          : colors.errorText,
                      },
                    ]}
                  >
                    {waRegistered ? "Connected to WhatsApp" : "Not Connected"}
                  </Text>
                  <Text style={styles.waChipSubText}>
                    {waRegistered
                      ? "You can now share videos directly"
                      : "Please connect to start sharing"}
                  </Text>
                </>
              )}
            </View>

            {!waLoading && (
              <Button
                mode={waRegistered ? "outlined" : "contained"}
                compact
                onPress={() => {
                  waRegistered ? handleLogout() : handleConnect();
                }}
                textColor={waRegistered ? colors.deepRed : colors.white}
                buttonColor={
                  waRegistered ? "transparent" : colors.whatsappGreen
                }
                style={{
                  borderRadius: 20,
                  borderColor: waRegistered
                    ? colors.deepRed
                    : colors.whatsappGreen,
                }}
                labelStyle={{ fontSize: 13, fontWeight: "600" }}
              >
                {waRegistered ? "Logout" : "Connect"}
              </Button>
            )}
          </View>
        </Surface>
      )}

      {/* Mobile top compact toolbar (contains campaign dropdown) */}
      {Platform.OS !== "web" && (
        <View style={styles.mobileToolbar}>
          <FormDropdown
            label="Select Campaign"
            value={selectedVideoId}
            options={baseVideos}
            noMargin
            onSelect={(val) => setSelectedVideoId(val)}
          />
        </View>
      )}

      {/* Table */}
      <View style={{ flex: 1 }}>
        <CommonTable
          data={table.data}
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
          tableHeight={
            Platform.OS === "web" ? "calc(100vh - 345px)" : undefined
          }
          onPageChange={table.setPage}
          onRowsPerPageChange={(size) => {
            table.setRowsPerPage(size);
            table.setPage(0);
          }}
          page={table.page}
          rowsPerPage={table.rowsPerPage}
          totalCount={table.total}
        />
      </View>

      {/* WhatsApp QR Modal */}
      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Surface style={styles.modalCard} elevation={3}>
            <Text style={styles.modalTitle}>Register on WhatsApp</Text>
            <Text style={styles.modalSubtitle}>
              Link your WhatsApp account by scanning the QR code below
            </Text>

            <View style={styles.qrWrapper}>
              {qrImageUrl ? (
                <Image source={{ uri: qrImageUrl }} style={styles.qrImage} />
              ) : (
                <ActivityIndicator size="large" color={colors.primary} />
              )}
            </View>

            <Text style={styles.modalHint}>
              Open WhatsApp → Settings → Linked Devices → Scan QR
            </Text>

            <Button
              mode="contained"
              style={styles.closeButton}
              buttonColor={colors.primary}
              textColor={colors.white}
              onPress={() => setModalVisible(false)}
            >
              Close
            </Button>
          </Surface>
        </Modal>
      </Portal>
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
      color: theme.colors.primary,
    },
    headerRow: {
      marginBottom: 12,
    },
    toolbar: {
      flexDirection: "row",
      alignItems: "center",
      padding: 8,
      borderRadius: 4,
      backgroundColor: theme.colors.paperBackground,
      borderWidth: 1,
      borderColor: theme.colors.subtleBorder,
      marginBottom: 12,
      justifyContent: "space-between",
    },
    mobileToolbar: {
      paddingVertical: 6,
      paddingHorizontal: 2,
      marginBottom: 6,
    },
    waChip: {
      flexDirection: "row",
      alignItems: "center",
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderWidth: 1,
      shadowColor: theme.colors.black,
      shadowOpacity: 0.05,
      shadowRadius: 6,
      elevation: 2,
    },
    waChipText: {
      fontSize: 15,
      marginBottom: 2,
    },
    waChipSubText: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    fab: {
      position: "absolute",
      bottom: 20,
      right: 20,
      borderRadius: 28,
      elevation: 5,
      shadowColor: theme.colors.black,
      shadowOpacity: 0.15,
      shadowRadius: 6,
    },
    modalContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 16,
    },
    modalCard: {
      width: "90%",
      maxWidth: 420,
      backgroundColor: theme.colors.white,
      borderRadius: 16,
      padding: 20,
      alignItems: "center",
      borderWidth: 1,
      borderColor: theme.colors.mutedBorder,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: "700",
      textAlign: "center",
      marginBottom: 8,
      color: theme.colors.primary,
    },
    modalSubtitle: {
      fontSize: 14,
      textAlign: "center",
      color: theme.colors.textSecondary,
      marginBottom: 20,
    },
    qrWrapper: {
      width: 220,
      height: 220,
      borderRadius: 12,
      backgroundColor: theme.colors.lightBackground,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 16,
      elevation: 1,
    },
    qrImage: {
      width: 200,
      height: 200,
      borderRadius: 12,
    },
    modalHint: {
      fontSize: 13,
      color: theme.colors.darkGrayText,
      textAlign: "center",
      marginBottom: 20,
    },
    closeButton: {
      marginTop: 8,
      alignSelf: "stretch",
      borderRadius: 8,
    },
  });
