import React, { useState, useCallback } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Button, Text, useTheme } from "react-native-paper";
import { useFocusEffect } from "@react-navigation/native";
import {
  getCandidates,
  addCandidate,
  updateCandidate,
  deleteCandidate,
} from "../api/candidateApi";
import { Candidate } from "../types/Candidate";
import { useToast } from "../components/ToastProvider";
import CandidatesTable from "../components/CandidateTable";
import CandidateForm from "../components/CandidateForm";
import DeleteConfirmationDialog from "../components/DeleteConfirmationDialog";
import { extractErrorMessage } from "../utils/common";
import { eventBus } from "../utils/eventBus";
import { getAuthData, saveAuthData } from "../utils/storage";
import { useServerTable } from "../hooks/useServerTable";
import { AppTheme } from "../theme";

export default function AddCandidateScreen() {
  const { t } = useTranslation();
  const theme = useTheme<AppTheme>();
  const styles = createStyles(theme);
  const { showToast } = useToast();

  const [showForm, setShowForm] = useState(false);
  const [candidateToEdit, setCandidateToEdit] = useState<Candidate | null>(
    null,
  );
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(
    null,
  );
  const [loading, setLoading] = useState<boolean>(false);

  /** Fetch candidates */
  const fetchCandidates = useCallback(async () => {
    try {
      const response = await getCandidates();
      return {
        items: response.data || [],
        totalCount: response.data?.length || 0,
      };
    } catch (error: any) {
      showToast(extractErrorMessage(error, t("candidate.loadFailed")), "error");
    }
  }, []);

  const table = useServerTable(fetchCandidates, {
    initialPage: 0,
    initialRowsPerPage: 10,
  });

  useFocusEffect(
    useCallback(() => {
      setShowForm(false);
      setCandidateToEdit(null);
      table.fetchData(0, table.rowsPerPage);
    }, []),
  );

  const handleAdd = async (data: any) => {
    try {
      setLoading(true);
      const response = await addCandidate(data);
      const newCandidatePhotoPath = response.data.candidatePhotoPath;
      const existingAuth = await getAuthData();
      await saveAuthData({
        ...existingAuth,
        candidatePhotoPath: newCandidatePhotoPath,
      });
      eventBus.emit("CANDIDATE_PHOTO_UPDATED", newCandidatePhotoPath);
      await table.fetchData(0, table.rowsPerPage);
      setShowForm(false);
      showToast(t("candidate.addSuccess"), "success");
    } catch (error: any) {
      showToast(extractErrorMessage(error, t("candidate.addFailed")), "error");
    } finally {
      setLoading(false);
    }
  };

  const handleEditSave = async (data: any) => {
    try {
      setLoading(true);

      const response = await updateCandidate({
        ...data,
        id: candidateToEdit?.id,
      });

      const newCandidatePhotoPath = response.data.candidatePhotoPath;
      const existingAuth = await getAuthData();
      await saveAuthData({
        ...existingAuth,
        candidatePhotoPath: newCandidatePhotoPath,
      });

      eventBus.emit("CANDIDATE_PHOTO_UPDATED", newCandidatePhotoPath);
      await table.fetchData(table.page, table.rowsPerPage);
      setShowForm(false);
      setCandidateToEdit(null);
      showToast(t("candidate.editSuccess"), "success");
    } catch (error: any) {
      showToast(extractErrorMessage(error, t("candidate.editFailed")), "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRequest = (id: string) => {
    setSelectedCandidateId(id);
    setDeleteDialogVisible(true);
  };

  const confirmDeleteCandidate = async () => {
    if (selectedCandidateId) {
      try {
        await deleteCandidate(selectedCandidateId);
        await table.fetchData(table.page, table.rowsPerPage);
        showToast(t("candidate.deleteSuccess"), "success");
      } catch (error: any) {
        showToast(
          extractErrorMessage(error, t("candidate.deleteFail")),
          "error",
        );
      }
      setSelectedCandidateId(null);
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
          {showForm
            ? t(candidateToEdit ? "candidate.edit" : "candidate.add")
            : t("candidate.plural")}
        </Text>

        {!showForm && (
          <Button
            mode="contained"
            onPress={() => setShowForm(true)}
            icon="plus"
            labelStyle={{
              fontWeight: "bold",
              fontSize: 14,
              color: theme.colors.onPrimary,
            }}
            buttonColor={theme.colors.primary}
            style={{ borderRadius: 5 }}
          >
            {t("candidate.add")}
          </Button>
        )}
      </View>

      {showForm ? (
        <CandidateForm
          mode={candidateToEdit ? "edit" : "create"}
          candidate={candidateToEdit}
          onSubmit={candidateToEdit ? handleEditSave : handleAdd}
          onCancel={() => {
            setShowForm(false);
            setCandidateToEdit(null);
          }}
          loading={loading}
        />
      ) : (
        <CandidatesTable
          data={table.data}
          loading={table.loading}
          page={table.page}
          rowsPerPage={table.rowsPerPage}
          totalCount={table.total}
          onPageChange={table.setPage}
          onRowsPerPageChange={(size) => {
            table.setRowsPerPage(size);
            table.setPage(0);
          }}
          onEdit={(item) => {
            setCandidateToEdit(item);
            setShowForm(true);
          }}
          onDelete={handleDeleteRequest}
        />
      )}

      <DeleteConfirmationDialog
        visible={deleteDialogVisible}
        title={t("candidate.delete")}
        message={t("candidate.confirmDelete")}
        onCancel={() => setDeleteDialogVisible(false)}
        onConfirm={confirmDeleteCandidate}
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
