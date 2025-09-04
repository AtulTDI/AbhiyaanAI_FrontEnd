import React, { useCallback, useState } from "react";
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Text, useTheme, Button } from "react-native-paper";
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
  getCustomerAdmins,
  getUsers,
} from "../api/userApi";
import {
  createDistributor,
  deleteDistributor,
  editDistributorById,
  getDistributors,
} from "../api/salesAgentApi";
import { extractErrorMessage } from "../utils/common";
import { getAuthData } from "../utils/storage";
import { AppTheme } from "../theme";

export default function AddUserScreen({ role }) {
  const theme = useTheme<AppTheme>();
  const styles = createStyles(theme);
  const { showToast } = useToast();

  const [users, setUsers] = useState<User[]>([]);
  const [showAddUserView, setShowAddUserView] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      let response;

      if (role === "Distributor") {
        response = await getDistributors();
      } else if (role === "Admin") {
        response = await getCustomerAdmins();
      } else {
        response = await getUsers();
      }
      setUsers(
        response?.data && Array.isArray(response.data) ? response.data : []
      );
    } catch (error: any) {
      showToast(
        extractErrorMessage(error, `Failed to load ${getHeaderTitle()}`),
        "error"
      );
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setShowAddUserView(false);
      setUserToEdit(null);
      fetchUsers();
    }, [fetchUsers])
  );

  const addUser = async (userData: any) => {
    try {
      const { applicationId: loggedInUserApplicationId } = await getAuthData();

      userData?.role === "Distributor"
        ? await createDistributor(userData)
        : await createUser({
            ...userData,
            applicationId: userData?.applicationId
              ? userData?.applicationId
              : loggedInUserApplicationId,
          });
      await fetchUsers();
      setShowAddUserView(false);
      setUserToEdit(null);
      showToast(`${getRoleLabel()} registered successfully!`, "success");
    } catch (error: any) {
      showToast(
        extractErrorMessage(
          error,
          `Failed to create ${getRoleLabel().toLowerCase()}`
        ),
        "error"
      );
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
      userData?.role === "Distributor"
        ? await editDistributorById(userToEdit.id, userData)
        : await editUserById(userToEdit.id, userData);
      await fetchUsers();
      setShowAddUserView(false);
      setUserToEdit(null);
      showToast(`${getRoleLabel()} updated successfully!`, "success");
    } catch (error: any) {
      showToast(
        extractErrorMessage(
          error,
          `Failed to update ${getRoleLabel().toLowerCase()}`
        ),
        "error"
      );
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
        role === "Distributor"
          ? await deleteDistributor(selectedUserId)
          : await deleteUserById(selectedUserId);
        await fetchUsers();
        showToast(`${getRoleLabel()} deleted successfully!`, "success");
      } catch (error: any) {
        showToast(
          extractErrorMessage(
            error,
            `Failed to delete ${getRoleLabel().toLowerCase()}`
          ),
          "error"
        );
      }
      setSelectedUserId(null);
      setDeleteDialogVisible(false);
    }
  };

  const getRoleLabel = () =>
    role === "Distributor"
      ? "Distributor"
      : role === "Admin"
      ? "Customer Admin"
      : "User";

  const getHeaderTitle = () => {
    const roleLabel =
      role === "Distributor"
        ? "Distributor"
        : role === "Admin"
        ? "Customer Admin"
        : "User";

    if (showAddUserView) {
      return `${userToEdit ? "Edit" : "Add"} ${roleLabel}`;
    }

    return `${roleLabel}s`;
  };

  return (
    <>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text
            variant="titleLarge"
            style={[styles.heading, { color: theme.colors.primary }]}
          >
            {getHeaderTitle()}
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
              Add{" "}
              {role === "Admin" && Platform.OS !== "web"
                ? "Admin"
                : getRoleLabel()}
            </Button>
          )}
        </View>

        {showAddUserView ? (
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={{ flex: 1 }}
          >
            <UserForm
              role={role}
              mode={userToEdit ? "edit" : "create"}
              onCreate={userToEdit ? editUser : addUser}
              userToEdit={userToEdit}
              setUserToEdit={setUserToEdit}
              setShowAddUserView={setShowAddUserView}
            />
          </KeyboardAvoidingView>
        ) : (
          <UserTable
            role={role}
            users={users}
            onEdit={handleEdit}
            onDelete={handleDeleteRequest}
            getHeaderTitle={getHeaderTitle}
          />
        )}
      </ScrollView>

      <DeleteConfirmationDialog
        visible={deleteDialogVisible}
        title={`Delete ${getRoleLabel()}`}
        message={`Are you sure you want to delete this ${getRoleLabel().toLowerCase()} ?`}
        onCancel={() => setDeleteDialogVisible(false)}
        onConfirm={confirmDeleteUser}
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
