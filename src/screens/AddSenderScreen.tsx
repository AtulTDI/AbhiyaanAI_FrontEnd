import React, { useCallback, useState } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { Text, useTheme, Button } from "react-native-paper";
import { useTranslation } from "react-i18next";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useFocusEffect } from "@react-navigation/native";
import { Sender } from "../types/Sender";
import SenderForm from "../components/SenderForm";
import SenderTable from "../components/SenderTable";
import DeleteConfirmationDialog from "../components/DeleteConfirmationDialog";
import { useToast } from "../components/ToastProvider";
import {
  createSender,
  deleteSenderById,
  editSenderById,
  getSenders,
} from "../api/senderApi";
import { extractErrorMessage } from "../utils/common";
import { AppTheme } from "../theme";
import { useServerTable } from "../hooks/useServerTable";

export default function AddSenderScreen() {
  const { t } = useTranslation();
  const theme = useTheme<AppTheme>();
  const styles = createStyles(theme);
  const { showToast } = useToast();

  const [showAddSenderView, setShowAddSenderView] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [selectedSenderId, setSelectedSenderId] = useState<string | null>(null);
  const [senderToEdit, setSenderToEdit] = useState<Sender | null>(null);

  const fetchSenders = useCallback(async (page: number, pageSize: number) => {
    return getSenders(page, pageSize).then((response) => ({
      items: Array.isArray(response?.data?.items) ? response.data.items : [],
      totalCount: response?.data?.totalRecords ?? 0,
    }));
  }, []);

  const table = useServerTable<Sender, string>(fetchSenders, {
    initialPage: 0,
    initialRowsPerPage: 10,
  });

  useFocusEffect(
    useCallback(() => {
      setShowAddSenderView(false);
      setSenderToEdit(null);
      table.fetchData(0, 10);
    }, [])
  );

  const addSender = async (senderData: {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    password: string;
  }) => {
    try {
      await createSender({ ...senderData, role: "Sender" });
      await table.fetchData(0, table.rowsPerPage);
      setShowAddSenderView(false);
      setSenderToEdit(null);
      showToast(t("sender.addSuccess"), "success");
    } catch (error: any) {
      showToast(extractErrorMessage(error, t("sender.addFailed")), "error");
    }
  };

  const editSender = async (senderData: {
    firstName: string;
    lastName: string;
    email: string;
  }) => {
    try {
      await editSenderById(senderToEdit.id, {
        ...senderData,
        password: undefined,
        role: "Sender",
      });
      await table.fetchData(table.page, table.rowsPerPage);
      setShowAddSenderView(false);
      setSenderToEdit(null);
      showToast(t("sender.editSuccess"), "success");
    } catch (error: any) {
      showToast(extractErrorMessage(error, t("sender.editFailed")), "error");
    }
  };

  const handleEdit = (item: Sender) => {
    setSenderToEdit(item);
    setShowAddSenderView(true);
  };

  const handleDeleteRequest = (id: string) => {
    setSelectedSenderId(id);
    setDeleteDialogVisible(true);
  };

  const confirmDeleteSender = async () => {
    if (selectedSenderId) {
      try {
        await deleteSenderById(selectedSenderId);
        await table.fetchData(table.page, table.rowsPerPage);
        showToast(t("sender.deleteSucess"), "success");
      } catch (error: any) {
        showToast(extractErrorMessage(error, t("sender.deleteFail")), "error");
      }
      setSelectedSenderId(null);
      setDeleteDialogVisible(false);
    }
  };

  return (
    <>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text
            variant="titleLarge"
            style={[styles.heading, { color: theme.colors.primary }]}
          >
            {showAddSenderView
              ? senderToEdit
                ? t("sender.edit")
                : t("sender.add")
              : t("sender.plural")}
          </Text>
          {!showAddSenderView && (
            <Button
              mode="contained"
              onPress={() => setShowAddSenderView(true)}
              icon="plus"
              labelStyle={{
                fontWeight: "bold",
                fontSize: 14,
                color: theme.colors.onPrimary,
              }}
              buttonColor={theme.colors.primary}
              style={{ borderRadius: 5 }}
            >
              {t("sender.add")}
            </Button>
          )}
        </View>

        {showAddSenderView ? (
          <KeyboardAwareScrollView
            contentContainerStyle={{
              flexGrow: 1,
            }}
            extraScrollHeight={50}
            enableOnAndroid={true}
            keyboardShouldPersistTaps="handled"
          >
            <SenderForm
              mode={senderToEdit ? "edit" : "create"}
              onCreate={senderToEdit ? editSender : addSender}
              senderToEdit={senderToEdit}
              setSenderToEdit={setSenderToEdit}
              setShowAddSenderView={setShowAddSenderView}
            />
          </KeyboardAwareScrollView>
        ) : (
          <SenderTable
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
          />
        )}
      </ScrollView>

      <DeleteConfirmationDialog
        visible={deleteDialogVisible}
        title={t("sender.delete")}
        message={t("sender.confirmDelete")}
        onCancel={() => setDeleteDialogVisible(false)}
        onConfirm={confirmDeleteSender}
      />
    </>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      padding: 16,
      backgroundColor: theme.colors.white,
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
