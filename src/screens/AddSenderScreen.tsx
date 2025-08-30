import React, { useCallback, useState } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { Text, useTheme, Button } from "react-native-paper";
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

export default function AddSenderScreen() {
  const theme = useTheme<AppTheme>();
  const styles = createStyles(theme);
  const { showToast } = useToast();

  const [senders, setSenders] = useState<Sender[]>([]);
  const [showAddSenderView, setShowAddSenderView] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [selectedSenderId, setSelectedSenderId] = useState<string | null>(null);
  const [senderToEdit, setSenderToEdit] = useState<Sender | null>(null);

  const fetchSenders = useCallback(async () => {
    try {
      const response = await getSenders();
      setSenders(
        response?.data && Array.isArray(response.data) ? response.data : []
      );
    } catch (error: any) {
      showToast(extractErrorMessage(error, "Failed to load senders"), "error");
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setShowAddSenderView(false);
      setSenderToEdit(null);
      fetchSenders();
    }, [fetchSenders])
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
      await fetchSenders();
      setShowAddSenderView(false);
      setSenderToEdit(null);
      showToast("Sender registered successfully!", "success");
    } catch (error: any) {
      showToast(extractErrorMessage(error, "Failed to create sender"), "error");
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
      await fetchSenders();
      setShowAddSenderView(false);
      setSenderToEdit(null);
      showToast("Sender updated successfully!", "success");
    } catch (error: any) {
      showToast(extractErrorMessage(error, "Failed to update sender"), "error");
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
        await fetchSenders();
        showToast("Sender deleted successfully!", "success");
      } catch (error: any) {
        showToast(
          extractErrorMessage(error, "Failed to delete sender"),
          "error"
        );
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
              ? `${senderToEdit ? "Edit" : "Add"} Sender`
              : "Senders"}
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
              Add Sender
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
            senders={senders}
            onEdit={handleEdit}
            onDelete={handleDeleteRequest}
          />
        )}
      </ScrollView>

      <DeleteConfirmationDialog
        visible={deleteDialogVisible}
        title="Delete Sender"
        message="Are you sure you want to delete this sender?"
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
