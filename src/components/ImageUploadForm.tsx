import React, { useRef, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  View,
  StyleSheet,
  Platform,
  Dimensions,
  Image,
  TouchableOpacity,
} from "react-native";
import {
  Text,
  TextInput,
  Button,
  useTheme,
  HelperText,
  Divider,
  Portal,
  Modal,
  IconButton,
  Surface,
} from "react-native-paper";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import { Image as ImageType } from "../types/Image";
import { FixedLabel } from "./FixedLabel";
import DeleteConfirmationDialog from "./DeleteConfirmationDialog";

type ImageAsset = {
  uri: string;
  name?: string;
  size?: number | null;
  type?: string | null;
  file?: File | null;
  locked?: boolean;
};

type Props = {
  onAddImage?: (payload: {
    campaignName: string;
    caption: string;
    images: ImageAsset[];
  }) => void;
  uploading?: boolean;
  setShowAddView: (val: boolean) => void;
  imageToEdit: ImageType;
  setImageToEdit: (image: ImageType) => void;
  initialImages?: ImageAsset[];
};

const MAX_IMAGES = 2;
const INPUT_NATIVE_ID = "campaignMessageInput";

export default function ImageUploadForm({
  onAddImage,
  uploading = false,
  setShowAddView,
  imageToEdit,
  setImageToEdit,
}: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { colors } = theme as any;
  const styles = createStyles(theme as any);
  const screenWidth = Dimensions.get("window").width;

  const [campaign, setCampaign] = useState(
    imageToEdit ? imageToEdit.campaignName : ""
  );
  const [message, setMessage] = useState(
    imageToEdit ? imageToEdit.message ?? "" : ""
  );
  const [messageEditorVisible, setMessageEditorVisible] = useState(false);

  const [images, setImages] = useState<ImageAsset[]>(() => {
    return imageToEdit
      ? imageToEdit.images.map((img) => ({
          uri: img,
          locked: true,
        }))
      : [];
  });

  const [errors, setErrors] = useState<{ campaign?: string; images?: string }>(
    {}
  );
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerIndex, setViewerIndex] = useState<number>(0);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [indexToDelete, setIndexToDelete] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // responsive preview sizing
  const isSmall = screenWidth < 600;
  const previewSize = isSmall
    ? Math.min(screenWidth - 48, 360)
    : Math.min(Math.floor((screenWidth - 64) / 2), 420);

  const isWeb = Platform.OS === "web";
  const isWide = isWeb && screenWidth > 900;

  // normalize pasted text (preserve markdown, emojis, internal whitespace)
  const normalizePastedText = (txt: string) => {
    let normalized = txt.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    // trim only overall leading/trailing whitespace/newlines, preserve internal spacing
    normalized = normalized.replace(/^\s+/, "").replace(/\s+$/, "");
    return normalized;
  };

  // Web paste handling: capture text/plain when our input is focused
  useEffect(() => {
    if (Platform.OS !== "web") return;

    const handlePaste = (e: any) => {
      try {
        const clipboard = (e.clipboardData ??
          (window as any).clipboardData) as DataTransfer;
        if (!clipboard) return;
        const plain = clipboard.getData("text/plain");
        if (plain == null || plain === "") return;

        const activeId =
          (document.activeElement &&
            (document.activeElement as HTMLElement).id) ||
          "";
        if (activeId === INPUT_NATIVE_ID) {
          e.preventDefault();
          setMessage(normalizePastedText(plain));
          setErrors((err) => ({ ...err, images: undefined }));
        }
      } catch (err) {
        // don't break app if browser behaves differently
      }
    };

    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, []);

  /* ---------- Web file picker ---------- */
  const pickImageWeb = () => {
    let input = fileInputRef.current;
    if (!input) {
      input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.multiple = false;
      input.style.display = "none";
      input.onchange = () => {
        const file = input!.files && input!.files[0];
        if (!file) return;
        const objectUrl = URL.createObjectURL(file);
        setImages((prev) => {
          const next = [
            ...prev,
            {
              uri: objectUrl,
              name: file.name,
              size: file.size,
              type: file.type,
              file,
              locked: false, // new user-selected image
            },
          ];
          return next;
        });
        setErrors((e) => ({ ...e, images: undefined }));
      };
      document.body.appendChild(input);
      fileInputRef.current = input;
    }

    input.value = "";
    input.click();
  };

  /* ---------- Native image picker (expo-image-picker) ---------- */
  const pickImageNative = async () => {
    try {
      if (images.length >= MAX_IMAGES) {
        const msg = `Maximum of ${MAX_IMAGES} images allowed`;
        setErrors((e) => ({ ...e, images: msg }));
        return;
      }

      let ImagePickerModule: typeof import("expo-image-picker") | null = null;
      try {
        ImagePickerModule = await import("expo-image-picker");
      } catch (impErr) {
        console.warn(
          "[pickImageNative] expo-image-picker dynamic import failed:",
          impErr
        );
      }

      const ImagePicker = ImagePickerModule as any;

      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync?.();
      if (perm && perm.status !== "granted") {
        const message = "Permission to access photos was denied.";
        setErrors((e) => ({ ...e, images: message }));
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: false,
        quality: 0.8,
        base64: false,
      });

      const cancelled = (result as any).cancelled ?? false;

      if (cancelled) return;

      let assetUri: string | null = null;
      if ((result as any).uri) assetUri = (result as any).uri;
      else if (
        Array.isArray((result as any).assets) &&
        (result as any).assets.length
      )
        assetUri = (result as any).assets[0].uri;

      if (!assetUri) {
        setErrors((e) => ({ ...e, images: "No image URI returned" }));
        return;
      }

      if (assetUri.startsWith("content://")) {
        try {
          await FileSystem.getInfoAsync(assetUri);
        } catch (err) {
          console.warn("[pickImageNative] getInfoAsync(content) failed:", err);
        }

        try {
          const filename = `img_${Date.now()}.jpg`;
          const dest = `${FileSystem.cacheDirectory || ""}${filename}`;
          const copyResult = await FileSystem.copyAsync({
            from: assetUri,
            to: dest,
          });
          assetUri = (copyResult?.uri as string) || dest;
        } catch (copyErr) {
          console.warn("[pickImageNative] copyAsync failed:", copyErr);
          try {
            const filename = `img_${Date.now()}.jpg`;
            const dest = `${FileSystem.cacheDirectory || ""}${filename}`;
            const downloadResult = await FileSystem.downloadAsync(
              assetUri,
              dest
            );
            assetUri = downloadResult.uri;
          } catch (dlErr) {
            console.warn("[pickImageNative] downloadAsync failed:", dlErr);
          }
        }
      }

      let info: FileSystem.FileInfoResult | null = null;
      try {
        info = await FileSystem.getInfoAsync(assetUri, { size: true });
      } catch (infoErr) {
        console.warn("[pickImageNative] getInfoAsync failed:", infoErr);
      }

      const filename = assetUri.split("/").pop() || `img_${Date.now()}.jpg`;
      const newImage: ImageAsset = {
        uri: assetUri,
        name: filename,
        size: info?.size ?? null,
        type: null,
        locked: false,
      };

      setImages((prev) => [...prev, newImage]);
      setErrors((e) => ({ ...e, images: undefined }));
    } catch (err) {
      console.error("[pickImageNative] unexpected error:", err);
      setErrors((e) => ({ ...e, images: "Image pick failed (see logs)" }));
    }
  };

  const pickImage = () => {
    if (images.length >= MAX_IMAGES) {
      const msg = `Maximum of ${MAX_IMAGES} images allowed`;
      setErrors((e) => ({ ...e, images: msg }));
      return;
    }

    if (isWeb) pickImageWeb();
    else pickImageNative();
  };

  /* ---------- Deleting images (only if not locked) ---------- */
  const promptDeleteImage = (index: number) => {
    const img = images[index];
    if (img?.locked) {
      // Safety: locked images cannot be removed
      return;
    }
    setIndexToDelete(index);
    setDeleteDialogVisible(true);
  };

  const confirmDeleteImage = () => {
    if (indexToDelete === null) return;

    const img = images[indexToDelete];

    if (img.locked) {
      // safeguard – locked images should never be here
      setIndexToDelete(null);
      setDeleteDialogVisible(false);
      return;
    }

    if (isWeb && img?.file) {
      try {
        URL.revokeObjectURL(img.uri);
      } catch (e) {
        console.warn("[confirmDeleteImage] revokeObjectURL failed:", e);
      }
    }

    setImages((prev) => prev.filter((_, i) => i !== indexToDelete));
    setIndexToDelete(null);
    setDeleteDialogVisible(false);
  };

  /* ---------- Viewer ---------- */
  const openViewer = (index: number) => {
    setViewerIndex(index);
    setViewerVisible(true);
  };

  /* ---------- submit ---------- */
  const validateAndSubmit = () => {
    const errs: typeof errors = {};
    if (!campaign.trim())
      errs.campaign = t("fieldRequired", { field: t("campaign") });
    if (images.length === 0) errs.images = t("image.imageRequired");

    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    const payloadMessage = normalizePastedText(message);

    onAddImage &&
      onAddImage({
        campaignName: campaign.trim(),
        caption: payloadMessage,
        images,
      });
  };

  return (
    <View style={{ flex: 1 }}>
      <KeyboardAwareScrollView
        contentContainerStyle={{ padding: 10, paddingBottom: 160 }}
        enableOnAndroid
        extraScrollHeight={Platform.OS === "ios" ? 100 : 120}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ flexDirection: isWide ? "row" : "column", gap: 12 }}>
          <View style={{ flex: 1 }}>
            <FixedLabel label={t("campaign")} required />
            <TextInput
              placeholder={t("placeholder.enterCampaign")}
              placeholderTextColor={theme.colors.placeholder}
              value={campaign}
              onChangeText={(text) => {
                setCampaign(text);
                setErrors((e) => ({ ...e, campaign: undefined }));
              }}
              mode="outlined"
              style={styles.input}
            />
            <HelperText
              type="error"
              visible={!!errors.campaign}
              style={{ paddingLeft: 0 }}
            >
              {errors.campaign}
            </HelperText>
          </View>

          <View style={{ flex: 1 }}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setMessageEditorVisible(true)}
            >
              <FixedLabel label={t("campaignMessage")} />
              <TextInput
                placeholder={t("placeholder.enterCampaignMessage")}
                placeholderTextColor={theme.colors.placeholder}
                value={message}
                mode="outlined"
                editable={false}
                pointerEvents="none"
                style={[styles.input]}
                right={
                  <TextInput.Icon
                    icon="pencil"
                    size={20}
                    color={colors.primary}
                    onPress={() => setMessageEditorVisible(true)}
                  />
                }
              />
            </TouchableOpacity>
          </View>
        </View>

        <Divider style={{ marginVertical: 18 }} />

        <Text
          variant="titleMedium"
          style={{
            marginBottom: imageToEdit ? 14 : 6,
            color: colors.primary,
            fontWeight: "600",
            fontSize: 20,
          }}
        >
          {t(imageToEdit ? "image.view" : "image.upload")}
        </Text>
        {!imageToEdit && (
          <Text
            style={{
              marginBottom: 14,
              color: colors.textSecondary,
              fontSize: 14,
            }}
          >
            {t("image.uploadMax", { max: MAX_IMAGES })}
          </Text>
        )}

        {/* Previews */}
        <View style={styles.previewRow}>
          {images.map((img, idx) => (
            <TouchableOpacity
              key={idx}
              activeOpacity={0.9}
              onPress={() => openViewer(idx)}
              accessibilityLabel={`Preview image ${idx + 1}`}
            >
              <View
                style={[
                  styles.previewWrapper,
                  { width: previewSize, height: previewSize },
                ]}
              >
                <Image
                  source={{ uri: img.uri }}
                  style={styles.preview}
                  resizeMode="contain"
                  onError={(e) => {
                    console.warn(
                      "[Image] onError for uri:",
                      img.uri,
                      e.nativeEvent
                    );
                    setErrors((err) => ({
                      ...err,
                      images: "Failed to render image (see logs)",
                    }));
                  }}
                />

                {/* Delete button only for non-locked images */}
                {!img.locked && (
                  <TouchableOpacity
                    style={styles.cancelOverlay}
                    onPress={() => promptDeleteImage(idx)}
                    hitSlop={{ top: 10, left: 10, right: 10, bottom: 10 }}
                    accessibilityLabel={t("image.remove")}
                  >
                    <Ionicons name="close" size={18} color="#fff" />
                    <Text style={styles.cancelText}>{t("cancel")}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>
          ))}

          {/* Add button – still allowed in edit mode, but respects MAX_IMAGES */}
          {!imageToEdit && images.length < MAX_IMAGES && (
            <TouchableOpacity
              onPress={pickImage}
              activeOpacity={0.75}
              accessibilityLabel={t("image.add")}
              style={[
                styles.addPreview,
                { width: previewSize, height: previewSize },
              ]}
            >
              <Ionicons name="add" size={40} color={colors.primary} />
              <Text style={{ marginTop: 8, color: colors.primary }}>
                {t("image.addSingular")}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {errors.images && (
          <View style={{ width: "100%", alignItems: "center", marginTop: 8 }}>
            <HelperText
              type="error"
              visible
              style={{
                paddingLeft: 0,
                textAlign: "center",
                color: colors.error,
              }}
            >
              {errors.images}
            </HelperText>
          </View>
        )}
      </KeyboardAwareScrollView>

      {/* Viewer Modal */}
      <Portal>
        <Modal
          visible={viewerVisible}
          onDismiss={() => setViewerVisible(false)}
          contentContainerStyle={[
            styles.modalContainer,
            { height: isSmall ? "70%" : "80%" },
          ]}
        >
          <View style={styles.modalHeader}>
            <IconButton
              icon="close"
              size={24}
              onPress={() => setViewerVisible(false)}
            />
          </View>

          <View style={styles.modalBody}>
            {images[viewerIndex] && (
              <Image
                source={{ uri: images[viewerIndex].uri }}
                style={styles.modalImage}
                resizeMode="contain"
                onError={(e) => {
                  console.warn(
                    "[Modal Image] onError:",
                    images[viewerIndex].uri,
                    e.nativeEvent
                  );
                }}
              />
            )}
          </View>
        </Modal>
      </Portal>

      <DeleteConfirmationDialog
        visible={deleteDialogVisible}
        title={t("image.delete")}
        message={t("image.confirmDelete")}
        onCancel={() => {
          setDeleteDialogVisible(false);
          setIndexToDelete(null);
        }}
        onConfirm={confirmDeleteImage}
      />

      <Portal>
        <Modal
          visible={messageEditorVisible}
          onDismiss={() => setMessageEditorVisible(false)}
          contentContainerStyle={styles.dialogContainer}
        >
          <Surface style={styles.messageModalCard} elevation={4}>
            {/* Header */}
            <View style={styles.messageHeader}>
              <Text style={styles.messageTitle}>{t("campaignMessage")}</Text>

              <IconButton
                icon="close"
                size={20}
                onPress={() => setMessageEditorVisible(false)}
                style={styles.closeIcon}
              />
            </View>

            {/* Input */}
            <TextInput
              value={message}
              onChangeText={setMessage}
              mode="outlined"
              multiline
              textAlignVertical="top"
              style={styles.messageInput}
              outlineColor={colors.inputBorder}
              activeOutlineColor={colors.primary}
            />

            {/* Actions */}
            <View style={styles.modalActions}>
              <Button
                mode="outlined"
                onPress={() => setMessageEditorVisible(false)}
                style={styles.secondaryButton}
                textColor={colors.darkGrayText}
              >
                {t("cancel")}
              </Button>

              <Button
                mode="contained"
                onPress={() => setMessageEditorVisible(false)}
                style={styles.primaryButton}
                buttonColor={colors.primary}
                textColor={colors.white}
              >
                {t("save")}
              </Button>
            </View>
          </Surface>
        </Modal>
      </Portal>

      {/* Footer */}
      <View style={styles.footer}>
        <Button
          mode="outlined"
          onPress={() => {
            setImageToEdit(null);
            setShowAddView(false);
          }}
          style={styles.actionButton}
        >
          {t("cancel")}
        </Button>

        <Button
          mode="contained"
          icon={() => <Ionicons name="cloud-upload" size={18} color="#fff" />}
          onPress={validateAndSubmit}
          disabled={uploading}
          loading={uploading}
          style={styles.actionButton}
        >
          {imageToEdit ? t("update") : t("image.upload")}
        </Button>
      </View>
    </View>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    input: {
      backgroundColor: theme.colors.white,
      marginBottom: 0,
      height: 44,
    },
    previewRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 30,
      alignItems: "center",
      justifyContent: "center",
      margin: 0,
      width: "100%",
    },
    previewWrapper: {
      borderRadius: 12,
      overflow: "hidden",
      backgroundColor: theme.colors.paperBackground,
      borderWidth: 1,
      borderColor: theme.colors.subtleBorder,
      position: "relative",
      elevation: 4,
      shadowColor: "#000",
      shadowOpacity: 0.12,
      shadowRadius: 8,
      alignItems: "center",
      justifyContent: "center",
    },
    preview: {
      width: "100%",
      height: "100%",
    },
    cancelOverlay: {
      position: "absolute",
      top: 10,
      right: 10,
      backgroundColor: "rgba(0,0,0,0.45)",
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 20,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    cancelText: {
      color: "#fff",
      marginLeft: 6,
      fontSize: 13,
    },
    addPreview: {
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.outline,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.background,
    },
    footer: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      padding: 16,
      borderTopWidth: 1,
      borderTopColor: theme.colors.elevation?.level2 || "#eee",
      flexDirection: "row",
      gap: 12,
      backgroundColor: theme.colors.white,
    },
    actionButton: {
      flex: 1,
      borderRadius: 6,
    },
    modalContainer: {
      backgroundColor: theme.colors.background,
      margin: 20,
      borderRadius: 10,
      overflow: "hidden",
      height: "80%",
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "flex-end",
    },
    modalBody: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: 8,
      backgroundColor: theme.colors.background,
    },
    modalImage: {
      width: "100%",
      height: "100%",
    },
    messageModalCard: {
      width: "92%",
      maxWidth: 520,
      maxHeight: "75%",
      backgroundColor: theme.colors.white,
      borderRadius: 18,
      padding: 20,
      borderWidth: 1,
      borderColor: theme.colors.mutedBorder,
      shadowColor: theme.colors.black,
      shadowOpacity: 0.12,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 6,
    },
    messageHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 10,
    },
    dialogContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 24,
    },
    messageTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: theme.colors.primary,
    },
    closeIcon: {
      margin: 0,
    },
    messageSubtitle: {
      fontSize: 13,
      color: theme.colors.textSecondary,
      marginBottom: 14,
    },
    messageInput: {
      height: 250,
      backgroundColor: theme.colors.paperBackground,
      fontSize: 15,
    },
    modalActions: {
      flexDirection: "row",
      gap: 12,
      marginTop: 22,
    },
    secondaryButton: {
      flex: 1,
      borderRadius: 10,
      borderColor: theme.colors.borderGray,
    },
    primaryButton: {
      flex: 1,
      borderRadius: 10,
    },
  });
