import React, { useEffect, useRef, useState } from 'react';
import {
  AppState,
  Linking,
  NativeModules,
  PermissionsAndroid,
  Platform,
  ScrollView,
  StyleSheet,
  View
} from 'react-native';
import Contacts, { Contact } from 'react-native-contacts';
import RNFS from 'react-native-fs';
import {
  ActivityIndicator,
  Avatar,
  Button,
  IconButton,
  Text,
  TextInput,
  useTheme
} from 'react-native-paper';
import Share, { ShareSingleOptions } from 'react-native-share';
import ViewShot from 'react-native-view-shot';

import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { generateVoterSlip, getVoterSlip } from '../api/candidateApi';
import { updateMobileNumber, updateStarVoter, verifyVoter } from '../api/voterApi';
import FamilyMembersCard from '../components/FamilyMembersCard';
import Tabs from '../components/Tabs';
import { usePlatformInfo } from '../hooks/usePlatformInfo';
import { AppTheme } from '../theme';
import { Voter } from '../types/Voter';
import { requestBluetoothPermissions } from '../utils/bluetoothPermissions';
import { extractErrorMessage } from '../utils/common';
import { logger } from '../utils/logger';
import { getSavedPrinterMac, removePrinterMac, savePrinterMac } from '../utils/storage';
import EnableBluetoothDialog from './EnableBluetoothDialog';
import PrinterPicker from './PrinterPicker';
import SlipPreview from './SlipPreview';
import SurveyTab from './SurveyTab';
import { useToast } from './ToastProvider';

type SlipPreviewData = {
  candidate: {
    candidateName: string;
    candidatePhotoPath?: string;
    partyName: string;
    symbolName?: string;
    symbolImagePath?: string;
  };
  voter: {
    voterName: string;
    prabagNumber: number | string;
    rank: number | string;
    epicId: string;
    assemblyNumber: string;
    pollingBooth: string;
    pollingBoothAddress: string;
    electionDate: string;
  };
  slipText?: string;
  imageUrl?: string;
  candidatePhotoPath?: string;
};

type ExtendedShareOptions = ShareSingleOptions & {
  whatsAppNumber?: string;
};

type Props = {
  voter: Voter;
  onBack: () => void;
  onOpenVoter: (id: string) => void;
};

type TabKey = 'details' | 'family' | 'survey';
const { ThermalPrinter } = NativeModules;

