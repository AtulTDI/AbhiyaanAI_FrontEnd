import React, { useCallback, useRef, useState } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';

import { useFocusEffect } from '@react-navigation/native';

import { useTranslation } from 'react-i18next';

import {
  createDistributor,
  deleteDistributor,
  editDistributorById,
  getDistributors
} from '../api/salesAgentApi';
import {
  createUser,
  deleteUserById,
  editUserById,
  getCustomerAdmins,
  getUsers
} from '../api/userApi';
import DeleteConfirmationDialog from '../components/DeleteConfirmationDialog';
import { useToast } from '../components/ToastProvider';
import UserForm from '../components/UserForm';
import UserTable from '../components/UserTable';
import { useInternalBackHandler } from '../hooks/useInternalBackHandler';
import { usePlatformInfo } from '../hooks/usePlatformInfo';
import { useServerTable } from '../hooks/useServerTable';
import { encryptWithBackendKey } from '../services/rsaEncryptor';
import { AppTheme } from '../theme';
import { CreateUserPayload, EditUserPayload, User } from '../types/User';
import { extractErrorMessage } from '../utils/common';
import { getAuthData } from '../utils/storage';

type Props = {
  role: string;
};

export default function AddUserScreen({ role }: Props) {
  const { t } = useTranslation();
  const { isWeb, isMobileWeb, isIOS } = usePlatformInfo();
  const theme = useTheme<AppTheme>();
  const styles = createStyles(theme);
  const { showToast } = useToast();

  const [showAddUserView, setShowAddUserView] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const canHandleInternalBack = showAddUserView;

  const handleInternalBack = () => {
    if (showAddUserView) {
      setShowAddUserView(false);
      setUserToEdit(null);
    }
  };

  useInternalBackHandler(canHandleInternalBack, handleInternalBack);

  const fetchUsers = useCallback(
    async (page: number, pageSize: number) => {
      try {
        let response;

        if (role === 'Distributor') {
          response = await getDistributors(page, pageSize);
        } else if (role === 'Admin') {
          response = await getCustomerAdmins(page, pageSize);
        } else {
          response = await getUsers(page, pageSize);
        }

        return {
          items: Array.isArray(response?.data?.items) ? response.data.items : [],
          totalCount: response?.data?.totalRecords ?? 0
        };
      } catch (error) {
        const loadTarget =
          role === 'Distributor'
            ? t('distributorPageLabel')
            : role === 'Admin'
              ? t('customerAdminPageLabel')
              : t('userPageLabel');

        showToast(extractErrorMessage(error, `Failed to load ${loadTarget}`), 'error');
      }
    },
    [role, showToast, t]
  );

  const table = useServerTable<User>(fetchUsers, {
    initialPage: 0,
    initialRowsPerPage: 10
  });
  const tableRef = useRef(table);
  tableRef.current = table;

  useFocusEffect(
    useCallback(() => {
      setShowAddUserView(false);
      setUserToEdit(null);
      tableRef.current.setPage(0);
      tableRef.current.setRowsPerPage(10);
      void tableRef.current.fetchData(0, 10);
    }, [])
  );

  const addUser = async (userData: CreateUserPayload) => {
    try {
      const { applicationId: loggedInUserApplicationId } = await getAuthData();
      const encryptedPassword = await encryptWithBackendKey(userData?.password);

      if (userData?.role === 'Distributor') {
        await createDistributor({
          ...userData,
          password: encryptedPassword
        });
      } else {
        await createUser({
          ...userData,
          password: encryptedPassword,
          applicationId: userData?.applicationId
            ? userData?.applicationId
            : loggedInUserApplicationId
        });
      }
      await table.fetchData(0, table.rowsPerPage);
      setShowAddUserView(false);
      setUserToEdit(null);
      showToast(`${getRoleLabel()} registered successfully!`, 'success');
    } catch (error) {
      showToast(
        extractErrorMessage(error, `Failed to create ${getRoleLabel().toLowerCase()}`),
        'error'
      );
    }
  };

  const editUser = async (userData: EditUserPayload) => {
    try {
      if (userData?.role === 'Distributor') {
        await editDistributorById(userToEdit.id, userData);
      } else {
        await editUserById(userToEdit.id, userData);
      }
      await table.fetchData(table.page, table.rowsPerPage);
      setShowAddUserView(false);
      setUserToEdit(null);
      showToast(`${getRoleLabel()} updated successfully!`, 'success');
    } catch (error) {
      showToast(
        extractErrorMessage(error, `Failed to update ${getRoleLabel().toLowerCase()}`),
        'error'
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
        if (role === 'Distributor') {
          await deleteDistributor(selectedUserId);
        } else {
          await deleteUserById(selectedUserId);
        }
        table.fetchData(table.page, table.rowsPerPage);
        showToast(`${getRoleLabel()} deleted successfully!`, 'success');
      } catch (error) {
        showToast(
          extractErrorMessage(error, `Failed to delete ${getRoleLabel().toLowerCase()}`),
          'error'
        );
      }
      setSelectedUserId(null);
      setDeleteDialogVisible(false);
    }
  };

  const getRoleLabel = () =>
    role === 'Distributor'
      ? t('distributorButtonLabel')
      : role === 'Admin'
        ? t('customerAdminButtonLabel')
        : t('userButtonLabel');

  const getAddRoleLabel = () =>
    role === 'Distributor'
      ? t('addDistributorLabel')
      : role === 'Admin'
        ? t(isWeb && !isMobileWeb ? 'addCustomerAdminLabel' : 'addAdminLabel')
        : t('addUserLabel');

  const getEditRoleLabel = () =>
    role === 'Distributor'
      ? t('editDistributorLabel')
      : role === 'Admin'
        ? t('editCustomerAdminLabel')
        : t('editUserLabel');

  const getHeaderTitle = () => {
    const roleLabel =
      role === 'Distributor'
        ? t('distributorPageLabel')
        : role === 'Admin'
          ? t('customerAdminPageLabel')
          : t('userPageLabel');

    if (showAddUserView) {
      return userToEdit ? getEditRoleLabel() : getAddRoleLabel();
    }

    return roleLabel;
  };

  return (
    <>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text variant="titleLarge" style={styles.heading}>
            {getHeaderTitle()}
          </Text>
          {!showAddUserView && (
            <Button
              mode="contained"
              onPress={() => setShowAddUserView(true)}
              icon="plus"
              labelStyle={styles.addButtonLabel}
              buttonColor={theme.colors.primary}
              style={styles.addButton}
            >
              {getAddRoleLabel()}
            </Button>
          )}
        </View>

        {showAddUserView ? (
          <KeyboardAvoidingView
            behavior={isIOS ? 'padding' : undefined}
            style={styles.formWrapper}
          >
            <UserForm
              role={role}
              mode={userToEdit ? 'edit' : 'create'}
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
        title={t('deleteRole', { role: getRoleLabel()?.toLowerCase() })}
        message={t('confirmDeleteRole', { role: getRoleLabel().toLowerCase() })}
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
      flex: 1
    },
    heading: {
      fontWeight: 'bold',
      color: theme.colors.primary
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16
    },
    addButtonLabel: {
      fontWeight: 'bold',
      fontSize: 14,
      color: theme.colors.onPrimary
    },
    addButton: {
      borderRadius: 5
    },
    formWrapper: {
      flex: 1
    }
  });
