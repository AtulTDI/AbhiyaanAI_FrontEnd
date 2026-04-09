import React, { useCallback, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  useWindowDimensions,
  View
} from 'react-native';
import { Button, Surface, Text, useTheme } from 'react-native-paper';
import { SceneRendererProps, TabBar, TabBarItem, TabView } from 'react-native-tab-view';

import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useFocusEffect } from '@react-navigation/native';

import { useTranslation } from 'react-i18next';

import sampleVoterUploadAsset from '../assets/sample-voter-upload.xlsx';
import DeleteConfirmationDialog from '../components/DeleteConfirmationDialog';
import { useToast } from '../components/ToastProvider';
import VoterForm from '../components/VoterForm';
import VoterTable from '../components/VoterTable';
import VoterUpload from '../components/VoterUpload';
import { useInternalBackHandler } from '../hooks/useInternalBackHandler';
import { usePlatformInfo } from '../hooks/usePlatformInfo';
import { useServerTable } from '../hooks/useServerTable';
import { recipientService } from '../services/recipientService';
import { AppTheme } from '../theme';
import type {
  CreateRecipientPayload,
  EditRecipientPayload,
  Recipient
} from '../types/Recipient';
import { extractErrorMessage } from '../utils/common';
import { logger } from '../utils/logger';

type TabRoute = {
  key: string;
  title: string;
};