export default function VoterDetailView({ voter, onBack, onOpenVoter }: Props) {
  const { t } = useTranslation();
  const { isWeb, isMobileWeb } = usePlatformInfo();
  const theme = useTheme<AppTheme>();
  const { showToast } = useToast();
  const styles = createStyles(theme);

  const [tab, setTab] = useState<TabKey>('details');
  const [mobile, setMobile] = useState(voter.mobileNumber ?? '');
  const [isVerified, setIsVerified] = useState(voter.isVerified);
  const [isStarVoter, setIsStarVoter] = useState(voter.isStarVoter);
  const [printing, setPrinting] = useState(false);
  const [, setTempContact] = useState<Contact | null>(null);
  const [showPrinterPicker, setShowPrinterPicker] = useState(false);
  const [bluetoothDialogVisible, setBluetoothDialogVisible] = useState(false);
  const [slipData, setSlipData] = useState<SlipPreviewData | null>(null);
  const [slipSending, setSlipSending] = useState(false);
  const viewShotRef = useRef<ViewShot>(null);

  const tabs = [
    { key: 'details', label: t('voter.tabDetails') },
    { key: 'family', label: t('voter.tabFamily') },
    { key: 'survey', label: t('voter.tabSurvey') }
  ];

  useEffect(() => {
    clearCacheFiles();
    clearAllTempContacts();
  });

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        setSlipSending(false);
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  /* ================= EXISTING HANDLERS ================= */
  const convertSlipTextToImage = async () => {
    if (!viewShotRef.current) {
      logger.log('❌ ViewShot ref missing');
      throw new Error('Slip preview not ready');
    }

    await new Promise((res) => setTimeout(res, 1000));

    const base64 = await viewShotRef.current.capture?.();

    logger.log('Captured length:', base64?.length);

    if (!base64 || base64.length < 500) {
      throw new Error('Slip image capture failed');
    }

    return base64;
  };

  const handleMobileNumberUpdate = async (number: string) => {
    try {
      await updateMobileNumber(voter.id, number);
      setMobile(number);
      showToast(t('voter.mobileUpdateSuccess'), 'success');
    } catch (error) {
      setMobile('');
      showToast(extractErrorMessage(error), 'error');
    }
  };

  const handleVerifyVoter = async () => {
    try {
      await verifyVoter(voter.id, !isVerified);
      setIsVerified(!isVerified);
      showToast(
        !isVerified ? t('voter.voterVerifiedSuccess') : t('voter.voterUnverifiedSuccess'),
        'success'
      );
    } catch (error) {
      showToast(extractErrorMessage(error), 'error');
    }
  };

  const handleStarVoter = async () => {
    try {
      await updateStarVoter(voter.id, !isStarVoter);
      setIsStarVoter(!isStarVoter);
      showToast(
        !isStarVoter ? t('voter.voterStarredSuccess') : t('voter.voterUnstarredSuccess'),
        'success'
      );
    } catch (error) {
      showToast(extractErrorMessage(error), 'error');
    }
  };

  const ensurePrinterConnected = async () => {
    const mac = await getSavedPrinterMac();

    if (!mac) {
      setShowPrinterPicker(true);
      return false;
    }

    try {
      await ThermalPrinter.disconnect().catch(() => {});
      await new Promise((r) => setTimeout(r, 300));

      await ThermalPrinter.connect(mac);

      await new Promise((r) => setTimeout(r, 500));

      return true;
    } catch (error) {
      await removePrinterMac();
      setShowPrinterPicker(true);
      void error;
      return false;
    }
  };

  const saveBase64ToFile = async (base64: string) => {
    const fileName = `voter-slip-${Date.now()}.png`;
    const path = `${RNFS.CachesDirectoryPath}/${fileName}`;

    const cleanBase64 = base64.replace(/^data:image\/png;base64,/, '');
    await RNFS.writeFile(path, cleanBase64, 'base64');

    const exists = await RNFS.exists(path);
    logger.log('FILE EXISTS:', exists, path);

    if (!exists) throw new Error('File write failed');

    return path;
  };

  const handlePrintVoterSlip = async () => {
    if (printing) return;

    const hasPermission = await requestBluetoothPermissions();
    if (!hasPermission) {
      showToast('Bluetooth permission denied', 'error');
      return;
    }

    const isEnabled = await ThermalPrinter.isBluetoothEnabled();
    if (!isEnabled) {
      setBluetoothDialogVisible(true);
      return;
    }

    startPrintingFlow();
  };

  const startPrintingFlow = async () => {
    setPrinting(true);
    try {
      const connected = await ensurePrinterConnected();
      if (!connected) {
        setPrinting(false);
        return;
      }

      await new Promise((r) => setTimeout(r, 500));

      const response = await generateVoterSlip(voter.id);
      setSlipData(response.data);

      await new Promise((r) => setTimeout(r, 300));

      // await ThermalPrinter.printVoterSlip(response.data);

      const imageBase64 = await convertSlipTextToImage();
      // setImageBase64(imageBase64);

      // await ThermalPrinter.printBase64(imageBase64);

      const imagePath = await saveBase64ToFile(imageBase64);
      await ThermalPrinter.printImage(imagePath);
      await new Promise((r) => setTimeout(r, 300));

      showToast(t('candidate.voterPrintSuccess'), 'success');
    } catch (error) {
      showToast(extractErrorMessage(error), 'error');
    } finally {
      setTimeout(() => setPrinting(false), 800);
    }
  };

  const clearAllTempContacts = async () => {
    if (Platform.OS !== 'android') return;

    try {
      const contacts = await Contacts.getAll();
      const tempContacts = contacts.filter((c) => {
        const fieldsToCheck = [c.displayName, c.givenName, c.familyName, c.middleName];

        return fieldsToCheck.some((field) => field?.includes('_AbhiyanAI_'));
      });

      for (const contact of tempContacts) {
        try {
          await Contacts.deleteContact(contact);
          logger.log('Deleted all temp contact:', contact.givenName);
        } catch (err) {
          logger.warn('Failed to delete all temp contact', contact.givenName, err);
        }
      }
    } catch (err) {
      logger.error('Error clearing all temp contacts', err);
    }
  };

  const requestAndroidPermissions = async () => {
    if (Platform.OS !== 'android') return true;

    try {
      if (Platform.Version >= 33) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } else {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          PermissionsAndroid.PERMISSIONS.WRITE_CONTACTS
        ]);
        return (
          granted['android.permission.READ_EXTERNAL_STORAGE'] ===
            PermissionsAndroid.RESULTS.GRANTED &&
          granted['android.permission.WRITE_EXTERNAL_STORAGE'] ===
            PermissionsAndroid.RESULTS.GRANTED &&
          granted['android.permission.WRITE_CONTACTS'] ===
            PermissionsAndroid.RESULTS.GRANTED
        );
      }
    } catch (err) {
      logger.warn('Permissions request error', err);
      return false;
    }
  };

  const getFileExtensionFromUrl = (url: string): string => {
    if (!url) return 'jpg';

    const cleanUrl = url.split('?')[0].split('#')[0];

    const lastDotIndex = cleanUrl.lastIndexOf('.');
    if (lastDotIndex === -1) return 'jpg';

    return cleanUrl.substring(lastDotIndex + 1).toLowerCase();
  };

  const getImageMimeType = (extension: string): string => {
    switch (extension.toLowerCase()) {
      case 'png':
        return 'image/png';
      case 'webp':
        return 'image/webp';
      case 'gif':
        return 'image/gif';
      case 'bmp':
        return 'image/bmp';
      case 'svg':
        return 'image/svg+xml';
      case 'jpg':
      case 'jpeg':
      default:
        return 'image/jpeg';
    }
  };

  const downloadImage = async (url: string, extension: string = 'jpg') => {
    const localPath = `${RNFS.CachesDirectoryPath}/image_${Date.now()}.${extension}`;

    const download = RNFS.downloadFile({
      fromUrl: url,
      toFile: localPath,
      progressDivider: 1
    });

    const result = await download.promise;

    if (result.statusCode === 200) {
      return `file://${localPath}`;
    } else {
      throw new Error('Image download failed');
    }
  };

  const handleSendVoter = async () => {
    if (!mobile || mobile.length < 10) {
      showToast(t('voter.mobileInvalid'), 'error');
      return;
    }
    setSlipSending(true);
    let isWhatsAppAvailable: boolean;
    const response = await getVoterSlip(voter.id);
    logger.log('Response', response.data);

    if (Platform.OS === 'android') {
      try {
        const granted = await requestAndroidPermissions();
        if (!granted) {
          showToast('Storage & Contacts permissions are required', 'error');
          return;
        }

        const personal = await Share.isPackageInstalled('com.whatsapp');
        const business = await Share.isPackageInstalled('com.whatsapp.w4b');
        isWhatsAppAvailable = personal?.isInstalled || business?.isInstalled;
      } catch {
        isWhatsAppAvailable = false;
      }
    } else {
      try {
        isWhatsAppAvailable = await Linking.canOpenURL('whatsapp://send');
      } catch {
        isWhatsAppAvailable = false;
      }
    }

    if (!isWhatsAppAvailable) {
      showToast(t('whatsapp.notInstalled'), 'error');
      return;
    }

    // --- Share image flow ---
    try {
      let contactExists = false;

      if (Platform.OS === 'android') {
        const phoneNumber = mobile.replace(/\D/g, '');

        // Check if contact already exists
        const allContacts = await Contacts.getAll();
        const existing = allContacts.find((c) =>
          c.phoneNumbers?.some(
            (p) =>
              p.number.replace(/\D/g, '').endsWith(phoneNumber) ||
              phoneNumber.endsWith(p.number.replace(/\D/g, ''))
          )
        );

        if (existing) {
          logger.log('Contact already exists:', existing.displayName);
          contactExists = true;
        } else {
          const tempContact = {
            givenName: `${voter.fullName}_AbhiyanAI_${mobile}`,
            phoneNumbers: [{ label: 'mobile', number: `+91 ${mobile}` }],
            accountType: null,
            accountName: null
          };
          const savedContact = await Contacts.addContact(tempContact);
          setTempContact(savedContact);
          logger.log('Saved new temp contact:', savedContact);
          contactExists = true;
        }
      }

      // Download image before sharing
      const localPath = await downloadImage(
        response?.data?.candidatePhotoPath,
        getFileExtensionFromUrl(response?.data?.candidatePhotoPath)
      );

      // Only proceed if contact exists
      if (contactExists) {
        await new Promise((r) => setTimeout(r, 1500));

        if (Platform.OS === 'android') {
          await Share.shareSingle({
            title: 'Image',
            url: localPath,
            type: getImageMimeType(
              getFileExtensionFromUrl(response?.data?.candidatePhotoPath)
            ),
            social: Share.Social.WHATSAPP,
            whatsAppNumber: `91${mobile}`,
            message: response.data.slipText
          } as ExtendedShareOptions);
        } else {
          await Share.shareSingle({
            title: 'Image',
            url: Platform.OS === 'ios' ? localPath : 'file://' + localPath,
            type: getImageMimeType(getFileExtensionFromUrl(response?.data?.imageUrl)),
            social: Share.Social.WHATSAPP,
            whatsAppNumber: `91${mobile}`,
            message: response.data.slipText
          } as ExtendedShareOptions);
        }
      } else {
        logger.log('Contact not found. Please check the number.', 'error');
      }
    } catch (err) {
      logger.error('Error sending image:', err);
      showToast(t('image.sendFail'), 'error');
    }
  };

  const clearCacheFiles = async () => {
    if ((isWeb && !isMobileWeb) || !RNFS) return;

    try {
      const files = await RNFS.readDir(RNFS.CachesDirectoryPath);
      for (const file of files) {
        try {
          const exists = await RNFS.exists(file.path);
          if (exists) {
            await RNFS.unlink(file.path);
          }
        } catch (err) {
          logger.log('Skip delete:', file.path);
          void err;
        }
      }
    } catch (error) {
      logger.log('Cache cleanup skipped');
      void error;
    }
  };

  const handleEnableBluetooth = async () => {
    try {
      await ThermalPrinter.enableBluetooth();
    } catch (error) {
      showToast('Unable to enable Bluetooth', 'error');
      void error;
      return;
    }

    setBluetoothDialogVisible(false);

    setTimeout(async () => {
      const isEnabled = await ThermalPrinter.isBluetoothEnabled();

      if (!isEnabled) {
        showToast('Please enable Bluetooth manually', 'error');
        return;
      }

      startPrintingFlow();
    }, 1200);
  };

  const getGenderDisplay = (gender?: string) => {
    if (!gender || gender.trim() === '') return '-';

    const key = `voter.gender${gender}`;
    const translated = t(key);

    return translated === key ? gender : translated;
  };

  /* ================= UI ================= */

  return (
    <>
      <ScrollView contentContainerStyle={styles.container}>
        {/* ================= TOP BAR ================= */}
        <View style={styles.topBar}>
          <View style={styles.topBarLeft}>
            <IconButton
              icon="arrow-left"
              iconColor={theme.colors.primary}
              onPress={onBack}
            />

            <View style={styles.identityStrip}>
              <Avatar.Text
                size={40}
                label={voter.fullName?.[0] ?? 'V'}
                style={styles.avatar}
              />
              <Text style={styles.topName}>{voter.fullName}</Text>
            </View>
          </View>
        </View>

        {/* ================= TABS ================= */}
        <View style={styles.tabsHeader}>
          <View style={styles.tabsLeft}>
            <Tabs value={tab} onChange={(v) => setTab(v as TabKey)} tabs={tabs} />
          </View>
        </View>

        {(!isWeb || isMobileWeb) && (
          <View style={styles.actionPanel}>
            {/* STAR */}
            <IconButton
              icon={isStarVoter ? 'star' : 'star-outline'}
              size={22}
              iconColor={isStarVoter ? theme.colors.primary : theme.colors.textSecondary}
              onPress={handleStarVoter}
              style={styles.panelIcon}
            />

            {/* VERIFY */}
            <IconButton
              icon={isVerified ? 'check-decagram' : 'check-decagram-outline'}
              size={22}
              iconColor={
                isVerified ? theme.colors.successText : theme.colors.textSecondary
              }
              onPress={handleVerifyVoter}
              style={styles.panelIcon}
            />

            {/* WHATSAPP */}
            {slipSending ? (
              <ActivityIndicator size={22} color={theme.colors.primary} />
            ) : (
              <IconButton
                icon={() => (
                  <FontAwesome
                    name="whatsapp"
                    size={22}
                    color={theme.colors.whatsappGreen}
                  />
                )}
                onPress={handleSendVoter}
                style={styles.panelIcon}
              />
            )}

            {/* PRINT */}
            {printing ? (
              <ActivityIndicator size={22} color={theme.colors.primary} />
            ) : (
              <IconButton
                icon="printer"
                size={22}
                iconColor={theme.colors.primary}
                onPress={handlePrintVoterSlip}
                style={styles.panelIcon}
              />
            )}
          </View>
        )}

        {/* ================= DETAILS TAB ================= */}
        {tab === 'details' && (
          <View style={styles.contentWrapper}>
            <View style={[styles.row, (!isWeb || isMobileWeb) && styles.rowStacked]}>
              <View style={styles.col}>
                <View style={styles.card}>
                  <Text style={styles.sectionTitle}>{t('voter.personalDetails')}</Text>

                  <InfoRow label={t('voter.labelName')} value={voter.fullName} />
                  <InfoRow
                    label={t('voter.labelFatherHusband')}
                    value={voter.fatherHusbandName}
                  />
                  <InfoRow
                    label={t('voter.labelGender')}
                    value={getGenderDisplay(voter.gender)}
                  />
                  <InfoRow label={t('voter.labelAge')} value={`${voter.age}`} />

                  <EditableInfoRow
                    label={t('voter.labelMobile')}
                    value={mobile || ''}
                    keyboardType="phone-pad"
                    onSave={handleMobileNumberUpdate}
                  />
                </View>
              </View>

              <View style={styles.col}>
                <View style={styles.card}>
                  <Text style={styles.sectionTitle}>{t('voter.identity')}</Text>

                  <InfoRow label={t('voter.labelEpicId')} value={voter.epicId} />
                  <InfoRow
                    label={t('voter.labelPrabagNo')}
                    value={`${voter.prabagNumber}`}
                  />
                  <InfoRow label={t('voter.labelRank')} value={`${voter.rank}`} />

                  <View style={styles.spacerSmall} />

                  <Text style={styles.sectionTitle}>{t('voter.votingDetails')}</Text>

                  <InfoRow
                    label={t('voter.labelVotingCenter')}
                    value={`${voter.votingRoomNumber ?? '-'}`}
                  />
                  <InfoRow
                    label={t('voter.labelBoothAddress')}
                    value={voter.votingBoothAddress ?? '-'}
                  />
                  <InfoRow
                    label={t('voter.labelVotingDateTime')}
                    value={`${voter.votingDateAndTime ?? '-'}`}
                  />
                </View>
              </View>
            </View>

            <View style={[styles.row, (!isWeb || isMobileWeb) && styles.rowStacked]}>
              <View style={styles.col}>
                <View style={styles.card}>
                  <Text style={styles.sectionTitle}>{t('voter.addressSection')}</Text>

                  <InfoRow label={t('voter.labelHouseNo')} value={voter.houseNumber} />
                  <InfoRow label={t('voter.labelAddress')} value={voter.address} />
                  <InfoRow label={t('voter.labelListArea')} value={`${voter.listArea}`} />
                </View>
              </View>

              {isWeb && (
                <View style={styles.col}>
                  <View style={styles.card}>
                    <Text style={styles.sectionTitle}>{t('voter.statusSection')}</Text>

                    <View
                      style={[rowStyles.row, { borderBottomColor: theme.colors.divider }]}
                    >
                      <Text
                        style={[rowStyles.label, { color: theme.colors.textSecondary }]}
                      >
                        {t('voter.starVoter')}
                      </Text>

                      <Ionicons
                        name={isStarVoter ? 'star' : 'star-outline'}
                        size={22}
                        color={
                          isStarVoter ? theme.colors.primary : theme.colors.textSecondary
                        }
                        onPress={handleStarVoter}
                      />
                    </View>

                    <View style={styles.verifyRow}>
                      <Text
                        style={[
                          styles.statusText,
                          {
                            color: isVerified
                              ? theme.colors.successText
                              : theme.colors.errorText
                          }
                        ]}
                      >
                        {isVerified ? t('voter.verified') : t('voter.notVerified')}
                      </Text>

                      <Button
                        mode={isVerified ? 'outlined' : 'contained'}
                        compact
                        onPress={handleVerifyVoter}
                        style={styles.button}
                      >
                        {isVerified ? t('voter.unverify') : t('voter.verify')}
                      </Button>
                    </View>
                  </View>
                </View>
              )}
            </View>
          </View>
        )}
        {tab === 'family' && (
          <FamilyMembersCard voter={voter} onSelectMember={onOpenVoter} />
        )}
        {tab === 'survey' && <SurveyTab voterId={voter.id} />}
      </ScrollView>

      <View style={styles.hiddenSlip}>
        {slipData && <SlipPreview ref={viewShotRef} {...slipData} />}
      </View>

      <PrinterPicker
        visible={showPrinterPicker}
        onClose={() => setShowPrinterPicker(false)}
        onSelect={async (device) => {
          try {
            await ThermalPrinter.connect(device.mac);
            await new Promise((r) => setTimeout(r, 2000));

            await savePrinterMac(device.mac);
            showToast('Printer connected', 'success');
            setShowPrinterPicker(false);
          } catch (e) {
            await removePrinterMac();
            throw e;
          }
        }}
      />

      <EnableBluetoothDialog
        visible={bluetoothDialogVisible}
        onCancel={() => setBluetoothDialogVisible(false)}
        onEnable={handleEnableBluetooth}
      />
    </>
  );
}

