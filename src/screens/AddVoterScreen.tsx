import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  StyleSheet,
  useWindowDimensions,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Text, useTheme, Surface, Button } from "react-native-paper";
import { useTranslation } from "react-i18next";
import { useFocusEffect } from "@react-navigation/native";
import {
  TabView,
  TabBar,
  TabBarItem,
  SceneRendererProps,
} from "react-native-tab-view";
import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import VoterForm from "../components/VoterForm";
import VoterUpload from "../components/VoterUpload";
import VoterTable from "../components/VoterTable";
import DeleteConfirmationDialog from "../components/DeleteConfirmationDialog";
import { useToast } from "../components/ToastProvider";
import { CreateVoterPayload, EditVoterPayload, Voter } from "../types/Voter";
import { useServerTable } from "../hooks/useServerTable";
import { usePlatformInfo } from "../hooks/usePlatformInfo";
import {
  createVoter,
  deleteVoterById,
  editVoterById,
  getVoters,
} from "../api/voterApi";
import { extractErrorMessage } from "../utils/common";
import { AppTheme } from "../theme";

type TabRoute = {
  key: string;
  title: string;
};

export default function AddVoterScreen() {
  const { isIOS } = usePlatformInfo();
  const { t } = useTranslation();
  const theme = useTheme<AppTheme>();
  const { colors } = theme;
  const layout = useWindowDimensions();
  const { showToast } = useToast();

  const [index, setIndex] = useState(0);
  const [showAddVoterView, setShowAddVoterView] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [selectedVoterId, setSelectedVoterId] = useState<string | null>(null);
  const [voterToEdit, setVoterToEdit] = useState<Voter | null>(null);
  const [searchText, setSearchText] = useState("");
  const [tableParams, setTableParams] = useState<{ searchText?: string }>({
    searchText: "",
  });

  const routes = useMemo(
    () => [
      { key: "manual", title: t("voter.registerVoter") },
      { key: "excel", title: t("voter.bulkRegister") },
    ],
    [t]
  );

  const fetchVoters = useCallback(
    async (
      page: number,
      pageSize: number,
      params?: { searchText?: string }
    ) => {
      const response = await getVoters(
        page,
        pageSize,
        params?.searchText ?? ""
      );
      return {
        items: Array.isArray(response?.data?.items) ? response.data.items : [],
        totalCount: response?.data?.totalRecords ?? 0,
      };
    },
    []
  );

  const table = useServerTable<Voter, { searchText?: string }>(
    fetchVoters,
    { initialPage: 0, initialRowsPerPage: 10 },
    tableParams
  );

  useFocusEffect(
    useCallback(() => {
      setShowAddVoterView(false);
      setVoterToEdit(null);
      table.setPage(0);
      table.setRowsPerPage(10);
      table.fetchData(0, 10);
    }, [])
  );

  const handleVoterSearch = useCallback(
    (text: string) => {
      setSearchText(text);
      setTableParams({ searchText: text });
      table.setPage(0);
    },
    [table]
  );

  const addVoter = async (voterData: CreateVoterPayload) => {
    try {
      await createVoter(voterData);
      table.fetchData(0, table.rowsPerPage, { searchText: "" });
      setSearchText("");
      showToast(t("voter.addSuccess"), "success");
      setShowAddVoterView(false);
      setVoterToEdit(null);
    } catch (error: any) {
      showToast(extractErrorMessage(error, t("voter.addFailed")), "error");
    }
  };

  const editVoter = async (voterData: EditVoterPayload) => {
    if (!voterToEdit) return;
    try {
      await editVoterById(voterToEdit.id, voterData);
      await table.fetchData(table.page, table.rowsPerPage, { searchText: "" });
      setSearchText("");
      showToast(t("voter.editSuccess"), "success");
      setShowAddVoterView(false);
      setVoterToEdit(null);
    } catch (error: any) {
      showToast(extractErrorMessage(error, t("voter.editFailed")), "error");
    }
  };

  const handleEdit = (item: Voter) => {
    setVoterToEdit(item);
    setShowAddVoterView(true);
  };

  const handleDeleteRequest = (id: string) => {
    setSelectedVoterId(id);
    setDeleteDialogVisible(true);
  };

  const confirmDeleteVoter = async () => {
    if (selectedVoterId) {
      try {
        await deleteVoterById(selectedVoterId);
        setSearchText("");
        table.fetchData(table.page, table.rowsPerPage, { searchText: "" });
        showToast(t("voter.deleteSucess"), "success");
      } catch (error: any) {
        showToast(extractErrorMessage(error, t("voter.deleteFail")), "error");
      }
      setSelectedVoterId(null);
      setDeleteDialogVisible(false);
    }
  };

  const downloadSampleExcel = async () => {
    try {
      if (Platform.OS === "web") {
        const link = document.createElement("a");
        link.href = "/sample-voter-upload.xlsx";
        link.download = "sample-voter-upload.xlsx";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        const asset = Asset.fromModule(
          require("../assets/sample-voter-upload.xlsx")
        );
        await asset.downloadAsync();
        const dest = `${FileSystem.cacheDirectory}sample-voter-upload.xlsx`;
        await FileSystem.copyAsync({
          from: asset.localUri || asset.uri,
          to: dest,
        });
        await Sharing.shareAsync(dest);
      }
    } catch (error) {
      console.error(t("voter.excelDownloadFail"), error);
    }
  };

  const renderScene = ({ route }) => {
    switch (route.key) {
      case "manual":
        return (
          <VoterForm
            mode="create"
            onCreate={addVoter}
            voterToEdit={null}
            setVoterToEdit={setVoterToEdit}
            setShowAddVoterView={setShowAddVoterView}
          />
        );
      case "excel":
        return (
          <View style={{ flex: 1 }}>
            <View style={styles.downloadBtnWrapper}>
              <Button
                mode="outlined"
                icon="download"
                onPress={downloadSampleExcel}
                textColor={colors.greenAccent}
                style={{ borderRadius: 8, borderColor: colors.greenAccent }}
              >
                {t("voter.downloadSample")}
              </Button>
            </View>
            <VoterUpload
              fetchVoters={() => {
                table.fetchData(0, table.rowsPerPage, { searchText: "" });
                setSearchText("");
              }}
              setShowAddVoterView={setShowAddVoterView}
            />
          </View>
        );
      default:
        return null;
    }
  };

  const renderTabBar = (
    props: SceneRendererProps & {
      navigationState: { index: number; routes: TabRoute[] };
    }
  ) => (
    <TabBar
      {...props}
      indicatorStyle={{ backgroundColor: colors.warning, height: 3 }}
      style={{ backgroundColor: colors.white, elevation: 2 }}
      renderTabBarItem={({ route, key, ...rest }) => {
        const focused =
          props.navigationState.index ===
          props.navigationState.routes.findIndex((r) => r.key === route.key);
        return (
          <TabBarItem
            {...rest}
            key={key}
            route={route}
            labelText={route.title}
            labelStyle={{
              color: focused ? colors.warning : colors.darkGrayText,
              fontWeight: focused ? "600" : "500",
              fontSize: 14,
              textTransform: "capitalize",
              marginVertical: 8,
            }}
          />
        );
      }}
    />
  );

  return (
    <>
      <Surface style={styles.container} elevation={1}>
        <View style={styles.header}>
          <Text
            variant="titleLarge"
            style={[styles.heading, { color: theme.colors.primary }]}
          >
            {showAddVoterView
              ? voterToEdit
                ? t("voter.edit")
                : t("voter.add")
              : t("voter.plural")}
          </Text>

          {!showAddVoterView && (
            <Button
              mode="contained"
              onPress={() => setShowAddVoterView(true)}
              icon="plus"
              labelStyle={{
                fontWeight: "bold",
                fontSize: 14,
                color: theme.colors.onPrimary,
              }}
              buttonColor={theme.colors.primary}
              style={{ borderRadius: 5 }}
            >
              {t("voter.add")}
            </Button>
          )}
        </View>

        {showAddVoterView ? (
          <KeyboardAvoidingView
            behavior={isIOS ? "padding" : undefined}
            style={{ flex: 1 }}
          >
            {voterToEdit ? (
              <VoterForm
                mode="edit"
                onCreate={voterToEdit ? editVoter : addVoter}
                voterToEdit={voterToEdit}
                setVoterToEdit={setVoterToEdit}
                setShowAddVoterView={setShowAddVoterView}
              />
            ) : (
              <TabView
                navigationState={{ index, routes }}
                renderScene={renderScene}
                renderTabBar={renderTabBar}
                onIndexChange={setIndex}
                initialLayout={{ width: layout.width }}
                swipeEnabled={false}
                lazy
              />
            )}
          </KeyboardAvoidingView>
        ) : (
          <VoterTable
            data={table.data}
            page={table.page}
            rowsPerPage={table.rowsPerPage}
            totalCount={table.total}
            loading={table.loading}
            onPageChange={table.setPage}
            onRowsPerPageChange={(size) => {
              table.setRowsPerPage(size);
              table.setPage(0);
            }}
            onEdit={handleEdit}
            onDelete={handleDeleteRequest}
            handleVoterSearch={handleVoterSearch}
          />
        )}
      </Surface>

      <DeleteConfirmationDialog
        visible={deleteDialogVisible}
        title={t("voter.delete")}
        message={t("voter.confirmDelete")}
        onCancel={() => setDeleteDialogVisible(false)}
        onConfirm={confirmDeleteVoter}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    flex: 1,
  },
  heading: {
    fontWeight: "bold",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  downloadBtnWrapper: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingTop: 15,
    paddingBottom: 8,
  },
});
