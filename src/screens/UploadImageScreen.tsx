import React, { useCallback, useState } from "react";
import { StyleSheet, View, KeyboardAvoidingView } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Surface, Text, Button, useTheme } from "react-native-paper";
import { useTranslation } from "react-i18next";
import ImageTable from "../components/ImageTable";
import ImageUploadForm from "../components/ImageUploadForm";
import { useToast } from "../components/ToastProvider";
import DeleteConfirmationDialog from "../components/DeleteConfirmationDialog";
import { useServerTable } from "../hooks/useServerTable";
import { usePlatformInfo } from "../hooks/usePlatformInfo";
import { useInternalBackHandler } from "../hooks/useInternalBackHandler";
import { GetPaginatedImages, Image } from "../types/Image";
import {
  deleteImageById,
  getImages,
  shareImageById,
  updateImageById,
  uploadImages,
} from "../api/imageApi";
import { getAuthData } from "../utils/storage";
import { extractErrorMessage, sortByDateDesc } from "../utils/common";
import { AppTheme } from "../theme";

export default function UploadImageScreen() {
  const { isWeb, isIOS } = usePlatformInfo();
  const { t } = useTranslation();
  const theme = useTheme<AppTheme>();
  const { colors } = theme;
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

  const fetchImages = useCallback(async (page: number, pageSize: number) => {
    setLoading(true);
    try {
      const response = await getImages(page, pageSize);
      const sortedImages = sortByDateDesc(
        response?.data && Array.isArray(response.data.items)
          ? response.data.items
          : [],
        "createdAt",
      );

      return {
        items: sortedImages ?? [],
        totalCount: response?.data?.totalRecords ?? 0,
      };
    } catch (error: any) {
      showToast(
        extractErrorMessage(error, t("image.loadImageFailMessage")),
        "error",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const table = useServerTable<GetPaginatedImages>(fetchImages, {
    initialPage: 0,
    initialRowsPerPage: 10,
  });

  useFocusEffect(
    useCallback(() => {
      setShowAddView(false);
      table.setPage(0);
      table.setRowsPerPage(10);
      table.fetchData(0, 10);
    }, []),
  );

  const guessMimeType = (filename?: string) => {
    if (!filename) return "image/jpeg";
    const ext = filename.split(".").pop()?.toLowerCase();
    switch (ext) {
      case "jpg":
      case "jpeg":
        return "image/jpeg";
      case "png":
        return "image/png";
      case "gif":
        return "image/gif";
      case "heic":
        return "image/heic";
      case "webp":
        return "image/webp";
      default:
        return "application/octet-stream";
    }
  };

  const handleAddImage = async (imageData: any) => {
    const { userId } = await getAuthData();
    const formData = new FormData();
    const { campaignName, caption, images } = imageData;

    if (!imageToEdit) {
      formData.append("userId", String(userId));
    }

    formData.append("campaignName", campaignName);
    formData.append(imageToEdit ? "message" : "caption", caption || "");

    !imageToEdit &&
      images.forEach((img: any, index: number) => {
        if (img.locked) {
          if (img.uri) formData.append("existingImages[]", img.uri);
          return;
        }

        if (isWeb && img.file instanceof File) {
          formData.append("Images", img.file);
          return;
        }

        const name = img.name || `photo_${Date.now()}_${index}.jpg`;
        const type = img.type || guessMimeType(name);

        formData.append("Images", {
          uri: img.uri,
          name,
          type,
        } as any);
      });

    try {
      setUploading(true);
      imageToEdit
        ? await updateImageById(imageToEdit.id, formData)
        : await uploadImages(formData);
      setUploading(false);
      await table.fetchData(0, table.rowsPerPage);
      setShowAddView(false);
    } catch (error) {
      showToast(
        extractErrorMessage(error, t("image.addImageFailMessage")),
        "error",
      );
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
      showToast(
        extractErrorMessage(error, t("image.shareImageFailMessage")),
        "error",
      );
    }
  };

  const handleUnShareRequest = async (id: string) => {
    try {
      await shareImageById(id, false);
      await table.fetchData(table.page, table.rowsPerPage);
    } catch (error) {
      showToast(
        extractErrorMessage(error, t("image.shareImageFailMessage")),
        "error",
      );
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
        showToast(t("image.deleteSucessMessage"), "success");
      } catch (error: any) {
        showToast(
          extractErrorMessage(error, t("image.deleteFailMessage")),
          "error",
        );
      }
      setSelectedImageId(null);
      setDeleteDialogVisible(false);
    }
  };

  return (
    <>
      <Surface style={styles.container} elevation={1}>
        <KeyboardAvoidingView
          behavior={isIOS ? "padding" : undefined}
          style={{ flex: 1 }}
        >
          {!showAddView ? (
            <>
              {/* Heading Row */}
              <View style={styles.headerRow}>
                <Text
                  variant="titleLarge"
                  style={[styles.heading, { color: colors.primary }]}
                >
                  {t("image.plural")}
                </Text>
                <Button
                  mode="contained"
                  icon="plus"
                  onPress={() => setShowAddView(true)}
                  style={{ borderRadius: 6 }}
                  buttonColor={colors.primary}
                  textColor={colors.onPrimary}
                >
                  {t("image.add")}
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
                <Text
                  variant="titleLarge"
                  style={[styles.heading, { color: colors.primary }]}
                >
                  {t(imageToEdit ? "image.edit" : "image.add")}
                </Text>
              </View>

              <ImageUploadForm
                imageToEdit={imageToEdit}
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
        title={t("image.delete")}
        message={t("image.confirmDelete")}
        onCancel={() => setDeleteDialogVisible(false)}
        onConfirm={confirmDeleteImage}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    flex: 1,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  heading: {
    fontWeight: "bold",
  },
});
