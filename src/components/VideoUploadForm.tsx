import { generateSampleVideo } from '../api/videoApi';
import sampleVideoAsset from '../assets/sample-video.mp4';
import { usePlatformInfo } from '../hooks/usePlatformInfo';
import {
  joinGroups,
  leaveGroups,
  onEvent,
  startConnection,
  stopConnection
} from '../services/signalrService';
import { AppTheme } from '../theme';
import { extractErrorMessage } from '../utils/common';
import { logger } from '../utils/logger';
import { AuthData, getAuthData } from '../utils/storage';
import CommonUpload from './CommonUpload';
import { FixedLabel } from './FixedLabel';
import { useToast } from './ToastProvider';
import { Asset } from 'expo-asset';
import { AVPlaybackStatusSuccess, ResizeMode, Video as ExpoVideo } from 'expo-av';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Platform,
  StyleSheet,
  TextInput as NativeTextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import {
  Button,
  Divider,
  HelperText,
  IconButton,
  List,
  Modal,
  Portal,
  Surface,
  Text,
  TextInput,
  useTheme
} from 'react-native-paper';

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

type VideoUploadPayload = {
  campaign: string;
  cloningSpeed?: number;
  file: DocumentPicker.DocumentPickerAsset | null;
  message: string;
  voiceCloneId: string | null;
};

type Props = {
  onAddVideo: (data: VideoUploadPayload) => void;
  setShowAddView: (val: boolean) => void;
  uploading: boolean;
};

