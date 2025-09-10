import React, { useState, useCallback } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Button, Text } from "react-native-paper";
import { useTheme } from "react-native-paper";
import { useFocusEffect } from "@react-navigation/native";
import {
  createApplication,
  editApplicationById,
  getApplications,
  toggleApplication,
} from "../api/applicationApi";
import {
  Application,
  CreateApplicationPayload,
  EditApplicationPayload,
  GetPaginatedApplications,
} from "../types/Application";
import { useToast } from "../components/ToastProvider";
import ApplicationsTable from "../components/ApplicationsTable";
import ApplicationForm from "../components/ApplicationForm";
import { extractErrorMessage, sortByDateDesc } from "../utils/common";
import { AppTheme } from "../theme";
import { useServerTable } from "../hooks/useServerTable";

export default function AddApplicationScreen() {
  const theme = useTheme<AppTheme>();
  const styles = createStyles(theme);
  const { showToast } = useToast();

  const [showAddApplicationView, setShowAddApplicationView] = useState(false);
  const [applicationToEdit, setApplicationToEdit] =
    useState<Application | null>(null);

  const fetchApplications = useCallback(
    async (page: number, pageSize: number) => {
      try {
        const response = await getApplications(page, pageSize);
        const sortedApps = sortByDateDesc(
          response?.data?.items || [],
          "createdAt"
        );
        return {
          items: sortedApps ?? [],
          totalCount: response?.data?.totalRecords ?? 0,
        };
      } catch (error) {
        showToast("Failed to load applications", "error");
      }
    },
    []
  );

  const table = useServerTable<GetPaginatedApplications>(fetchApplications, {
    initialPage: 0,
    initialRowsPerPage: 10,
  });

  useFocusEffect(
    useCallback(() => {
      setShowAddApplicationView(false);
      setApplicationToEdit(null);
      table.fetchData(0, 10);
    }, [])
  );

  const addApplication = async (data: CreateApplicationPayload) => {
    try {
      await createApplication(data);
      await table.fetchData(0, table.rowsPerPage);
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
        isActive: applicationToEdit?.isActive,
      });
      await table.fetchData(table.page, table.rowsPerPage);
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

  const handleToggle = async (item: Application) => {
    try {
      await toggleApplication(item.id, !item.isActive);
      await table.fetchData(table.page, table.rowsPerPage);
      showToast("Application updated", "success");
    } catch (error: any) {
      showToast(
        extractErrorMessage(error, "Failed to update application"),
        "error"
      );
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text
          variant="titleLarge"
          style={[styles.heading, { color: theme.colors.primary }]}
        >
          {showAddApplicationView
            ? `${applicationToEdit ? "Edit" : "Add"} Application`
            : "Applications"}
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
          onToggleStatus={handleToggle}
        />
      )}
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
