import React, { useRef, useState } from "react";
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
} from "react-native-paper";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import DeleteConfirmationDialog from "./DeleteConfirmationDialog";

type ImageAsset = {
  uri: string;
  name?: string;
  size?: number | null;
  type?: string | null;
  file?: File | null; // only for web
};

type Props = {
  onAddImage?: (payload: {
    campaignName: string;
    caption: string;
    images: ImageAsset[];
  }) => void;
  uploading?: boolean;
  setShowAddView: (val: boolean) => void;
};

const MAX_IMAGES = 2;

export default function ImageUploadForm({
  onAddImage,
  uploading = false,
  setShowAddView,
}: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { colors } = theme as any;
  const styles = createStyles(theme as any);
  const screenWidth = Dimensions.get("window").width;

  const [campaign, setCampaign] = useState("");
  const [message, setMessage] = useState("");
  const [images, setImages] = useState<ImageAsset[]>([]);
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

  /* ---------- Web file picker (keeps your original behavior) ---------- */
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
            },
          ];
          return next;
        });
        setErrors((e) => ({ ...e, images: undefined }));
      };
      document.body.appendChild(input);
      fileInputRef.current = input;
    }

    // reset and trigger
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

      // Request permission
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (perm.status !== "granted") {
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


      // Handle old and new shapes
      // old: { cancelled: boolean, uri: string }
      // new: { cancelled: boolean, assets: [ { uri, ... } ] }
      const cancelled = (result as any).cancelled ?? false;
      let assetUri: string | null = null;

      if (!cancelled) {
        // try direct uri
        // @ts-ignore
        if ((result as any).uri) assetUri = (result as any).uri;
        else if (Array.isArray((result as any).assets) && (result as any).assets.length)
          assetUri = (result as any).assets[0].uri;
      }

      if (cancelled) {
        return;
      }

      if (!assetUri) {
        console.warn("[pickImageNative] no uri returned from picker");
        setErrors((e) => ({ ...e, images: "No image URI returned" }));
        return;
      }

      // Very common culprit: content:// URIs on Android. Log it.
      if (assetUri.startsWith("content://")) {
        try {
          const infoBefore = await FileSystem.getInfoAsync(assetUri);
        } catch (err) {
          console.warn("[pickImageNative] getInfoAsync(content) failed:", err);
        }

        // Try to copy to cache if necessary (FileSystem.copyAsync may throw for content:// on some setups)
        try {
          const filename = `img_${Date.now()}.jpg`;
          const dest = `${FileSystem.cacheDirectory || ""}${filename}`;
          const copyResult = await FileSystem.copyAsync({ from: assetUri, to: dest });
          assetUri = copyResult.uri;
        } catch (copyErr) {
          console.warn("[pickImageNative] copyAsync failed:", copyErr);
          // fallback — try downloadAsync (sometimes works)
          try {
            const filename = `img_${Date.now()}.jpg`;
            const dest = `${FileSystem.cacheDirectory || ""}${filename}`;
            const downloadResult = await FileSystem.downloadAsync(assetUri, dest);
            assetUri = downloadResult.uri;
          } catch (dlErr) {
            console.warn("[pickImageNative] downloadAsync failed:", dlErr);
            // continue with original content:// uri — might still render on some devices
          }
        }
      }

      // Get file info for picked (or copied) uri
      let info: FileSystem.FileInfoResult | null = null;
      try {
        info = await FileSystem.getInfoAsync(assetUri, { size: true });
      } catch (infoErr) {
        console.warn("[pickImageNative] getInfoAsync failed on final uri:", infoErr);
      }

      const filename = assetUri.split("/").pop() || `img_${Date.now()}.jpg`;

      const newImage: ImageAsset = {
        uri: assetUri,
        name: filename,
        size: info?.size ?? null,
        type: null,
      };

      setImages((prev) => {
        const next = [...prev, newImage];
        return next;
      });
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

  /* ---------- Deleting images ---------- */
  const promptDeleteImage = (index: number) => {
    setIndexToDelete(index);
    setDeleteDialogVisible(true);
  };

  const confirmDeleteImage = () => {
    if (indexToDelete === null) return;

    const img = images[indexToDelete];
    if (isWeb && img?.file) {
      try {
        URL.revokeObjectURL(img.uri);
      } catch (e) {
        console.warn("[confirmDeleteImage] revokeObjectURL failed:", e);
      }
    }

    setImages((prev) => {
      const next = prev.filter((_, i) => i !== indexToDelete);
      return next;
    });
    setIndexToDelete(null);
    setDeleteDialogVisible(false);
  };

  /* ---------- Viewer ---------- */
  const openViewer = (index: number) => {
    setViewerIndex(index);
    setViewerVisible(true);
  };

  /* ---------- submit ---------- */
  const validateAndSubmit = async () => {
    const errs: typeof errors = {};
    if (!campaign.trim())
      errs.campaign = t("fieldRequired", { field: t("campaign") });
    if (images.length === 0) errs.images = t("image.imageRequired");

    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    onAddImage &&
      onAddImage({ campaignName: campaign.trim(), caption: message.trim(), images });
  };

  const isWide = isWeb && screenWidth > 900;

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
            <TextInput
              label={t("campaign")}
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
            <TextInput
              label={t("campaignMessage")}
              value={message}
              onChangeText={setMessage}
              mode="outlined"
              multiline
              numberOfLines={4}
              style={[styles.input, { minHeight: 110 }]}
            />
          </View>
        </View>

        <Divider style={{ marginVertical: 18 }} />

        <Text
          variant="titleMedium"
          style={{
            marginBottom: 6,
            color: colors.primary,
            fontWeight: "600",
            fontSize: 20,
          }}
        >
          {t("image.upload")}
        </Text>
        <Text
          style={{
            marginBottom: 14,
            color: colors.textSecondary,
            fontSize: 14,
          }}
        >
          {t("image.uploadMax", { max: MAX_IMAGES })}
        </Text>

        {/* Row for large previews */}
        <View style={[styles.previewRow]}>
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
                    console.warn("[Image] onError for uri:", img.uri, e.nativeEvent);
                    setErrors((e) => ({ ...e, images: "Failed to render image (see logs)" }));
                  }}
                />

                <TouchableOpacity
                  style={styles.cancelOverlay}
                  onPress={() => promptDeleteImage(idx)}
                  hitSlop={{ top: 10, left: 10, right: 10, bottom: 10 }}
                  accessibilityLabel={t("image.remove")}
                >
                  <Ionicons name="close" size={18} color="#fff" />
                  <Text style={styles.cancelText}>{t("cancel")}</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}

          {images.length < MAX_IMAGES && (
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

        {/* Centered error message under previews */}
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
                  console.warn("[Modal Image] onError:", images[viewerIndex].uri, e.nativeEvent);
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

      {/* Footer */}
      <View style={styles.footer}>
        <Button
          mode="outlined"
          onPress={() => setShowAddView(false)}
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
          {t("image.upload")}
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
  });