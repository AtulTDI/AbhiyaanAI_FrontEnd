import React, { useState, useCallback } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Button, Text } from "react-native-paper";
import { useTheme } from "react-native-paper";
import { useFocusEffect } from "@react-navigation/native";
import {
  createApplication,
  deleteApplicationById,
  editApplicationById,
  getApplications,
} from "../api/applicationApi";
import {
  Application,
  CreateApplicationPayload,
  EditApplicationPayload,
} from "../types/Application";
import { useToast } from "../components/ToastProvider";
import ApplicationsTable from "../components/ApplicationsTable";
import ApplicationForm from "../components/ApplicationForm";
import DeleteConfirmationDialog from "../components/DeleteConfirmationDialog";
import { extractErrorMessage } from "../utils/common";
import { AppTheme } from "../theme";

export default function AddApplicationScreen() {
  const theme = useTheme<AppTheme>();
  const styles = createStyles(theme);
  const { showToast } = useToast();

  const [applications, setApplications] = useState([]);
  const [showAddApplicationView, setShowAddApplicationView] = useState(false);
  const [selectedApplicationId, setSelectedApplicationId] = useState<
    string | null
  >(null);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [applicationToEdit, setApplicationToEdit] =
    useState<Application | null>(null);

  const fetchApplications = useCallback(async () => {
    try {
      const response = await getApplications();
      setApplications(response?.data || []);
    } catch (error) {
      showToast("Failed to load applications", "error");
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setShowAddApplicationView(false);
      setApplicationToEdit(null);
      fetchApplications();
    }, [fetchApplications])
  );

  const addApplication = async (data: CreateApplicationPayload) => {
    try {
      await createApplication(data);
      await fetchApplications();
      setShowAddApplicationView(false);
      setApplicationToEdit(null);
      showToast("Application added", "success");
    } catch {
      showToast("Failed to add application", "error");
    }
  };

  const editApplication = async (data) => {
    setShowAddApplicationView(true);
    try {
      await editApplicationById(applicationToEdit.id, {
        ...data,
        name: data?.appName,
      });
      await fetchApplications();
      setShowAddApplicationView(false);
      setApplicationToEdit(null);
      showToast("Application updated", "success");
    } catch (error: any) {
      showToast(
        extractErrorMessage(error, "Failed to update application"),
        "error"
      );
    }
  };

  const handleEdit = (item: EditApplicationPayload) => {
    setApplicationToEdit(item);
    setShowAddApplicationView(true);
  };

  const handleDelete = (id: string) => {
    setSelectedApplicationId(id);
    setDeleteDialogVisible(true);
  };

  const confirmDeleteApplication = async () => {
    if (selectedApplicationId) {
      try {
        await deleteApplicationById(selectedApplicationId);
        showToast("Application deleted", "success");
        fetchApplications();
      } catch (error: any) {
        showToast(
          extractErrorMessage(error, "Failed to delete application"),
          "error"
        );
      }

      setSelectedApplicationId(null);
      setDeleteDialogVisible(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text
          variant="titleLarge"
          style={[styles.heading, { color: theme.colors.primary }]}
        >
          Applications
        </Text>
        {!showAddApplicationView && (
          <Button
            mode="contained"
            onPress={() => setShowAddApplicationView(true)}
            icon="plus"
            labelStyle={{
              fontWeight: "bold",
              fontSize: 14,
              color: theme.colors.onPrimary,
            }}
            buttonColor={theme.colors.primary}
            style={{ borderRadius: 5 }}
          >
            Add Application
          </Button>
        )}
      </View>

      {showAddApplicationView ? (
        <ApplicationForm
          mode={applicationToEdit ? "edit" : "create"}
          onCreate={applicationToEdit ? editApplication : addApplication}
          applicationToEdit={applicationToEdit}
          setApplicationToEdit={setApplicationToEdit}
          setShowAddApplicationView={setShowAddApplicationView}
        />
      ) : (
        <ApplicationsTable
          applications={applications}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      <DeleteConfirmationDialog
        visible={deleteDialogVisible}
        title="Delete Application"
        message="Are you sure you want to delete this application?"
        onCancel={() => setDeleteDialogVisible(false)}
        onConfirm={confirmDeleteApplication}
      />
    </ScrollView>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      padding: 16,
      backgroundColor: theme.colors.white,
      flexGrow: 1,
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
