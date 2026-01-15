import React, { useCallback, useEffect, useState } from "react";
import { View, StyleSheet, Platform } from "react-native";
import {
  IconButton,
  Surface,
  Text,
  useTheme,
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
import { getRecipientsWithCompletedVideoId } from "../api/recipientApi";
import { getVideos } from "../api/videoApi";
import { sendVideo } from "../api/whatsappApi";
import { useServerTable } from "../hooks/useServerTable";
import { usePlatformInfo } from "../hooks/usePlatformInfo";
import ResponsiveKeyboardView from "../components/ResponsiveKeyboardView";
import { FixedLabel } from "../components/FixedLabel";
import { AppTheme } from "../theme";

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
  const [progressMap, setProgressMap] = useState<Record<string, number>>({});
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
            noMargin
          />
        </View>
      </>
    );
  }, [selectedVideoId, baseVideos, t]);

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
      fetchVideos();
    }, [fetchVideos])
  );

  const updateRowStatus = (id: string, newStatus: Partial<Recipient>) => {
    table.setData((prev) =>
      prev.map((row) => (row.id === id ? { ...row, ...newStatus } : row))
    );
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
        const disableRowActions = sendingId !== null && sendingId !== item.id;
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

      {isWeb && !isMobileWeb && <>{memoizedDropdown}</>}

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