export default function AddVoterScreen() {
  const { isIOS } = usePlatformInfo();
  const { t } = useTranslation();
  const theme = useTheme<AppTheme>();
  const styles = createStyles(theme);
  const { colors } = theme;
  const layout = useWindowDimensions();
  const { showToast } = useToast();

  const [index, setIndex] = useState(0);
  const [showAddVoterView, setShowAddVoterView] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [selectedVoterId, setSelectedVoterId] = useState<string | null>(null);
  const [voterToEdit, setVoterToEdit] = useState<Recipient | null>(null);
  const [tableParams, setTableParams] = useState<{ searchText?: string }>({
    searchText: ''
  });

  const routes = useMemo(
    () => [
      { key: 'manual', title: t('voter.registerVoter') },
      { key: 'excel', title: t('voter.bulkRegister') }
    ],
    [t]
  );

  const canHandleInternalBack = showAddVoterView;

  const handleInternalBack = () => {
    if (voterToEdit) {
      setVoterToEdit(null);
      setShowAddVoterView(false);
      return;
    }

    if (showAddVoterView && index > 0) {
      setIndex(0);
      return;
    }

    if (showAddVoterView) {
      setShowAddVoterView(false);
      return;
    }
  };

  useInternalBackHandler(canHandleInternalBack, handleInternalBack);

  const fetchVoters = useCallback(
    async (page: number, pageSize: number, params?: { searchText?: string }) => {
      const result = await recipientService.getRecipients(
        page,
        pageSize,
        params?.searchText ?? ''
      );

      // result.data is RecipientLocal[] and result.total is the count
      return {
        items: result.data as unknown as Recipient[],
        totalCount: result.total
      };
    },
    []
  );

  const table = useServerTable<Recipient, { searchText?: string }>(
    fetchVoters,
    { initialPage: 0, initialRowsPerPage: 10 },
    tableParams
  );

  useFocusEffect(
    useCallback(() => {
      setShowAddVoterView(false);
      setVoterToEdit(null);
      table.setPage(0);
      table.setRowsPerPage(10);
      void table.fetchData(0, 10);
    }, [table])
  );

  const handleVoterSearch = useCallback(
    (text: string) => {
      setTableParams({ searchText: text });
      table.setPage(0);
    },
    [table]
  );

  const addVoter = async (voterData: CreateRecipientPayload) => {
    try {
      await recipientService.createRecipient(voterData);
      void table.fetchData(0, table.rowsPerPage, { searchText: '' });
      showToast(t('voter.addSuccess'), 'success');
      setShowAddVoterView(false);
      setVoterToEdit(null);
    } catch (error: unknown) {
      showToast(extractErrorMessage(error, t('voter.addFailed')), 'error');
    }
  };

  const editVoter = async (voterData: EditRecipientPayload) => {
    if (!voterToEdit?.id) return;
    try {
      await recipientService.editRecipient(voterToEdit.id, voterData);
      await table.fetchData(table.page, table.rowsPerPage, { searchText: '' });
      showToast(t('voter.editSuccess'), 'success');
      setShowAddVoterView(false);
      setVoterToEdit(null);
    } catch (error: unknown) {
      showToast(extractErrorMessage(error, t('voter.editFailed')), 'error');
    }
  };

  const handleEdit = (item: Recipient) => {
    setVoterToEdit(item);
    setShowAddVoterView(true);
  };

  const handleDeleteRequest = (id: string) => {
    setSelectedVoterId(id);
    setDeleteDialogVisible(true);
  };

  const confirmDeleteVoter = async () => {
    if (!selectedVoterId) return;

    try {
      await recipientService.deleteRecipient(selectedVoterId);
      void table.fetchData(table.page, table.rowsPerPage, { searchText: '' });
      showToast(t('voter.deleteSuccess'), 'success');
    } catch (error: unknown) {
      showToast(extractErrorMessage(error, t('voter.deleteFail')), 'error');
    }

    setSelectedVoterId(null);
    setDeleteDialogVisible(false);
  };

  const downloadSampleExcel = async () => {
    try {
      if (Platform.OS === 'web') {
        const link = document.createElement('a');
        link.href = '/sample-voter-upload.xlsx';
        link.download = 'sample-voter-upload.xlsx';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        const asset = Asset.fromModule(sampleVoterUploadAsset);
        await asset.downloadAsync();
        const dest = `${FileSystem.cacheDirectory}sample-voter-upload.xlsx`;
        await FileSystem.copyAsync({
          from: asset.localUri || asset.uri,
          to: dest
        });
        await Sharing.shareAsync(dest);
      }
    } catch (error) {
      logger.error(t('voter.excelDownloadFail'), error);
    }
  };

  const renderScene = ({ route }: { route: TabRoute }) => {
    switch (route.key) {
      case 'manual':
        return (
          <VoterForm
            mode="create"
            onCreate={addVoter}
            voterToEdit={null}
            setVoterToEdit={setVoterToEdit}
            setShowAddVoterView={setShowAddVoterView}
          />
        );
      case 'excel':
        return (
          <View style={styles.flex}>
            <View style={styles.downloadBtnWrapper}>
              <Button
                mode="outlined"
                icon="download"
                onPress={downloadSampleExcel}
                textColor={colors.greenAccent}
                style={styles.downloadButton}
              >
                {t('voter.downloadSample')}
              </Button>
            </View>
            <VoterUpload
              fetchVoters={() => {
                void table.fetchData(0, table.rowsPerPage, { searchText: '' });
              }}
              setShowAddVoterView={setShowAddVoterView}
            />
          </View>
        );
      default:
        return null;
    }
  };

  const renderTabBar = (
    props: SceneRendererProps & {
      navigationState: { index: number; routes: TabRoute[] };
    }
  ) => (
    <TabBar
      {...props}
      indicatorStyle={styles.tabIndicator}
      style={styles.tabBar}
      renderTabBarItem={({ route, key, ...rest }) => {
        const focused =
          props.navigationState.index ===
          props.navigationState.routes.findIndex((r) => r.key === route.key);
        return (
          <TabBarItem
            {...rest}
            key={key}
            route={route}
            labelText={route.title}
            labelStyle={[
              styles.tabLabel,
              focused ? styles.tabLabelFocused : styles.tabLabelDefault
            ]}
          />
        );
      }}
    />
  );

  return (
    <>
      <Surface style={styles.container} elevation={1}>
        <View style={styles.header}>
          <Text variant="titleLarge" style={styles.heading}>
            {showAddVoterView
              ? voterToEdit
                ? t('voter.edit')
                : t('voter.add')
              : t('voter.plural')}
          </Text>

          {!showAddVoterView && (
            <Button
              mode="contained"
              onPress={() => setShowAddVoterView(true)}
              icon="plus"
              labelStyle={styles.addButtonLabel}
              buttonColor={theme.colors.primary}
              style={styles.addButton}
            >
              {t('voter.add')}
            </Button>
          )}
        </View>

        {showAddVoterView ? (
          <KeyboardAvoidingView
            behavior={isIOS ? 'padding' : undefined}
            style={styles.flex}
          >
            {voterToEdit ? (
              <VoterForm
                mode="edit"
                onCreate={voterToEdit ? editVoter : addVoter}
                voterToEdit={voterToEdit}
                setVoterToEdit={setVoterToEdit}
                setShowAddVoterView={setShowAddVoterView}
              />
            ) : (
              <TabView
                navigationState={{ index, routes }}
                renderScene={renderScene}
                renderTabBar={renderTabBar}
                onIndexChange={setIndex}
                initialLayout={{ width: layout.width }}
                swipeEnabled={false}
                lazy
              />
            )}
          </KeyboardAvoidingView>
        ) : (
          <VoterTable
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
            handleVoterSearch={handleVoterSearch}
          />
        )}
      </Surface>

      <DeleteConfirmationDialog
        visible={deleteDialogVisible}
        title={t('voter.delete')}
        message={t('voter.confirmDelete')}
        onCancel={() => setDeleteDialogVisible(false)}
        onConfirm={confirmDeleteVoter}
      />
    </>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      padding: 16,
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
    downloadBtnWrapper: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      paddingTop: 15,
      paddingBottom: 8
    },
    downloadButton: {
      borderRadius: 8,
      borderColor: theme.colors.greenAccent
    },
    tabIndicator: {
      backgroundColor: theme.colors.warning,
      height: 3
    },
    tabBar: {
      backgroundColor: theme.colors.white,
      elevation: 2
    },
    tabLabel: {
      fontSize: 14,
      textTransform: 'capitalize',
      marginVertical: 8
    },
    tabLabelFocused: {
      color: theme.colors.warning,
      fontWeight: '600'
    },
    tabLabelDefault: {
      color: theme.colors.darkGrayText,
      fontWeight: '500'
    },
    flex: {
      flex: 1
    }
  });
