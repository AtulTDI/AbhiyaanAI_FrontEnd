import React, { useCallback, useState } from "react";
import {
  View,
  StyleSheet,
  useWindowDimensions,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Text, useTheme, Surface, Button } from "react-native-paper";
import { useFocusEffect } from "@react-navigation/native";
import {
  TabView,
  TabBar,
  SceneRendererProps,
  TabBarItem,
} from "react-native-tab-view";
import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system";
import { Voter } from "../types/Voter";
import * as Sharing from "expo-sharing";
import VoterForm from "../components/VoterForm";
import VoterUpload from "../components/VoterUpload";
import VoterTable from "../components/VoterTable";
import DeleteConfirmationDialog from "../components/DeleteConfirmationDialog";
import { useToast } from "../components/ToastProvider";
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
  const theme = useTheme<AppTheme>();
  const { colors } = theme;

  const layout = useWindowDimensions();
  const { showToast } = useToast();

  const [voters, setVoters] = useState<Voter[]>([]);
  const [index, setIndex] = useState(0);
  const [showAddVoterView, setShowAddVoterView] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [selectedVoterId, setSelectedVoterId] = useState<string | null>(null);
  const [voterToEdit, setVoterToEdit] = useState<Voter | null>(null);

  const [routes] = useState<TabRoute[]>([
    { key: "manual", title: "Register Voter" },
    { key: "excel", title: "Bulk Register" },
  ]);

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
      setShowAddVoterView(false);
      setVoterToEdit(null);
      fetchVoters();
    }, [fetchVoters])
  );

  const addVoter = async (voterData: {
    firstName: string;
    lastName: string;
    phoneNumber: string;
  }) => {
    try {
      await createVoter(voterData);
      await fetchVoters();
      setShowAddVoterView(false);
      setVoterToEdit(null);
      showToast("Voter registered successfully!", "success");
    } catch (error: any) {
      showToast(extractErrorMessage(error, "Failed to create voter"), "error");
    }
  };

  const editVoter = async (voterData: {
    firstName: string;
    lastName: string;
    phoneNumber: string;
  }) => {
    try {
      await editVoterById(voterToEdit.id, voterData);
      await fetchVoters();
      setShowAddVoterView(false);
      setVoterToEdit(null);
      showToast("Voter updated successfully!", "success");
    } catch (error: any) {
      showToast(extractErrorMessage(error, "Failed to update voter"), "error");
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
        await fetchVoters();
        showToast("Voter deleted successfully!", "success");
      } catch (error: any) {
        showToast(
          extractErrorMessage(error, "Failed to delete voter"),
          "error"
        );
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
      console.error("Error sharing/downloading Excel:", error);
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
            <View
              style={{
                flexDirection: "row",
                justifyContent: "flex-end",
                paddingTop: 15,
                paddingBottom: 8,
              }}
            >
              <Button
                mode="outlined"
                icon="download"
                onPress={downloadSampleExcel}
                textColor={colors.greenAccent}
                style={{ borderRadius: 8, borderColor: colors.greenAccent }}
              >
                Download Sample
              </Button>
            </View>

            <VoterUpload
              fetchVoters={fetchVoters}
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
              ? `${voterToEdit ? "Edit" : "Add"} ${
                  voterToEdit ? "Voter" : "Voter(s)"
                }`
              : "Voters"}
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
              Add Voter(s)
            </Button>
          )}
        </View>

        {showAddVoterView ? (
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
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
            voters={voters}
            onEdit={handleEdit}
            onDelete={handleDeleteRequest}
          />
        )}
      </Surface>

      <DeleteConfirmationDialog
        visible={deleteDialogVisible}
        title="Delete Voter"
        message="Are you sure you want to delete this voter?"
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
});
