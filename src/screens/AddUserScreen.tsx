import React, { useCallback, useState } from "react";
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Text, useTheme, Surface, Button } from "react-native-paper";
import { useFocusEffect } from "@react-navigation/native";
import { User } from "../types/User";
import UserForm from "../components/UserForm";
import UserTable from "../components/UserTable";
import DeleteConfirmationDialog from "../components/DeleteConfirmationDialog";
import { useToast } from "../components/ToastProvider";
import {
  createUser,
  deleteUserById,
  editUserById,
  getUsers,
} from "../api/userApi";
import { createSalesAgent } from "../api/salesAgentApi";
import { extractErrorMessage } from "../utils/common";
import { getItem } from "../utils/storage";
import { AppTheme } from "../theme";

export default function AddUserScreen() {
  const theme = useTheme<AppTheme>();
  const { showToast } = useToast();

  const [users, setUsers] = useState<User[]>([]);
  const [showAddUserView, setShowAddUserView] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await getUsers();
      setUsers(
        response?.data && Array.isArray(response.data) ? response.data : []
      );
    } catch (error: any) {
      showToast(extractErrorMessage(error, "Failed to load users"), "error");
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setShowAddUserView(false);
      setUserToEdit(null);
      fetchUsers();
    }, [fetchUsers])
  );

  const addUser = async (userData: {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    role: string;
    password: string;
    applicationId?: string;
  }) => {
    try {
      const loggedInUserApplicationId = await getItem("applicationId");

      userData?.role === "Sales Agent"
        ? await createSalesAgent(userData)
        : await createUser({
            ...userData,
            applicationId: userData?.applicationId
              ? userData?.applicationId
              : loggedInUserApplicationId,
          });
      await fetchUsers();
      setShowAddUserView(false);
      setUserToEdit(null);
      showToast("User registered successfully!", "success");
    } catch (error: any) {
      showToast(extractErrorMessage(error, "Failed to create user"), "error");
    }
  };

  const editUser = async (userData: {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    role: string;
    password: string;
  }) => {
    try {
      await editUserById(userToEdit.id, userData);
      await fetchUsers();
      setShowAddUserView(false);
      setUserToEdit(null);
      showToast("User updated successfully!", "success");
    } catch (error: any) {
      showToast(extractErrorMessage(error, "Failed to update user"), "error");
    }
  };

  const handleEdit = (item: User) => {
    setUserToEdit(item);
    setShowAddUserView(true);
  };

  const handleDeleteRequest = (id: string) => {
    setSelectedUserId(id);
    setDeleteDialogVisible(true);
  };

  const confirmDeleteUser = async () => {
    if (selectedUserId) {
      try {
        await deleteUserById(selectedUserId);
        await fetchUsers();
        showToast("User deleted successfully!", "success");
      } catch (error: any) {
        showToast(extractErrorMessage(error, "Failed to delete user"), "error");
      }
      setSelectedUserId(null);
      setDeleteDialogVisible(false);
    }
  };

  return (
    <>
      <Surface style={styles.container} elevation={1}>
        <View style={styles.header}>
          <Text
            variant="titleLarge"
            style={[styles.heading, { color: theme.colors.primary }]}
          >
            Users
          </Text>
          {!showAddUserView && (
            <Button
              mode="contained"
              onPress={() => setShowAddUserView(true)}
              icon="plus"
              labelStyle={{
                fontWeight: "bold",
                fontSize: 14,
                color: theme.colors.onPrimary,
              }}
              buttonColor={theme.colors.primary}
              style={{ borderRadius: 5 }}
            >
              Add User
            </Button>
          )}
        </View>

        {showAddUserView ? (
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={{ flex: 1 }}
          >
            <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
              <UserForm
                mode={userToEdit ? "edit" : "create"}
                onCreate={userToEdit ? editUser : addUser}
                userToEdit={userToEdit}
                setUserToEdit={setUserToEdit}
                setShowAddUserView={setShowAddUserView}
              />
            </ScrollView>
          </KeyboardAvoidingView>
        ) : (
          <UserTable
            users={users}
            onEdit={handleEdit}
            onDelete={handleDeleteRequest}
          />
        )}
      </Surface>

      <DeleteConfirmationDialog
        visible={deleteDialogVisible}
        title="Delete User"
        message="Are you sure you want to delete this user?"
        onCancel={() => setDeleteDialogVisible(false)}
        onConfirm={confirmDeleteUser}
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
