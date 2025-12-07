import React, { useCallback, useState } from "react";
import { StyleSheet, View } from "react-native";
import { RadioButton, useTheme } from "react-native-paper";
import { useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import CommonTable from "./CommonTable";
import { getVideos } from "../api/videoApi";
import { useToast } from "./ToastProvider";
import { useVideoPreview } from "./VideoPreviewContext";
import { extractErrorMessage, sortByDateDesc } from "../utils/common";
import { useServerTable } from "../hooks/useServerTable";
import { GetPaginatedVideos } from "../types/Video";
import { AppTheme } from "../theme";

type BaseVideo = {
  id: string;
  campaign: string;
};

export default function SelectBaseVideo({ stepData, setStepData }) {
  const { t } = useTranslation();
  const theme = useTheme<AppTheme>();
  const styles = createStyles(theme);
  const { colors } = theme;
  const { open } = useVideoPreview();
  const { showToast } = useToast();
  const [loading, showLoading] = useState(false);

  const fetchVideos = useCallback(async (page: number, pageSize: number) => {
    showLoading(true);
    try {
      const response = await getVideos(page, pageSize);
      const sortedVideos = sortByDateDesc(
        response?.data && Array.isArray(response.data.videos.items)
          ? response.data.videos.items
          : [],
        "createdAt"
      );

      setStepData((prev) => ({
        ...prev,
        0: prev[0]
          ? prev[0]
          : sortedVideos.length > 0
          ? sortedVideos[0].id
          : null,
      }));

      return {
        items: sortedVideos ?? [],
        totalCount: response?.data?.totalRecords ?? 0,
      };
    } catch (error: any) {
      showToast(extractErrorMessage(error, t("video.loadVideoFailMessage")), "error");
    } finally {
      showLoading(false);
    }
  }, []);

  const table = useServerTable<GetPaginatedVideos>(fetchVideos, {
    initialPage: 0,
    initialRowsPerPage: 10,
  });

  useFocusEffect(
    useCallback(() => {
      table.setPage(0);
      table.setRowsPerPage(10);
      table.fetchData(0, 10);
    }, [])
  );

  const columns = [
    {
      label: "",
      key: "radio",
      flex: 0.1,
      smallColumn: true,
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
      label: t("campaign"),
      key: "campaignName" as const,
      flex: 1.8,
    },
    {
      label: t("actions"),
      key: "actions",
      flex: 1,
      smallColumn: true,
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
        data={table.data}
        columns={customColumns}
        keyExtractor={(item) => item.id}
        emptyIcon={
          <Ionicons
            name="videocam-outline"
            size={48}
            color={colors.disabledText}
          />
        }
        emptyText={t("video.noData")}
        loading={loading}
        tableWithSelection={true}
        tableHeight={"calc(100vh - 330px)"}
        page={table.page}
        rowsPerPage={table.rowsPerPage}
        totalCount={table.total}
        onPageChange={table.setPage}
        onRowsPerPageChange={(size) => {
          table.setRowsPerPage(size);
          table.setPage(0);
        }}
      />
    </View>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    actions: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      marginLeft: 10,
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
