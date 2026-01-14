import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Image,
  Platform,
  Linking,
  PermissionsAndroid,
  AppState,
} from "react-native";
import {
  IconButton,
  Surface,
  Text,
  useTheme,
  Portal,
  Modal,
  Button,
  ProgressBar,
} from "react-native-paper";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import { useFocusEffect } from "@react-navigation/native";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import CommonTable from "../components/CommonTable";
import { Recipient } from "../types/Recipient";
import { extractErrorMessage } from "../utils/common";
import { getAuthData } from "../utils/storage";
import { useToast } from "../components/ToastProvider";
import FormDropdown from "../components/FormDropdown";
import SendConfirmationDialog from "../components/SendConfirmationDialog";
import { getRecipientsWithCompletedVideoId } from "../api/recipientApi";
import { getVideos } from "../api/videoApi";
import {
  getRegistrationStatus,
  generateQr,
  whatsAppLogout,
  sendVideo,
  getWhatsAppVideoDetails,
  markVideoSent,
} from "../api/whatsappApi";
import { useServerTable } from "../hooks/useServerTable";
import { usePlatformInfo } from "../hooks/usePlatformInfo";
import ResponsiveKeyboardView from "../components/ResponsiveKeyboardView";
import { FixedLabel } from "../components/FixedLabel";
import { AppTheme } from "../theme";

let RNFS: any = null;
let Share: any = null;
let Contacts: any = null;

if (Platform.OS !== "web") {
  RNFS = require("react-native-fs");
  Share = require("react-native-share").default;
  if (Platform.OS === "android") {
    Contacts =
      require("react-native-contacts").default ||
      require("react-native-contacts");
  }
}

