import { deleteVoiceById, getVoices } from '../api/voiceApi';
import DeleteConfirmationDialog from '../components/DeleteConfirmationDialog';
import PremiumVoicesTable from '../components/PremiumVoicesTable';
import { useToast } from '../components/ToastProvider';
import { useServerTable } from '../hooks/useServerTable';
import { AppTheme } from '../theme';
import { GetPaginatedVoices } from '../types/Voice';
import { extractErrorMessage, sortByDateDesc } from '../utils/common';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

export default function PremiumVoicesScreen() {
  const { t } = useTranslation();
  const theme = useTheme<AppTheme>();
  const styles = createStyles(theme);
  const { showToast } = useToast();

  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string | null>(null);

  const fetchVoices = useCallback(async (page: number, pageSize: number) => {
    try {
      const response = await getVoices(page, pageSize);
      const sortedVoices = sortByDateDesc(response?.data?.items || [], 'createdAt');
      return {
        items: sortedVoices ?? [],
        totalCount: response?.data?.totalRecords ?? 0
      };
    } catch (error: any) {
      showToast(extractErrorMessage(error, t('voice.loadFailed')), 'error');
    }
  }, []);

  const table = useServerTable<GetPaginatedVoices>(fetchVoices, {
    initialPage: 0,
    initialRowsPerPage: 10
  });

  useFocusEffect(
    useCallback(() => {
      table.setPage(0);
      table.setRowsPerPage(10);
      table.fetchData(0, 10);
    }, [])
  );

  const handleDelete = (id: string) => {
    setSelectedVoiceId(id);
    setDeleteDialogVisible(true);
  };

  const confirmDeleteVoice = async () => {
    if (selectedVoiceId) {
      try {
        await deleteVoiceById(selectedVoiceId);
        table.fetchData(table.page, table.rowsPerPage);
        showToast(t('voice.deleteSucessMessage'), 'success');
      } catch (error: any) {
        showToast(extractErrorMessage(error, t('voice.deleteFailMessage')), 'error');
      }
      setSelectedVoiceId(null);
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
            {t('premiumVoicesTabLabel')}
          </Text>
        </View>

        <PremiumVoicesTable
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
          onDelete={handleDelete}
        />
      </ScrollView>

      <DeleteConfirmationDialog
        visible={deleteDialogVisible}
        title={t('voice.delete')}
        message={t('voice.confirmDelete')}
        onCancel={() => setDeleteDialogVisible(false)}
        onConfirm={confirmDeleteVoice}
      />
    </>
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
      fontWeight: 'bold'
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16
    }
  });
