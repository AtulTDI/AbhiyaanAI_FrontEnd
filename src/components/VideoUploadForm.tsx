import React, { useState, useRef, useEffect } from "react";
import {
  View,
  StyleSheet,
  Platform,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import {
  Text,
  TextInput,
  Button,
  useTheme,
  HelperText,
  Divider,
  List,
  Portal,
  Modal,
  Surface,
  IconButton,
} from "react-native-paper";
import { useTranslation } from "react-i18next";
import {
  ResizeMode,
  Video as ExpoVideo,
  AVPlaybackStatusSuccess,
} from "expo-av";
import { Asset } from "expo-asset";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system";
import { useToast } from "./ToastProvider";
import * as DocumentPicker from "expo-document-picker";
import CommonUpload from "./CommonUpload";
import { generateSampleVideo } from "../api/videoApi";
import { getAuthData } from "../utils/storage";
import { usePlatformInfo } from "../hooks/usePlatformInfo";
import {
  joinGroups,
  leaveGroups,
  onEvent,
  startConnection,
  stopConnection,
} from "../services/signalrService";
import { AppTheme } from "../theme";
import { extractErrorMessage } from "../utils/common";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

interface FormData {
  campaign: string;
  message?: string;
  cloningSpeed?: number;
  file: DocumentPicker.DocumentPickerAsset | null;
  errors: {
    campaign?: string;
    message?: string;
    cloningSpeed?: string;
    file?: string;
  };
}

type Props = {
  onAddVideo: (data: any) => void;
  setShowAddView: (val: boolean) => void;
  uploading: boolean;
};

export default function VideoUploadForm({
  onAddVideo,
  setShowAddView,
  uploading,
}: Props) {
  const { isWeb, isMobileWeb } = usePlatformInfo();
  const { t } = useTranslation();
  const theme = useTheme<AppTheme>();
  const { showToast } = useToast();
  const styles = createStyles(theme);
  const { colors } = theme;

  const scrollRef = useRef<KeyboardAwareScrollView>(null);
  const campaignInputRef = useRef<any>(null);

  const [formData, setFormData] = useState<FormData>({
    campaign: "",
    message: "",
    cloningSpeed: 1,
    file: null,
    errors: {},
  });
  const [expanded, setExpanded] = useState(true);
  const [name, setName] = useState("");
  const [generatedUri, setGeneratedUri] = useState<string | null>(null);
  const [voiceCloneId, setVoiceCloneId] = useState<string | null>(null);
  const [messageEditorVisible, setMessageEditorVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [videoAspect, setVideoAspect] = useState<number | null>(null);
  const [authData, setAuthData] = useState(null);

  useEffect(() => {
    const loadAuth = async () => {
      try {
        const data = await getAuthData();
        setAuthData(data);
      } catch (e) {
        console.error("Failed to load auth data", e);
      }
    };

    loadAuth();
  }, []);

  const setupSignalR = async () => {
    const { accessToken, userId } = await getAuthData();

    try {
      await startConnection(accessToken);
      await joinGroups(userId);

      onEvent(
        "ReceiveVideoUpdate",
        (
          recipientId: string,
          status: string,
          customizedVideoLink: string,
          voiceCloneId: string
        ) => {
          if (status === "Completed" && customizedVideoLink) {
            setGeneratedUri(customizedVideoLink);
            setVoiceCloneId(voiceCloneId);
            setLoading(false);
            leaveGroups(userId);
            stopConnection();
          }
        }
      );

      setLoading(true);
      await generateSampleVideo({
        file: formData?.file,
        recipientName: name.trim(),
        cloningSpeed: formData?.cloningSpeed
      });
    } catch (error) {
      showToast(
        extractErrorMessage(error, "Failed to generate sample video"),
        "error"
      );
      setLoading(false);
    }
  };

  const handleGenerateSampleVideo = async () => {
    if (!name.trim()) {
      showToast("Failed to generate sample video", "error");
      return;
    }
    setLoading(true);
    setupSignalR();
  };

  const normalizePastedText = (txt: string) => {
    let normalized = txt.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    normalized = normalized.replace(/^\s+/, "").replace(/\s+$/, "");
    return normalized;
  };

  const handleSubmit = () => {
    const errors: FormData["errors"] = {};
    if (!formData.campaign.trim())
      errors.campaign = t("fieldRequired", { field: t("campaign") });
    if (!formData.file) errors.file = "Please upload a base video";

    if (Object.keys(errors).length > 0) {
      setFormData((prev) => ({ ...prev, errors }));

      if (scrollRef.current) {
        scrollRef.current.scrollToPosition(0, 0, true);
      }
      if (errors.campaign && campaignInputRef.current) {
        campaignInputRef.current.focus();
      }
      return;
    }

    const payload = {
      campaign: formData.campaign.trim(),
      message: normalizePastedText(formData.message),
      cloningSpeed: formData.cloningSpeed,
      voiceCloneId: voiceCloneId,
      file: formData.file
    };

    onAddVideo(payload);
  };

  const downloadSampleVideo = async () => {
    try {
      const asset = Asset.fromModule(require("../assets/sample-video.mp4"));
      await asset.downloadAsync();
      const fileUri = asset.localUri || asset.uri;

      if (Platform.OS === "web") {
        const link = document.createElement("a");
        link.href = fileUri;
        link.download = "sample-video.mp4";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        const dest = `${FileSystem.cacheDirectory}sample-video.mp4`;
        await FileSystem.copyAsync({ from: fileUri, to: dest });
        await Sharing.shareAsync(dest);
      }
    } catch (error) {
      console.error("Error downloading video:", error);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <KeyboardAwareScrollView
        ref={scrollRef}
        contentContainerStyle={{
          padding: 16
        }}
        enableOnAndroid
        extraScrollHeight={Platform.OS === "ios" ? 100 : 120}
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={{
            display: "flex",
            flexDirection: isWeb && !isMobileWeb ? "row" : "column",
            gap: isWeb && !isMobileWeb ? 12 : 0,
          }}
        >
          {/* Campaign */}
          <View style={{ flex: 1 }}>
            <TextInput
              ref={campaignInputRef}
              label={t("campaign")}
              value={formData.campaign}
              onChangeText={(text) =>
                setFormData((prev) => ({
                  ...prev,
                  campaign: text,
                  errors: { ...prev.errors, campaign: undefined },
                }))
              }
              mode="outlined"
              style={styles.input}
              error={!!formData.errors.campaign}
            />
            <HelperText
              type="error"
              visible={!!formData.errors.campaign}
              style={{ paddingLeft: 0 }}
            >
              {formData.errors.campaign}
            </HelperText>
          </View>

          {/* Message */}
          <View style={{ flex: 1 }}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setMessageEditorVisible(true)}
            >
              <TextInput
                label={t("campaignMessage")}
                value={formData.message}
                mode="outlined"
                editable={false}
                pointerEvents="none"
                style={styles.input}
                right={
                  <TextInput.Icon
                    icon="pencil"
                    size={20}
                    color={colors.primary}
                    onPress={() => setMessageEditorVisible(true)}
                  />
                }
              />
              <HelperText
                type="error"
                visible={!!formData.errors.message}
                style={{ paddingLeft: 0 }}
              >
                {formData.errors.message}
              </HelperText>
            </TouchableOpacity>
          </View>

          {/* Cloning Speed */}
          <View style={{ flex: 1 }}>
            <TextInput
              label={t("cloningSpeed")}
              value={`${formData.cloningSpeed.toFixed(1)}x`}
              mode="outlined"
              onChangeText={(text) => {
                let num = parseFloat(text);
                if (isNaN(num)) num = 1;
                if (num < 0.8) num = 0.8;
                if (num > 1.2) num = 1.2;
                num = +num.toFixed(1);

                setFormData((prev) => ({
                  ...prev,
                  cloningSpeed: num,
                  errors: { ...prev.errors, cloningSpeed: undefined },
                }));
              }}
              style={styles.input}
              contentStyle={{ textAlign: "center" }}
              editable={false}
              right={
                <TextInput.Affix
                  text="＋"
                  onPress={() =>
                    setFormData((prev) => ({
                      ...prev,
                      cloningSpeed: Math.min(
                        1.2,
                        +(prev.cloningSpeed + 0.1).toFixed(1)
                      ),
                    }))
                  }
                  textStyle={{
                    fontSize: 22,
                  }}
                />
              }
              left={
                <TextInput.Affix
                  text="－"
                  onPress={() =>
                    setFormData((prev) => ({
                      ...prev,
                      cloningSpeed: Math.max(
                        0.8,
                        +(prev.cloningSpeed - 0.1).toFixed(1)
                      ),
                    }))
                  }
                  textStyle={{
                    fontSize: 22,
                  }}
                />
              }
            />

            <HelperText
              type="error"
              visible={!!formData.errors.cloningSpeed}
              style={{ paddingLeft: 0 }}
            >
              {formData.errors.cloningSpeed}
            </HelperText>
          </View>
        </View>

        <View style={styles.downloadButton}>
          <Button
            mode="outlined"
            icon="download"
            onPress={downloadSampleVideo}
            textColor={colors.greenAccent}
            style={{
              borderRadius: 8,
              borderColor: colors.greenAccent,
            }}
          >
            {t("video.downloadSample")}
          </Button>
        </View>

        {/* Upload Base Video */}
        <CommonUpload
          label={t("uploadBaseVideoTabLabel")}
          fileType="video"
          onUpload={(file) =>
            setFormData((prev) => ({
              ...prev,
              file,
              errors: { ...prev.errors, file: undefined },
            }))
          }
          onCancel={() => {
            setFormData((prev) => ({ ...prev, file: null }));
            setGeneratedUri(null);
          }}
        />
        {formData.errors.file && (
          <HelperText type="error" visible>
            {formData.errors.file}
          </HelperText>
        )}

        {/* Optional Generate Section */}
        {formData.file && (
          <>
            <Divider style={{ marginVertical: 20 }} />

            <List.Accordion
              title={t("video.generateSampleVideo")}
              expanded={expanded}
              onPress={() => setExpanded(!expanded)}
              titleStyle={{
                fontWeight: "bold",
                color: theme.colors.primary,
              }}
            >
              <View style={{ marginTop: 16 }}>
                <TextInput
                  label={t("name")}
                  value={name}
                  onChangeText={setName}
                  mode="outlined"
                  style={styles.input}
                />
                <View style={{ width: "100%", alignItems: "flex-end" }}>
                  <Button
                    mode="contained"
                    onPress={handleGenerateSampleVideo}
                    loading={loading}
                    disabled={loading}
                    style={{ marginTop: 8, borderRadius: 5 }}
                  >
                    {loading
                      ? t("video.generatingVideo")
                      : t("video.generateAndPreview")}
                  </Button>
                </View>

                {generatedUri && (
                  <View style={{ marginTop: 16 }}>
                    <Text
                      variant="titleMedium"
                      style={{ marginBottom: 8, color: colors.primary }}
                    >
                      Preview:
                    </Text>

                    <ExpoVideo
                      source={{ uri: generatedUri }}
                      useNativeControls
                      resizeMode={ResizeMode.CONTAIN}
                      shouldPlay={false}
                      onLoad={(status) => {
                        if (!status.isLoaded) return;

                        const { naturalSize } =
                          status as AVPlaybackStatusSuccess & {
                            naturalSize: {
                              width: number;
                              height: number;
                              orientation?: "portrait" | "landscape";
                            };
                          };

                        if (naturalSize?.width && naturalSize?.height) {
                          setVideoAspect(
                            naturalSize.height / naturalSize.width
                          );
                        }
                      }}
                      style={{
                        width: "100%",
                        height: "150%",
                        aspectRatio: videoAspect ?? 16 / 9,
                        borderRadius: 8,
                        marginTop: 12,
                        alignSelf: "center",
                      }}
                    />
                  </View>
                )}
              </View>
            </List.Accordion>
          </>
        )}
      </KeyboardAwareScrollView>

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
              value={formData.message}
              onChangeText={(text) =>
                setFormData((prev) => ({
                  ...prev,
                  message: text,
                  errors: { ...prev.errors, message: undefined },
                }))
              }
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
          onPress={() => setShowAddView(false)}
          style={styles.actionButton}
        >
          {t("cancel")}
        </Button>
        <Button
          mode="contained"
          icon="upload"
          onPress={handleSubmit}
          disabled={
            !formData.file ||
            uploading ||
            ((authData.isProfessionalVoiceCloning === true ||
              authData.isProfessionalVoiceCloning === "true") &&
              !voiceCloneId)
          }
          loading={uploading}
          style={styles.actionButton}
        >
          {t("uploadBaseVideoTabLabel")}
        </Button>
      </View>
    </View>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    input: {
      marginBottom: 0,
      backgroundColor: theme.colors.white,
    },
    footer: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      padding: 16,
      backgroundColor: theme.colors.white,
      borderTopWidth: 1,
      borderTopColor: theme.colors.lightGray,
      flexDirection: "row",
      gap: 12,
    },
    actionButton: {
      flex: 1,
      borderRadius: 6,
    },
    downloadButton: {
      display: "flex",
      alignItems: "flex-end",
      marginTop: 12,
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