export default function GeneratedVideoScreen() {
  const { isWeb, isMobileWeb } = usePlatformInfo();
  const { t } = useTranslation();
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
  const [progressMap, setProgressMap] = useState<Record<string, number>>({});
  const [openSentPopup, setOpenSentPopup] = useState(false);
  const [pendingConfirmationId, setPendingConfirmationId] = useState<
    string | null
  >(null);
  const [searchText, setSearchText] = useState("");
  const [tableParams, setTableParams] = useState<{
    videoId: string | null;
    searchText: string;
  }>({
    videoId: null,
    searchText: "",
  });

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
      showToast(
        extractErrorMessage(error, t("video.loadVideoFailMessage")),
        "error"
      );
    }
  }, []);

  const fetchVoters = useCallback(
    async (
      page: number,
      pageSize: number,
      params?: { videoId?: string | null; searchText?: string }
    ) => {
      if (!params?.videoId) return { items: [], totalCount: 0 };

      setLoading(true);
      try {
        const response = await getRecipientsWithCompletedVideoId(
          params.videoId,
          page,
          pageSize,
          params?.searchText ?? ""
        );

        return {
          items: Array.isArray(response?.data?.items)
            ? response.data.items
            : [],
          totalCount: response?.data?.totalRecords ?? 0,
        };
      } catch (error: any) {
        showToast(
          extractErrorMessage(error, t("voter.loadVoterFailMessage")),
          "error"
        );
        return { items: [], totalCount: 0 };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const table = useServerTable<
    Recipient,
    { videoId: string | null; searchText: string }
  >(fetchVoters, { initialPage: 0, initialRowsPerPage: 10 }, tableParams);

  const memoizedDropdown = React.useMemo(() => {
    return (
      <>
        <FixedLabel label={t("campaign")} />
        <View style={{ width: 300 }}>
          <FormDropdown
            placeholder={t("selectCampaign")}
            value={selectedVideoId}
            options={baseVideos}
            onSelect={(val) => setSelectedVideoId(val)}
          />
        </View>
      </>
    );
  }, [selectedVideoId, baseVideos, t]);

  const loadWhatsAppStatus = useCallback(async () => {
    setWaLoading(true);
    try {
      const { userId } = await getAuthData();
      const response = await getRegistrationStatus(userId);
      const isRegistered = JSON.parse(response.data)?.isReady;
      setWaRegistered(isRegistered);
    } catch (error) {
      setWaRegistered(true);
      // showToast(
      //   extractErrorMessage(error, t("whatsapp.loadStatusFail")),
      //   "error"
      // );
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
        showToast(t("whatsapp.qrGenerationFail"), "error");
        setModalVisible(false);
      }
    } catch (error) {
      showToast(
        extractErrorMessage(error, t("whatsapp.qrGenerationFail")),
        "error"
      );
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
        showToast(t("somethingWentWrong"), "error");
      }
    } catch (error: any) {
      showToast(extractErrorMessage(error, t("logoutFailed")), "error");
    }
  };

  const clearAllTempContacts = async () => {
    if (Platform.OS !== "android") return;

    try {
      const contacts = await Contacts.getAll();
      const tempContacts = contacts.filter((c) => {
        const fieldsToCheck = [
          c.displayName,
          c.givenName,
          c.familyName,
          c.middleName,
        ];

        return fieldsToCheck.some((field) => field?.includes("_AbhiyanAI_"));
      });

      for (const contact of tempContacts) {
        try {
          await Contacts.deleteContact(contact);
          console.log("Deleted temp contact:", contact.givenName);
        } catch (err) {
          console.warn("Failed to delete temp contact", contact.givenName, err);
        }
      }
    } catch (err) {
      console.error("Error clearing temp contacts", err);
    }
  };

  const clearCacheFiles = async () => {
    if ((isWeb && !isMobileWeb) || !RNFS) return;

    try {
      const files = await RNFS.readDir(RNFS.CachesDirectoryPath);
      for (const file of files) {
        await RNFS.unlink(file.path);
      }
    } catch (error) {
      console.error("Error clearing cache:", error);
    }
  };

  useEffect(() => {
    setTableParams((prev) => ({
      ...prev,
      videoId: selectedVideoId,
    }));
    table.setPage(0);
  }, [selectedVideoId]);

  useFocusEffect(
    useCallback(() => {
      setSelectedVideoId(null);
      clearAllTempContacts();
      fetchVideos();
      clearCacheFiles();

      if (isWeb && !isMobileWeb) {
        // loadWhatsAppStatus();
      }
    }, [fetchVideos, loadWhatsAppStatus])
  );

  useEffect(() => {
    const openWhatsApp = async () => {
      const url = "whatsapp://app";

      try {
        const supported = await Linking.canOpenURL(url);
        if (supported) await Linking.openURL(url);
        else showToast(t("whatsapp.notInstalled"), "error");
      } catch (err) {
        console.error("Error opening WhatsApp:", err);
        showToast(t("notOpenWhatsApp"), "error");
      }
    };

    if (modalVisible && Platform.OS !== "web") {
      const timer = setTimeout(() => {
        openWhatsApp();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [modalVisible]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active" && pendingConfirmationId) {
        setOpenSentPopup(true);
      }
    });

    return () => subscription.remove();
  }, [pendingConfirmationId]);

  const updateRowStatus = (id: string, newStatus: Partial<Recipient>) => {
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
          PermissionsAndroid.PERMISSIONS.WRITE_CONTACTS,
        ]);
        return (
          granted["android.permission.READ_EXTERNAL_STORAGE"] ===
            PermissionsAndroid.RESULTS.GRANTED &&
          granted["android.permission.WRITE_EXTERNAL_STORAGE"] ===
            PermissionsAndroid.RESULTS.GRANTED &&
          granted["android.permission.WRITE_CONTACTS"] ===
            PermissionsAndroid.RESULTS.GRANTED
        );
      }
    } catch (err) {
      console.warn("Permissions request error", err);
      return false;
    }
  };

  const downloadVideo = async (url: string, voterId: string) => {
    const localPath = `${RNFS.CachesDirectoryPath}/video_${Date.now()}.mp4`;

    const download = RNFS.downloadFile({
      fromUrl: url,
      toFile: localPath,
      progress: ({ bytesWritten, contentLength }) => {
        const percentage = bytesWritten / contentLength;
        setProgressMap((prev) => ({ ...prev, [voterId]: percentage }));
      },
      progressDivider: 1,
    });

    const result = await download.promise;
    setProgressMap((prev) => ({ ...prev, [voterId]: 1 }));
    if (result.statusCode === 200) {
      return `file://${localPath}`;
    } else {
      console.error("Download failed");
    }
  };

  const handleSendVideo = async (item: Recipient) => {
    const { userId, channelId } = await getAuthData();
    setSendingId(item.id);
    setProgressMap((prev) => ({ ...prev, [item.id]: 0 }));

    try {
      await sendVideo(
        {
          channelId: channelId,
          recipientId: item.id,
          campaignID: selectedVideoId,
        },
        userId
      );
      showToast(t("video.sendSuccess"), "success");
      updateRowStatus(item.id, { sendStatus: "sent" });
    } catch (error) {
      showToast(extractErrorMessage(error, t("video.sendFail")), "error");
      updateRowStatus(item.id, { sendStatus: "pending" });
    } finally {
      setSendingId(null);
      setProgressMap((prev) => {
        const { [item.id]: _, ...rest } = prev;
        return rest;
      });
    }

    // // --- Mobile flow ---
    // let isWhatsAppAvailable = false;
    // const whatsAppVideoDetails: any = await getWhatsAppVideoDetails(
    //   userId,
    //   item.id,
    //   selectedVideoId
    // );

    // // Platform-specific availability check
    // if (Platform.OS === "android") {
    //   try {
    //     const granted = await requestAndroidPermissions();
    //     if (!granted) {
    //       showToast("Storage & Contacts permissions are required", "error");
    //       setSendingId(null);
    //       return;
    //     }

    //     const personal = await Share.isPackageInstalled("com.whatsapp");
    //     const business = await Share.isPackageInstalled("com.whatsapp.w4b");
    //     isWhatsAppAvailable = personal?.isInstalled || business?.isInstalled;
    //   } catch {
    //     isWhatsAppAvailable = false;
    //   }
    // } else {
    //   try {
    //     isWhatsAppAvailable = await Linking.canOpenURL("whatsapp://send");
    //   } catch {
    //     isWhatsAppAvailable = false;
    //   }
    // }

    // if (!isWhatsAppAvailable) {
    //   showToast(t("whatsapp.notInstalled"), "error");
    //   setSendingId(null);
    //   return;
    // }

    // // --- Share video flow ---
    // try {
    //   let savedContact: any = null;
    //   let contactExists = false;

    //   if (Platform.OS === "android") {
    //     const phoneNumber = item.phoneNumber.replace(/\D/g, "");

    //     // Check if contact already exists
    //     const allContacts = await Contacts.getAll();
    //     const existing = allContacts.find((c) =>
    //       c.phoneNumbers?.some(
    //         (p) =>
    //           p.number.replace(/\D/g, "").endsWith(phoneNumber) ||
    //           phoneNumber.endsWith(p.number.replace(/\D/g, ""))
    //       )
    //     );

    //     if (existing) {
    //       console.log("Contact already exists:", existing.displayName);
    //       contactExists = true;
    //     } else {
    //       const tempContact = {
    //         givenName: `${item.fullName}_AbhiyanAI_${item.id}`,
    //         phoneNumbers: [{ label: "mobile", number: item.phoneNumber }],
    //       };
    //       savedContact = await Contacts.addContact(tempContact);
    //       console.log("Saved new temp contact:", savedContact);
    //       contactExists = true;
    //     }
    //   }

    //   // Download video before sharing
    //   const localPath = await downloadVideo(
    //     whatsAppVideoDetails?.data?.videoUrl,
    //     item.id
    //   );

    //   // Only proceed if contact exists
    //   if (contactExists) {
    //     await new Promise((r) => setTimeout(r, 1500));

    //     if (Platform.OS === "android") {
    //       await Share.shareSingle({
    //         title: "Video",
    //         url: localPath,
    //         type: "video/mp4",
    //         social: Share.Social.WHATSAPP,
    //         whatsAppNumber: `91${item.phoneNumber}`,
    //         message: `🙏 ${whatsAppVideoDetails?.data?.message}`,
    //       });
    //     } else {
    //       await Share.shareSingle({
    //         title: "Video",
    //         url: Platform.OS === "ios" ? localPath : "file://" + localPath,
    //         type: "video/mp4",
    //         social: Share.Social.WHATSAPP,
    //         whatsAppNumber: `91${item.phoneNumber}`,
    //         message: `🙏 ${whatsAppVideoDetails?.data?.message}`,
    //       });
    //     }
    //   } else {
    //     console.log("Contact not found. Please check the number.", "error");
    //   }

    //   setPendingConfirmationId(item.id);

    //   // Delete only temp contact (not existing ones)
    //   if (Platform.OS === "android" && savedContact?.recordID) {
    //     setTimeout(async () => {
    //       try {
    //         await Contacts.deleteContact(savedContact);
    //         console.log("Deleted temp contact:", savedContact.givenName);
    //       } catch (err) {
    //         console.warn("Failed to delete temp contact", err);
    //       }
    //     }, 5000);
    //   }
    // } catch (err) {
    //   console.error("Error sending video:", err);
    //   updateRowStatus(item.id, { sendStatus: "pending" });
    //   showToast(t("video.sendFail"), "error");
    // } finally {
    //   setProgressMap((prev) => {
    //     const { [item.id]: _, ...rest } = prev;
    //     return rest;
    //   });
    // }
  };

  const confirmVideoSent = async () => {
    try {
      await markVideoSent({
        recepientId: sendingId,
        baseVideoId: selectedVideoId,
      });
      updateRowStatus(sendingId, { sendStatus: "sent" });
      showToast(t("video.sendSuccess"), "success");
    } catch (error) {
      showToast(
        extractErrorMessage(error, t("video.markSendVideoError")),
        "error"
      );
    } finally {
      setOpenSentPopup(false);
      setPendingConfirmationId(null);
      setSendingId(null);
      clearAllTempContacts();
    }
  };

  const columns = [
    { label: t("name"), key: "fullName", flex: 0.8 },
    { label: t("mobile"), key: "phoneNumber", flex: 0.4 },
    {
      label: t("createdAt"),
      key: "createdAt",
      flex: 0.4,
      render: (item) =>
        item.createdAt
          ? dayjs(item.createdAt).format("DD MMM YYYY, hh:mm A")
          : "-",
    },
    {
      label: t("actions"),
      key: "actions",
      flex: 1,
      smallColumn: true,
      render: (item: Recipient) => {
        const sendStatus = item?.sendStatus?.toLowerCase?.() ?? "pending";
        const disableRowActions =
          (sendingId !== null && sendingId !== item.id) ||
          pendingConfirmationId !== null;
        const progress = progressMap[item.id];

        return (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {sendingId === item.id && progress !== undefined ? (
              <View style={{ width: 40, alignItems: "center" }}>
                <Text style={{ fontSize: 12, color: colors.primary }}>
                  {Math.floor(progress * 100)}%
                </Text>
                <ProgressBar
                  progress={progress}
                  color={colors.primary}
                  style={{
                    width: 36,
                    height: 4,
                    borderRadius: 2,
                    marginTop: 2,
                  }}
                />
              </View>
            ) : // : !waRegistered && isWeb && !isMobileWeb ? (
            //   <IconButton
            //     icon={() => (
            //       <FontAwesome
            //         name="whatsapp"
            //         size={22}
            //         color={colors.mediumGray}
            //       />
            //     )}
            //     style={{ margin: 0 }}
            //     disabled
            //   />
            // )
            sendStatus === "pending" ? (
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

  const handleVoterSearch = useCallback(
    (text: string) => {
      setSearchText(text);
      setTableParams((prev) => ({
        ...prev,
        searchText: text,
      }));
      table.setPage(0);
    },
    [table]
  );

  return (
    <Surface style={styles.container} elevation={2}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text variant="titleLarge" style={styles.heading}>
          {t("generatedVideoPageLabel")}
        </Text>
      </View>

      {isWeb && !isMobileWeb && (
        <>
          {memoizedDropdown}

          {/* <View
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
                    {t("whatsapp.checkingStatus")}
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
                    {waRegistered
                      ? t("whatsapp.connected")
                      : t("whatsapp.notConnected")}
                  </Text>
                  <Text style={styles.waChipSubText}>
                    {waRegistered
                      ? t("whatsapp.shareDirectly")
                      : t("whatsapp.connectToShare")}
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
                {waRegistered ? t("logout") : t("connect")}
              </Button>
            )}
          </View> */}
        </>
      )}

      {/* Mobile top compact toolbar (contains campaign dropdown) */}
      {Platform.OS !== "web" && (
        <View style={styles.mobileToolbar}>{memoizedDropdown}</View>
      )}

      {/* Table */}
      <ResponsiveKeyboardView>
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
            emptyText={t("video.noData")}
            tableHeight={
              isWeb && !isMobileWeb ? "calc(100vh - 345px)" : undefined
            }
            tableType="tableUnderDropdown"
            enableSearch
            onSearchChange={(filters) => {
              handleVoterSearch(filters.search);
            }}
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
      </ResponsiveKeyboardView>

      {/* WhatsApp QR Modal */}
      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Surface style={styles.modalCard} elevation={3}>
            <Text style={styles.modalTitle}>{t("whatsapp.register")}</Text>
            <Text style={styles.modalSubtitle}>{t("whatsapp.link")}</Text>

            <View style={styles.qrWrapper}>
              {qrImageUrl ? (
                <Image source={{ uri: qrImageUrl }} style={styles.qrImage} />
              ) : (
                <ActivityIndicator size="large" color={colors.primary} />
              )}
            </View>

            <Text style={styles.modalHint}>{t("whatsapp.scanQR")}</Text>

            <Button
              mode="contained"
              style={styles.closeButton}
              buttonColor={colors.primary}
              textColor={colors.white}
              onPress={() => setModalVisible(false)}
            >
              {t("close")}
            </Button>
          </Surface>
        </Modal>
      </Portal>

      <SendConfirmationDialog
        type="video"
        visible={openSentPopup}
        onCancel={() => {
          setSendingId(null);
          setOpenSentPopup(false);
          setPendingConfirmationId(null);
          clearAllTempContacts();
        }}
        onConfirm={confirmVideoSent}
      />
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