/* ================= ROW COMPONENTS (UNCHANGED) ================= */

function InfoRow({ label, value }: { label: string; value: string }) {
  const theme = useTheme<AppTheme>();
  const { isWeb, isMobileWeb } = usePlatformInfo();
  const isLongText = (value?.length ?? 0) > (isWeb && !isMobileWeb ? 70 : 35);

  return (
    <View
      style={[
        rowStyles.row,
        { borderBottomColor: theme.colors.divider },
        isLongText ? rowStyles.rowLong : rowStyles.rowShort
      ]}
    >
      <Text
        style={[
          rowStyles.label,
          { color: theme.colors.textSecondary },
          isLongText && rowStyles.labelFullWidth
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>

      <Text
        style={[
          rowStyles.value,
          { color: theme.colors.textPrimary },
          isLongText ? rowStyles.valueTextLong : rowStyles.valueTextShort
        ]}
      >
        {value?.trim() || '-'}
      </Text>
    </View>
  );
}

function EditableInfoRow({
  label,
  value,
  keyboardType,
  onSave
}: {
  label: string;
  value?: string | null;
  keyboardType?: 'default' | 'numeric' | 'phone-pad';
  onSave: (value: string) => Promise<void> | void;
}) {
  const { t } = useTranslation();
  const theme = useTheme<AppTheme>();
  const { isWeb, isMobileWeb } = usePlatformInfo();
  const { showToast } = useToast();
  const [editing, setEditing] = useState(false);
  const [local, setLocal] = useState(value);

  useEffect(() => {
    setLocal(value);
  }, [value]);

  return (
    <View
      style={[
        rowStyles.row,
        { borderBottomColor: theme.colors.divider },
        editing && (!isWeb || isMobileWeb) && rowStyles.editingMobileRow
      ]}
    >
      <Text style={[rowStyles.label, { color: theme.colors.textSecondary }]}>
        {label}
      </Text>

      {!editing && (
        <View style={rowStyles.valueRow}>
          <Text style={[rowStyles.value, { color: theme.colors.textPrimary }]}>
            {value === '' ? '-' : value}
          </Text>
          <Ionicons
            name="pencil"
            size={18}
            color={theme.colors.primary}
            onPress={() => setEditing(true)}
          />
        </View>
      )}

      {editing && (
        <View style={rowStyles.editingRow}>
          <TextInput
            mode="outlined"
            value={local}
            keyboardType={keyboardType}
            onChangeText={(text) => {
              const digitsOnly = text.replace(/\D/g, '');
              const prevLength = local?.length ?? 0;

              if (digitsOnly.length > prevLength + 1) {
                setLocal(digitsOnly.slice(-10));
              } else if (digitsOnly.length <= 10) {
                setLocal(digitsOnly);
              }
            }}
            outlineColor={
              local !== '' && !/^\d{10}$/.test(local)
                ? theme.colors.error
                : theme.colors.white
            }
            style={[rowStyles.editInput, { backgroundColor: theme.colors.white }]}
          />
          <View style={rowStyles.editActions}>
            <IconButton
              icon="check"
              size={18}
              onPress={() => {
                if (local !== '' && !/^\d{10}$/.test(local)) {
                  showToast(t('voter.mobileInvalid'), 'error');
                  return;
                }

                onSave?.(local);
                setEditing(false);
              }}
            />
            <IconButton
              icon="close"
              size={18}
              onPress={() => {
                setLocal(value);
                setEditing(false);
              }}
            />
          </View>
        </View>
      )}
    </View>
  );
}

/* ================= STYLES ================= */

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      padding: 16,
      backgroundColor: theme.colors.white,
      flexGrow: 1
    },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      marginBottom: 12
    },
    topBarLeft: {
      flexDirection: 'row',
      alignItems: 'center'
    },
    avatar: {
      backgroundColor: theme.colors.primaryLight
    },
    tabsHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start'
    },
    tabsLeft: {
      flex: 1,
      paddingRight: 6
    },
    actionIcons: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: -10
    },
    iconBtn: {
      margin: 0,
      padding: 0
    },
    identityStrip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12
    },
    topName: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.colors.textPrimary
    },
    contentWrapper: { gap: 16 },
    row: { flexDirection: 'row', gap: 16 },
    rowStacked: { flexDirection: 'column' },
    col: { flex: 1 },
    card: {
      height: '100%',
      padding: 16,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.subtleBorder,
      backgroundColor: theme.colors.paperBackground,
      gap: 12
    },
    sectionTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.colors.textTertiary,
      letterSpacing: 0.8
    },
    spacerSmall: {
      height: 12
    },
    verifyRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 8
    },
    statusText: { fontSize: 15, fontWeight: '600' },
    button: { borderRadius: 10 },
    fabPrint: {
      position: 'absolute',
      top: -5,
      right: 0,
      backgroundColor: theme.colors.primary,
      elevation: 6,
      borderRadius: 28
    },
    fabLoader: {
      position: 'absolute',
      top: 2,
      right: 10
    },
    actionPanel: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
      paddingVertical: 6,
      marginBottom: 10,
      borderRadius: 14,
      backgroundColor: theme.colors.paperBackground,
      borderWidth: 1,
      borderColor: theme.colors.subtleBorder
    },
    panelIcon: {
      margin: 0
    },
    hiddenSlip: {
      position: 'absolute',
      left: -1000,
      top: -1000,
      opacity: 0
    }
  });

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1
  },
  label: {
    fontSize: 14,
    flex: 1
  },
  labelFullWidth: {
    width: '100%'
  },
  value: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'right'
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  editingMobileRow: {
    flexDirection: 'column',
    alignItems: 'stretch'
  },
  editingRow: {
    marginTop: 6,
    flexDirection: 'row',
    gap: 6
  },
  editInput: {
    flex: 1,
    height: 44
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end'
  },
  valueTextLong: {
    textAlign: 'left',
    width: '100%'
  },
  valueTextShort: {
    textAlign: 'right',
    width: 'auto'
  },
  rowLong: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 4
  },
  rowShort: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  }
});