export default function VideoUploadForm({
  onAddVideo,
  setShowAddView,
  uploading
}: Props) {
  const { isWeb, isMobileWeb } = usePlatformInfo();
  const { t } = useTranslation();
  const theme = useTheme<AppTheme>();
  const { showToast } = useToast();
  const styles = createStyles(theme, { isWeb, isMobileWeb });
  const { colors } = theme;

  const scrollRef = useRef<KeyboardAwareScrollView>(null);
  const campaignInputRef = useRef<NativeTextInput | null>(null);
  const messageInputRef = useRef<NativeTextInput | null>(null);

  const [formData, setFormData] = useState<FormData>({
    campaign: '',
    message: '',
    cloningSpeed: 1,
    file: null,
    errors: {}
  });
  const [expanded, setExpanded] = useState(true);
  const [name, setName] = useState('');
  const [generatedUri, setGeneratedUri] = useState<string | null>(null);
  const [voiceCloneId, setVoiceCloneId] = useState<string | null>(null);
  const [messageEditorVisible, setMessageEditorVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [videoAspect, setVideoAspect] = useState<number | null>(null);
  const [authData, setAuthData] = useState<AuthData | null>(null);
  const formLayoutStyle =
    isWeb && !isMobileWeb ? styles.formRowWide : styles.formRowStacked;
  const generatedVideoAspectStyle = { aspectRatio: videoAspect ?? 16 / 9 };

  useEffect(() => {
    const loadAuth = async () => {
      try {
        const data = await getAuthData();
        setAuthData(data);
      } catch (e) {
        logger.error('Failed to load auth data', e);
      }
    };

    loadAuth();
  }, []);

  useEffect(() => {
    if (messageEditorVisible) {
      setTimeout(() => {
        messageInputRef.current?.focus();
      }, 300);
    }
  }, [messageEditorVisible]);

  const setupSignalR = async () => {
    const { accessToken, userId } = await getAuthData();

    try {
      await startConnection(accessToken);
      await joinGroups(userId);

      onEvent(
        'ReceiveVideoUpdate',
        (
          recipientId: string,
          status: string,
          customizedVideoLink: string,
          voiceCloneId: string
        ) => {
          if (status === 'Completed' && customizedVideoLink) {
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
      showToast(extractErrorMessage(error, 'Failed to generate sample video'), 'error');
      setLoading(false);
    }
  };

  const handleGenerateSampleVideo = async () => {
    if (!name.trim()) {
      showToast('Failed to generate sample video', 'error');
      return;
    }
    setLoading(true);
    setupSignalR();
  };

  const normalizePastedText = (txt: string) => {
    let normalized = txt.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    normalized = normalized.replace(/^\s+/, '').replace(/\s+$/, '');
    return normalized;
  };

  const handleSubmit = () => {
    const errors: FormData['errors'] = {};
    if (!formData.campaign.trim())
      errors.campaign = t('fieldRequired', { field: t('campaign') });
    if (!formData.file) errors.file = 'Please upload a base video';

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
      const asset = Asset.fromModule(sampleVideoAsset);
      await asset.downloadAsync();
      const fileUri = asset.localUri || asset.uri;

      if (Platform.OS === 'web') {
        const link = document.createElement('a');
        link.href = fileUri;
        link.download = 'sample-video.mp4';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        const dest = `${FileSystem.cacheDirectory}sample-video.mp4`;
        await FileSystem.copyAsync({ from: fileUri, to: dest });
        await Sharing.shareAsync(dest);
      }
    } catch (error) {
      logger.error('Error downloading video:', error);
    }
  };

  return (
    <View style={styles.root}>
      <KeyboardAwareScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scrollContent}
        enableOnAndroid
        extraScrollHeight={Platform.OS === 'ios' ? 120 : 140}
        keyboardShouldPersistTaps="handled"
      >
        <View style={formLayoutStyle}>
          {/* Campaign */}
          <View style={styles.fieldColumn}>
            <FixedLabel label={t('campaign')} required />
            <TextInput
              ref={campaignInputRef}
              placeholder={t('placeholder.enterCampaign')}
              placeholderTextColor={theme.colors.placeholder}
              value={formData.campaign}
              onChangeText={(text) =>
                setFormData((prev) => ({
                  ...prev,
                  campaign: text,
                  errors: { ...prev.errors, campaign: undefined }
                }))
              }
              mode="outlined"
              style={styles.input}
              error={!!formData.errors.campaign}
            />
            <HelperText
              type="error"
              visible={!!formData.errors.campaign}
              style={styles.helperText}
            >
              {formData.errors.campaign}
            </HelperText>
          </View>

          {/* Message */}
          <View style={styles.fieldColumn}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setMessageEditorVisible(true)}
            >
              <FixedLabel label={t('campaignMessage')} required />
              <TextInput
                placeholder={t('placeholder.enterCampaignMessage')}
                placeholderTextColor={theme.colors.placeholder}
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
                style={styles.helperText}
              >
                {formData.errors.message}
              </HelperText>
            </TouchableOpacity>
          </View>

          {/* Cloning Speed */}
          <View style={styles.fieldColumn}>
            <FixedLabel label={t('cloningSpeed')} required />
            <TextInput
              placeholder={t('placeholder.cloningSpeedPlaceholder')}
              placeholderTextColor={theme.colors.placeholder}
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
                  errors: { ...prev.errors, cloningSpeed: undefined }
                }));
              }}
              style={styles.input}
              contentStyle={styles.centeredInputContent}
              editable={false}
              right={
                <TextInput.Affix
                  text="＋"
                  onPress={() =>
                    setFormData((prev) => ({
                      ...prev,
                      cloningSpeed: Math.min(1.2, +(prev.cloningSpeed + 0.1).toFixed(1))
                    }))
                  }
                  textStyle={styles.affixText}
                />
              }
              left={
                <TextInput.Affix
                  text="－"
                  onPress={() =>
                    setFormData((prev) => ({
                      ...prev,
                      cloningSpeed: Math.max(0.8, +(prev.cloningSpeed - 0.1).toFixed(1))
                    }))
                  }
                  textStyle={styles.affixText}
                />
              }
            />

            <HelperText
              type="error"
              visible={!!formData.errors.cloningSpeed}
              style={styles.helperText}
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
            style={styles.downloadSampleButton}
          >
            {t('video.downloadSample')}
          </Button>
        </View>

        {/* Upload Base Video */}
        <CommonUpload
          label={t('uploadBaseVideoTabLabel')}
          fileType="video"
          onUpload={(file) =>
            setFormData((prev) => ({
              ...prev,
              file,
              errors: { ...prev.errors, file: undefined }
            }))
          }
        />
        {formData.errors.file && (
          <HelperText type="error" visible>
            {formData.errors.file}
          </HelperText>
        )}

        {/* Optional Generate Section */}
        {formData.file && (
          <>
            <Divider style={styles.sectionDivider} />

            <List.Accordion
              title={t('video.generateSampleVideo')}
              expanded={expanded}
              onPress={() => setExpanded(!expanded)}
              titleStyle={styles.accordionTitle}
            >
              <View style={styles.generatedSection}>
                <FixedLabel label={t('name')} />
                <TextInput
                  placeholder={t('placeholder.enterName')}
                  placeholderTextColor={theme.colors.placeholder}
                  value={name}
                  onChangeText={setName}
                  mode="outlined"
                  style={styles.input}
                />
                <View style={styles.generateActionRow}>
                  <Button
                    mode="contained"
                    onPress={handleGenerateSampleVideo}
                    loading={loading}
                    disabled={loading}
                    style={styles.generateButton}
                  >
                    {loading ? t('video.generatingVideo') : t('video.generateAndPreview')}
                  </Button>
                </View>

                {generatedUri && (
                  <View style={styles.previewSection}>
                    <Text variant="titleMedium" style={styles.previewTitle}>
                      Preview:
                    </Text>

                    <ExpoVideo
                      source={{ uri: generatedUri }}
                      useNativeControls
                      resizeMode={ResizeMode.CONTAIN}
                      shouldPlay={false}
                      onLoad={(status) => {
                        if (!status.isLoaded) return;

                        const { naturalSize } = status as AVPlaybackStatusSuccess & {
                          naturalSize: {
                            width: number;
                            height: number;
                            orientation?: 'portrait' | 'landscape';
                          };
                        };

                        if (naturalSize?.width && naturalSize?.height) {
                          setVideoAspect(naturalSize.height / naturalSize.width);
                        }
                      }}
                      style={[styles.generatedVideo, generatedVideoAspectStyle]}
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
              <Text style={styles.messageTitle}>{t('campaignMessage')}</Text>

              <IconButton
                icon="close"
                size={20}
                onPress={() => setMessageEditorVisible(false)}
                style={styles.closeIcon}
              />
            </View>

            {/* Input */}
            <TextInput
              ref={messageInputRef}
              autoFocus
              value={formData.message}
              onChangeText={(text) =>
                setFormData((prev) => ({
                  ...prev,
                  message: text,
                  errors: { ...prev.errors, message: undefined }
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
                {t('cancel')}
              </Button>

              <Button
                mode="contained"
                onPress={() => setMessageEditorVisible(false)}
                style={styles.primaryButton}
                buttonColor={colors.primary}
                textColor={colors.white}
              >
                {t('save')}
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
          {t('cancel')}
        </Button>
        <Button
          mode="contained"
          icon="upload"
          onPress={handleSubmit}
          disabled={
            !formData.file ||
            uploading ||
            ((authData.isProfessionalVoiceCloning === true ||
              authData.isProfessionalVoiceCloning === 'true') &&
              !voiceCloneId)
          }
          loading={uploading}
          style={styles.actionButton}
        >
          {t('uploadBaseVideoTabLabel')}
        </Button>
      </View>
    </View>
  );
}

const createStyles = (
  theme: AppTheme,
  platform: { isWeb: boolean; isMobileWeb: boolean }
) =>
  StyleSheet.create({
    root: {
      flex: 1
    },
    scrollContent: {
      padding: 16,
      paddingBottom: 100
    },
    formRowWide: {
      display: 'flex',
      flexDirection: 'row',
      gap: 12
    },
    formRowStacked: {
      display: 'flex',
      flexDirection: 'column',
      gap: 0
    },
    fieldColumn: {
      flex: 1
    },
    input: {
      marginBottom: 0,
      backgroundColor: theme.colors.white,
      height: 44
    },
    helperText: {
      paddingLeft: 0
    },
    centeredInputContent: {
      textAlign: 'center'
    },
    affixText: {
      fontSize: 22
    },
    footer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      padding: 16,
      backgroundColor: theme.colors.white,
      borderTopWidth: 1,
      borderTopColor: theme.colors.lightGray,
      flexDirection: 'row',
      gap: 12
    },
    actionButton: {
      flex: 1,
      borderRadius: 6
    },
    downloadButton: {
      display: 'flex',
      alignItems: 'flex-end',
      marginTop: 12
    },
    downloadSampleButton: {
      borderRadius: 8,
      borderColor: theme.colors.greenAccent
    },
    sectionDivider: {
      marginVertical: 20
    },
    accordionTitle: {
      fontWeight: 'bold',
      color: theme.colors.primary
    },
    generatedSection: {
      marginTop: 16
    },
    generateActionRow: {
      width: '100%',
      alignItems: 'flex-end'
    },
    generateButton: {
      marginTop: 8,
      borderRadius: 5
    },
    previewSection: {
      marginTop: 16
    },
    previewTitle: {
      marginBottom: 8,
      color: theme.colors.primary
    },
    generatedVideo: {
      width: '100%',
      height: '150%',
      borderRadius: 8,
      marginTop: 12,
      alignSelf: 'center'
    },
    messageModalCard: {
      width: '92%',
      maxWidth: 520,
      maxHeight: '75%',
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
      overflow: 'hidden'
    },
    messageHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 10
    },
    dialogContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 24
    },
    messageTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.colors.primary
    },
    closeIcon: {
      margin: 0
    },
    messageSubtitle: {
      fontSize: 13,
      color: theme.colors.textSecondary,
      marginBottom: 14
    },
    messageInput: {
      minHeight: 180,
      maxHeight: 260,
      backgroundColor: theme.colors.paperBackground,
      fontSize: 15,
      paddingTop: platform.isWeb ? 0 : 8
    },
    modalActions: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 16,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: theme.colors.lightGray,
      backgroundColor: theme.colors.white
    },
    secondaryButton: {
      flex: 1,
      borderRadius: 10,
      borderColor: theme.colors.borderGray
    },
    primaryButton: {
      flex: 1,
      borderRadius: 10
    }
  });
