import React, { useCallback, useRef, useState } from 'react';
import { KeyboardAvoidingView, StyleSheet, View } from 'react-native';
import { Button, Surface, Text, useTheme } from 'react-native-paper';

import { useFocusEffect } from '@react-navigation/native';

import { useTranslation } from 'react-i18next';

import { deleteVideoById, getVideos, shareVideoById, uploadVideo } from '../api/videoApi';
import DeleteConfirmationDialog from '../components/DeleteConfirmationDialog';
import { useToast } from '../components/ToastProvider';
import VideoTable from '../components/VideoTable';
import VideoUploadForm from '../components/VideoUploadForm';
import { useInternalBackHandler } from '../hooks/useInternalBackHandler';
import { usePlatformInfo } from '../hooks/usePlatformInfo';
import { useServerTable } from '../hooks/useServerTable';
import { AppTheme } from '../theme';
import { Video } from '../types/Video';
import { extractErrorMessage, sortByDateDesc } from '../utils/common';

type VideoUploadPayload = {
  campaign: string;
  cloningSpeed?: number;
  file: { uri?: string; name?: string } | null;
  message: string;
  voiceCloneId: string | null;
};

export default function UploadVideoScreen() {
  const { isIOS } = usePlatformInfo();
  const { t } = useTranslation();
  const theme = useTheme<AppTheme>();
  const { colors } = theme;
  const styles = createStyles(theme);
  const { showToast } = useToast();

  const [showAddView, setShowAddView] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const canHandleInternalBack = showAddView;

  const handleInternalBack = () => {
    if (uploading) return;

    if (showAddView) {
      setShowAddView(false);
    }
  };

  useInternalBackHandler(canHandleInternalBack, handleInternalBack);

  const fetchVideos = useCallback(
    async (page: number, pageSize: number) => {
      setLoading(true);
      try {
        const response = await getVideos(page, pageSize);
        const sortedVideos = sortByDateDesc(
          response?.data && Array.isArray(response.data.items) ? response.data.items : [],
          'createdAt'
        );
        return {
          items: sortedVideos ?? [],
          totalCount: response?.data?.totalRecords ?? 0
        };
      } catch (error) {
        showToast(extractErrorMessage(error, t('video.loadVideoFailMessage')), 'error');
        return { items: [], totalCount: 0 }; // ← add this
      } finally {
        setLoading(false);
      }
    },
    [showToast, t]
  );

  const table = useServerTable<Video>(fetchVideos, {
    initialPage: 0,
    initialRowsPerPage: 10
  });
  const tableRef = useRef(table);
  tableRef.current = table;

  useFocusEffect(
    useCallback(() => {
      setShowAddView(false);
      tableRef.current.setPage(0);
      tableRef.current.setRowsPerPage(10);
      void tableRef.current.fetchData(0, 10);
    }, [])
  );

  const handleAddVideo = async (videoData: VideoUploadPayload) => {
    try {
      setUploading(true);
      await uploadVideo(videoData as unknown as Video);
      setUploading(false);
      await table.fetchData(0, table.rowsPerPage);
      setShowAddView(false);
    } catch (error) {
      showToast(extractErrorMessage(error, t('video.addVideoFailMessage')), 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteRequest = (id: string) => {
    setSelectedVideoId(id);
    setDeleteDialogVisible(true);
  };

  const handleShareRequest = async (id: string) => {
    try {
      await shareVideoById(id, true);
      await table.fetchData(table.page, table.rowsPerPage);
    } catch (error) {
      showToast(extractErrorMessage(error, t('video.shareVideoFailMessage')), 'error');
    }
  };

  const handleUnShareRequest = async (id: string) => {
    try {
      await shareVideoById(id, false);
      await table.fetchData(table.page, table.rowsPerPage);
    } catch (error) {
      showToast(extractErrorMessage(error, t('video.shareVideoFailMessage')), 'error');
    }
  };

  const confirmDeleteVideo = async () => {
    if (selectedVideoId) {
      try {
        await deleteVideoById(selectedVideoId);
        await table.fetchData(table.page, table.rowsPerPage);
        showToast(t('video.deleteSuccessMessage'), 'success');
      } catch (error) {
        showToast(extractErrorMessage(error, t('video.deleteFailMessage')), 'error');
      }
      setSelectedVideoId(null);
      setDeleteDialogVisible(false);
    }
  };

  return (
    <>
      <Surface style={styles.container} elevation={1}>
        <KeyboardAvoidingView
          behavior={isIOS ? 'padding' : undefined}
          style={styles.formWrapper}
        >
          {!showAddView ? (
            <>
              {/* Heading Row */}
              <View style={styles.headerRow}>
                <Text variant="titleLarge" style={styles.heading}>
                  {t('video.plural')}
                </Text>
                <Button
                  mode="contained"
                  icon="plus"
                  onPress={() => setShowAddView(true)}
                  style={styles.addButton}
                  buttonColor={colors.primary}
                  textColor={colors.onPrimary}
                >
                  {t('video.add')}
                </Button>
              </View>

              {/* Video Listing */}
              <VideoTable
                data={table.data}
                page={table.page}
                rowsPerPage={table.rowsPerPage}
                totalCount={table.total}
                loading={loading}
                onPageChange={table.setPage}
                onRowsPerPageChange={(size) => {
                  table.setRowsPerPage(size);
                  table.setPage(0);
                }}
                onShare={handleShareRequest}
                onUnshare={handleUnShareRequest}
                onDelete={handleDeleteRequest}
              />
            </>
          ) : (
            <>
              <View style={styles.headerRow}>
                <Text variant="titleLarge" style={styles.heading}>
                  {t('video.add')}
                </Text>
              </View>

              <VideoUploadForm
                onAddVideo={handleAddVideo}
                setShowAddView={setShowAddView}
                uploading={uploading}
              />
            </>
          )}
        </KeyboardAvoidingView>
      </Surface>

      <DeleteConfirmationDialog
        visible={deleteDialogVisible}
        title={t('video.delete')}
        message={t('video.confirmDelete')}
        onCancel={() => setDeleteDialogVisible(false)}
        onConfirm={confirmDeleteVideo}
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
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16
    },
    heading: {
      fontWeight: 'bold',
      color: theme.colors.primary
    },
    addButton: {
      borderRadius: 6
    },
    formWrapper: {
      flex: 1
    }
  });
