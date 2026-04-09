import React, { useCallback, useRef, useState } from 'react';
import { KeyboardAvoidingView, StyleSheet, View } from 'react-native';
import { Button, Surface, Text, useTheme } from 'react-native-paper';

import { useFocusEffect } from '@react-navigation/native';

import { useTranslation } from 'react-i18next';

import {
  deleteImageById,
  getImages,
  shareImageById,
  updateImageById,
  uploadImages
} from '../api/imageApi';
import DeleteConfirmationDialog from '../components/DeleteConfirmationDialog';
import ImageTable from '../components/ImageTable';
import ImageUploadForm from '../components/ImageUploadForm';
import { useToast } from '../components/ToastProvider';
import { useInternalBackHandler } from '../hooks/useInternalBackHandler';
import { usePlatformInfo } from '../hooks/usePlatformInfo';
import { useServerTable } from '../hooks/useServerTable';
import { AppTheme } from '../theme';
import { Image } from '../types/Image';
import { NativeFormDataFile } from '../types/Upload';
import { extractErrorMessage, sortByDateDesc } from '../utils/common';
import { getAuthData } from '../utils/storage';

type ImageUploadAsset = {
  file?: File | null;
  locked?: boolean;
  name?: string;
  type?: string | null;
  uri: string;
};

type ImageUploadPayload = {
  campaignName: string;
  caption: string;
  images: ImageUploadAsset[];
};

export default function UploadImageScreen() {
  const { isWeb, isIOS } = usePlatformInfo();
  const { t } = useTranslation();
  const theme = useTheme<AppTheme>();
  const { colors } = theme;
  const styles = createStyles(theme);
  const { showToast } = useToast();

  const [showAddView, setShowAddView] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imageToEdit, setImageToEdit] = useState<Image | null>(null);
  const canHandleInternalBack = showAddView;

  const handleInternalBack = () => {
    if (uploading) return;

    if (showAddView) {
      setShowAddView(false);
    }
  };

  useInternalBackHandler(canHandleInternalBack, handleInternalBack);

  const fetchImages = useCallback(
    async (page: number, pageSize: number) => {
      setLoading(true);
      try {
        const response = await getImages(page, pageSize);
        const sortedImages = sortByDateDesc(
          response?.data && Array.isArray(response.data.items) ? response.data.items : [],
          'createdAt'
        );

        return {
          items: sortedImages ?? [],
          totalCount: response?.data?.totalRecords ?? 0
        };
      } catch (error) {
        showToast(extractErrorMessage(error, t('image.loadImageFailMessage')), 'error');
        return {
          items: [],
          totalCount: 0
        };
      } finally {
        setLoading(false);
      }
    },
    [showToast, t]
  );

  const table = useServerTable<Image>(fetchImages, {
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

  const guessMimeType = (filename?: string) => {
    if (!filename) return 'image/jpeg';
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'gif':
        return 'image/gif';
      case 'heic':
        return 'image/heic';
      case 'webp':
        return 'image/webp';
      default:
        return 'application/octet-stream';
    }
  };

  const handleAddImage = async (imageData: ImageUploadPayload) => {
    const { userId } = await getAuthData();
    const formData = new FormData();
    const { campaignName, caption, images } = imageData;

    if (!imageToEdit) {
      formData.append('userId', String(userId));
    }

    formData.append('campaignName', campaignName);
    formData.append(imageToEdit ? 'message' : 'caption', caption || '');

    if (!imageToEdit) {
      images.forEach((img, index) => {
        if (img.locked) {
          if (img.uri) formData.append('existingImages[]', img.uri);
          return;
        }

        if (isWeb && img.file instanceof File) {
          formData.append('Images', img.file);
          return;
        }

        const name = img.name || `photo_${Date.now()}_${index}.jpg`;
        const type = img.type || guessMimeType(name);
        const nativeFile: NativeFormDataFile = {
          uri: img.uri,
          name,
          type
        };

        formData.append('Images', nativeFile as unknown as Blob);
      });
    }

    try {
      setUploading(true);
      if (imageToEdit) {
        await updateImageById(imageToEdit.id, formData);
      } else {
        await uploadImages(formData);
      }
      setUploading(false);
      await table.fetchData(0, table.rowsPerPage);
      setShowAddView(false);
    } catch (error) {
      showToast(extractErrorMessage(error, t('image.addImageFailMessage')), 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteRequest = (id: string) => {
    setSelectedImageId(id);
    setDeleteDialogVisible(true);
  };

  const handleShareRequest = async (id: string) => {
    try {
      await shareImageById(id, true);
      await table.fetchData(table.page, table.rowsPerPage);
    } catch (error) {
      showToast(extractErrorMessage(error, t('image.shareImageFailMessage')), 'error');
    }
  };

  const handleUnShareRequest = async (id: string) => {
    try {
      await shareImageById(id, false);
      await table.fetchData(table.page, table.rowsPerPage);
    } catch (error) {
      showToast(extractErrorMessage(error, t('image.shareImageFailMessage')), 'error');
    }
  };

  const handleEdit = (item: Image) => {
    setImageToEdit(item);
    setShowAddView(true);
  };

  const confirmDeleteImage = async () => {
    if (selectedImageId) {
      try {
        await deleteImageById(selectedImageId);
        await table.fetchData(table.page, table.rowsPerPage);
        showToast(t('image.deleteSuccessMessage'), 'success');
      } catch (error) {
        showToast(extractErrorMessage(error, t('image.deleteFailMessage')), 'error');
      }
      setSelectedImageId(null);
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
                  {t('image.plural')}
                </Text>
                <Button
                  mode="contained"
                  icon="plus"
                  onPress={() => setShowAddView(true)}
                  style={styles.addButton}
                  buttonColor={colors.primary}
                  textColor={colors.onPrimary}
                >
                  {t('image.add')}
                </Button>
              </View>

              {/* Image Listing */}
              <ImageTable
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
                onEdit={handleEdit}
                onDelete={handleDeleteRequest}
              />
            </>
          ) : (
            <>
              <View style={styles.headerRow}>
                <Text variant="titleLarge" style={styles.heading}>
                  {t(imageToEdit ? 'image.edit' : 'image.add')}
                </Text>
              </View>

              <ImageUploadForm
                imageToEdit={imageToEdit as unknown as Image}
                setImageToEdit={setImageToEdit}
                setShowAddView={setShowAddView}
                onAddImage={handleAddImage}
                uploading={uploading}
              />
            </>
          )}
        </KeyboardAvoidingView>
      </Surface>

      <DeleteConfirmationDialog
        visible={deleteDialogVisible}
        title={t('image.delete')}
        message={t('image.confirmDelete')}
        onCancel={() => setDeleteDialogVisible(false)}
        onConfirm={confirmDeleteImage}
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
