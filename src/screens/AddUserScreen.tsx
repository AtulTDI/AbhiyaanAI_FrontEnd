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
import { useServerTable } from "../hooks/useServerTable";
import { usePlatformInfo } from "../hooks/usePlatformInfo";
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
import { useTranslation } from "react-i18next";
import { encryptWithBackendKey } from "../services/rsaEncryptor";
import { AppTheme } from "../theme";

export default function AddUserScreen({ role }) {
  const { t } = useTranslation();
  const { isWeb, isMobileWeb } = usePlatformInfo();
  const theme = useTheme<AppTheme>();
  const styles = createStyles(theme);
  const { showToast } = useToast();

  const [showAddUserView, setShowAddUserView] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);

  const fetchUsers = useCallback(async (page: number, pageSize: number) => {
    try {
      let response;

      if (role === "Distributor") {
        response = await getDistributors(page, pageSize);
      } else if (role === "Admin") {
        response = await getCustomerAdmins(page, pageSize);
      } else {
        response = await getUsers(page, pageSize);
      }

      return {
        items: Array.isArray(response?.data?.items) ? response.data.items : [],
        totalCount: response?.data?.totalRecords ?? 0,
      };
    } catch (error: any) {
      showToast(
        extractErrorMessage(error, `Failed to load ${getHeaderTitle()}`),
        "error"
      );
    }
  }, []);

  const table = useServerTable<User>(fetchUsers, {
    initialPage: 0,
    initialRowsPerPage: 10,
  });

  useFocusEffect(
    useCallback(() => {
      setShowAddUserView(false);
      setUserToEdit(null);
      table.setPage(0);
      table.setRowsPerPage(10);
      table.fetchData(0, 10);
    }, [])
  );

  const addUser = async (userData: any) => {
    try {
      const { applicationId: loggedInUserApplicationId } = await getAuthData();
      const encryptedPassword = await encryptWithBackendKey(userData?.password);

      userData?.role === "Distributor"
        ? await createDistributor({
            ...userData,
            password: encryptedPassword,
          })
        : await createUser({
            ...userData,
            password: encryptedPassword,
            applicationId: userData?.applicationId
              ? userData?.applicationId
              : loggedInUserApplicationId,
          });
      await table.fetchData(0, table.rowsPerPage);
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
      await table.fetchData(table.page, table.rowsPerPage);
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
        table.fetchData(table.page, table.rowsPerPage);
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
      ? t("distributorButtonLabel")
      : role === "Admin"
      ? t("customerAdminButtonLabel")
      : t("userButtonLabel");

  const getAddRoleLabel = () =>
    role === "Distributor"
      ? t("addDistributorLabel")
      : role === "Admin"
      ? t(isWeb && !isMobileWeb ? "addCustomerAdminLabel" : "addAdminLabel")
      : t("addUserLabel");

  const getEditRoleLabel = () =>
    role === "Distributor"
      ? t("editDistributorLabel")
      : role === "Admin"
      ? t("editCustomerAdminLabel")
      : t("editUserLabel");

  const getHeaderTitle = () => {
    const roleLabel =
      role === "Distributor"
        ? t("distributorPageLabel")
        : role === "Admin"
        ? t("customerAdminPageLabel")
        : t("userPageLabel");

    if (showAddUserView) {
      return userToEdit ? getEditRoleLabel() : getAddRoleLabel();
    }

    return roleLabel;
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
              {getAddRoleLabel()}
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
            getHeaderTitle={getHeaderTitle}
          />
        )}
      </ScrollView>

      <DeleteConfirmationDialog
        visible={deleteDialogVisible}
        title={t("deleteRole", { role: getRoleLabel()?.toLowerCase() })}
        message={t("confirmDeleteRole", { role: getRoleLabel().toLowerCase() })}
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
