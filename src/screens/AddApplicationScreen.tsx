import React, { useCallback, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';

import { useFocusEffect } from '@react-navigation/native';

import { useTranslation } from 'react-i18next';

import {
  createApplication,
  editApplicationById,
  getApplications,
  toggleApplication
} from '../api/applicationApi';
import { uploadVoters } from '../api/voterApi';
import ApplicationForm from '../components/ApplicationForm';
import ApplicationsTable from '../components/ApplicationsTable';
import { useToast } from '../components/ToastProvider';
import { useInternalBackHandler } from '../hooks/useInternalBackHandler';
import { useServerTable } from '../hooks/useServerTable';
import { AppTheme } from '../theme';
import {
  Application,
  CreateApplicationPayload,
  EditApplicationPayload
} from '../types/Application';
import { UploadableFile } from '../types/Upload';
import { extractErrorMessage, sortByDateDesc } from '../utils/common';

type ApplicationFormValues = CreateApplicationPayload & {
  appName: string;
};

export default function AddApplicationScreen() {
  const { t } = useTranslation();
  const theme = useTheme<AppTheme>();
  const styles = createStyles(theme);
  const { showToast } = useToast();

  const [showAddApplicationView, setShowAddApplicationView] = useState(false);
  const [applicationToEdit, setApplicationToEdit] = useState<Application | null>(null);
  const [voterFile, setVoterFile] = useState<UploadableFile | null>(null);
  const [loading, setLoading] = useState(false);
  const canHandleInternalBack = showAddApplicationView;

  const handleInternalBack = () => {
    if (loading) return;

    if (showAddApplicationView) {
      setShowAddApplicationView(false);
      setApplicationToEdit(null);
      setVoterFile(null);
    }
  };

  useInternalBackHandler(canHandleInternalBack, handleInternalBack);

  const fetchApplications = useCallback(
    async (page: number, pageSize: number) => {
      try {
        const response = await getApplications(page, pageSize);
        const sortedApps = sortByDateDesc(response?.data?.items || [], 'createdAt');
        return {
          items: sortedApps ?? [],
          totalCount: response?.data?.totalRecords ?? 0
        };
      } catch (error) {
        showToast(extractErrorMessage(error, t('application.loadFailed')), 'error');
      }
    },
    [showToast, t]
  );

  const table = useServerTable<Application>(fetchApplications, {
    initialPage: 0,
    initialRowsPerPage: 10
  });
  const tableRef = useRef(table);
  tableRef.current = table;

  useFocusEffect(
    useCallback(() => {
      setShowAddApplicationView(false);
      setApplicationToEdit(null);
      tableRef.current.setPage(0);
      tableRef.current.setRowsPerPage(10);
      void tableRef.current.fetchData(0, 10);
    }, [])
  );

  const handleVoterFileUpload = async (applicationId: string) => {
    try {
      await uploadVoters(voterFile, applicationId);
    } catch (error) {
      showToast(extractErrorMessage(error, t('voter.addFailed')), 'error');
    }
  };

  const addApplication = async (data: CreateApplicationPayload) => {
    try {
      setLoading(true);
      const response = await createApplication(data);
      if (voterFile) {
        await handleVoterFileUpload(response.data.id);
      }
      await table.fetchData(0, table.rowsPerPage);
      setShowAddApplicationView(false);
      setApplicationToEdit(null);
      showToast(t('application.addSuccess'), 'success');
    } catch (error) {
      showToast(extractErrorMessage(error, t('application.addFailed')), 'error');
    } finally {
      setLoading(false);
    }
  };

  const editApplication = async (data: ApplicationFormValues) => {
    setShowAddApplicationView(true);
    try {
      setLoading(true);
      await editApplicationById(applicationToEdit.id, {
        ...data,
        name: data?.appName,
        isActive: applicationToEdit?.isActive
      });
      if (voterFile) {
        await handleVoterFileUpload(applicationToEdit.id);
      }
      await table.fetchData(table.page, table.rowsPerPage);
      setShowAddApplicationView(false);
      setApplicationToEdit(null);
      showToast(t('application.editSuccess'), 'success');
    } catch (error) {
      showToast(extractErrorMessage(error, t('application.editFailed')), 'error');
    } finally {
      setLoading(false);
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
      showToast(t('application.editSuccess'), 'success');
    } catch (error) {
      showToast(extractErrorMessage(error, t('application.editFailed')), 'error');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text variant="titleLarge" style={styles.heading}>
          {showAddApplicationView
            ? t(applicationToEdit ? 'application.edit' : 'application.add')
            : t('application.plural')}
        </Text>
        {!showAddApplicationView && (
          <Button
            mode="contained"
            onPress={() => setShowAddApplicationView(true)}
            icon="plus"
            labelStyle={styles.addButtonLabel}
            buttonColor={theme.colors.primary}
            style={styles.addButton}
          >
            {t('application.add')}
          </Button>
        )}
      </View>

      {showAddApplicationView ? (
        <ApplicationForm
          mode={applicationToEdit ? 'edit' : 'create'}
          loading={loading}
          onCreate={applicationToEdit ? editApplication : addApplication}
          onVoterFileUpload={(file) => setVoterFile(file)}
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
      flexGrow: 1
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
    }
  });
