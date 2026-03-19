import React, { useCallback, useEffect, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { IconButton, ProgressBar, Surface, Text, useTheme } from 'react-native-paper';

import { useFocusEffect } from '@react-navigation/native';

import { FontAwesome, Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';

import { getCampaigns } from '../api/imageApi';
import { getRecipientsByCampaignId } from '../api/recipientApi';
import { sendImage } from '../api/whatsappApi';
import CommonTable from '../components/CommonTable';
import { FixedLabel } from '../components/FixedLabel';
import FormDropdown from '../components/FormDropdown';
import ResponsiveKeyboardView from '../components/ResponsiveKeyboardView';
import { useToast } from '../components/ToastProvider';
import { usePlatformInfo } from '../hooks/usePlatformInfo';
import { useServerTable } from '../hooks/useServerTable';
import { AppTheme } from '../theme';
import { Recipient } from '../types/Recipient';
import { extractErrorMessage } from '../utils/common';
import { getAuthData } from '../utils/storage';

type CampaignOption = {
  label: string;
  value: string;
};

type CampaignSummary = {
  campaignName: string;
  id: string;
};

export default function GeneratedImagesScreen() {
  const { isWeb, isMobileWeb } = usePlatformInfo();
  const { t } = useTranslation();
  const theme = useTheme<AppTheme>();
  const styles = createStyles(theme);
  const { colors } = theme;
  const { showToast } = useToast();
  const [campaigns, setCampaigns] = useState<CampaignOption[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [progressMap, setProgressMap] = useState<Record<string, number>>({});
  const [tableParams, setTableParams] = useState<{
    campaignId: string | null;
    searchText: string;
  }>({
    campaignId: null,
    searchText: ''
  });

  const fetchCampaigns = useCallback(async () => {
    try {
      const response = await getCampaigns(0, 100000);
      const rawCampaigns = response?.data?.imageCampaigns?.items;
      const campaignsData: CampaignSummary[] = Array.isArray(rawCampaigns)
        ? rawCampaigns
        : [];

      const transformedCampaigns = campaignsData.map((campaign) => ({
        label: campaign.campaignName,
        value: campaign.id
      }));

      setCampaigns(transformedCampaigns);
      if (transformedCampaigns?.length) {
        setSelectedCampaignId((prev) => prev ?? transformedCampaigns[0]?.value);
      }
    } catch (error) {
      showToast(extractErrorMessage(error, t('image.loadImageFailMessage')), 'error');
    }
  }, [showToast, t]);

  const fetchVoters = useCallback(
    async (
      page: number,
      pageSize: number,
      params?: { campaignId?: string | null; searchText?: string }
    ) => {
      if (!params?.campaignId) return { items: [], totalCount: 0 };

      setLoading(true);
      try {
        const response = await getRecipientsByCampaignId(
          params.campaignId,
          page,
          pageSize,
          params?.searchText ?? ''
        );

        return {
          items: Array.isArray(response?.data?.items) ? response.data.items : [],
          totalCount: response?.data?.totalRecords ?? 0
        };
      } catch (error) {
        showToast(extractErrorMessage(error, t('voter.loadVoterFailMessage')), 'error');
        return { items: [], totalCount: 0 };
      } finally {
        setLoading(false);
      }
    },
    [showToast, t]
  );

  const table = useServerTable<
    Recipient,
    { campaignId: string | null; searchText: string }
  >(fetchVoters, { initialPage: 0, initialRowsPerPage: 10 }, tableParams);

  const memoizedDropdown = React.useMemo(() => {
    return (
      <>
        <FixedLabel label={t('campaign')} />
        <View style={styles.dropdownWrapper}>
          <FormDropdown
            placeholder={t('selectCampaign')}
            value={selectedCampaignId}
            options={campaigns}
            onSelect={(val) => setSelectedCampaignId(val)}
            noMargin
          />
        </View>
      </>
    );
  }, [campaigns, selectedCampaignId, styles.dropdownWrapper, t]);

  useEffect(() => {
    setTableParams((prev) => ({
      ...prev,
      campaignId: selectedCampaignId
    }));
    table.setPage(0);
  }, [selectedCampaignId, table]);

  useFocusEffect(
    useCallback(() => {
      setSelectedCampaignId(null);
      fetchCampaigns();
    }, [fetchCampaigns])
  );

  const updateRowStatus = (id: string, newStatus: Partial<Recipient>) => {
    table.setData((prev) =>
      prev.map((row) => (row.id === id ? { ...row, ...newStatus } : row))
    );
  };

  const handleSendImage = async (item: Recipient) => {
    const { userId, channelId } = await getAuthData();
    setSendingId(item.id);
    setProgressMap((prev) => ({ ...prev, [item.id]: 0 }));

    try {
      await sendImage(
        {
          channelId: channelId,
          recipientId: item.id,
          campaignID: selectedCampaignId
        },
        userId
      );
      showToast(t('image.sendSuccess'), 'success');
      updateRowStatus(item.id, { sendStatus: 'sent' });
    } catch (error) {
      showToast(extractErrorMessage(error, t('image.sendFail')), 'error');
      updateRowStatus(item.id, { sendStatus: 'pending' });
    } finally {
      setSendingId(null);
      setProgressMap((prev) => {
        const next = { ...prev };
        delete next[item.id];
        return next;
      });
    }
  };

  const columns = [
    { label: t('name'), key: 'fullName', flex: 0.8 },
    { label: t('mobile'), key: 'phoneNumber', flex: 0.4 },
    {
      label: t('createdAt'),
      key: 'createdAt',
      flex: 0.4,
      render: (item) =>
        item.createdAt ? dayjs(item.createdAt).format('DD MMM YYYY, hh:mm A') : '-'
    },
    {
      label: t('actions'),
      key: 'actions',
      flex: 1,
      smallColumn: true,
      render: (item: Recipient) => {
        const sendStatus = item?.sendStatus?.toLowerCase?.() ?? 'pending';
        const disableRowActions = sendingId !== null && sendingId !== item.id;
        const progress = progressMap[item.id];

        return (
          <View style={styles.actionCell}>
            {sendingId === item.id && progress !== undefined ? (
              <View style={styles.progressContainer}>
                <Text style={styles.progressText}>{Math.floor(progress * 100)}%</Text>
                <ProgressBar
                  progress={progress}
                  color={colors.primary}
                  style={styles.progressBar}
                />
              </View>
            ) : sendStatus === 'pending' ? (
              <IconButton
                icon={() => (
                  <FontAwesome
                    name="whatsapp"
                    size={22}
                    color={disableRowActions ? colors.mediumGray : colors.whatsappGreen}
                  />
                )}
                onPress={() => handleSendImage(item)}
                style={styles.iconButton}
                disabled={disableRowActions}
              />
            ) : (
              <IconButton
                icon={() => (
                  <FontAwesome name="check-circle" size={22} color={colors.success} />
                )}
                disabled
                style={styles.iconButton}
              />
            )}
          </View>
        );
      }
    }
  ];

  const handleVoterSearch = useCallback(
    (text: string) => {
      setTableParams((prev) => ({
        ...prev,
        searchText: text
      }));
      table.setPage(0);
    },
    [table]
  );

  return (
    <Surface style={styles.container} elevation={2}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text variant="titleLarge" style={styles.heading}>
          {t('generatedImagePageLabel')}
        </Text>
      </View>

      {isWeb && !isMobileWeb && memoizedDropdown}

      {/* Mobile top compact toolbar (contains campaign dropdown) */}
      {Platform.OS !== 'web' && (
        <View style={styles.mobileToolbar}>{memoizedDropdown}</View>
      )}

      {/* Table */}
      <ResponsiveKeyboardView>
        <View style={styles.tableWrapper}>
          <CommonTable
            data={table.data}
            columns={columns}
            loading={loading}
            emptyIcon={
              <Ionicons name="images-outline" size={48} color={colors.disabledText} />
            }
            emptyText={t('image.noData')}
            tableHeight={isWeb && !isMobileWeb ? 'calc(100vh - 345px)' : undefined}
            tableType="tableUnderDropdown"
            enableSearch
            onSearchChange={(filters) => {
              handleVoterSearch(filters.search);
            }}
            onPageChange={table.setPage}
            onRowsPerPageChange={(size) => {
              table.setRowsPerPage(size);
              table.setPage(0);
            }}
            page={table.page}
            rowsPerPage={table.rowsPerPage}
            totalCount={table.total}
          />
        </View>
      </ResponsiveKeyboardView>
    </Surface>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      padding: 16,
      flex: 1,
      backgroundColor: theme.colors.white
    },
    heading: {
      fontWeight: 'bold',
      color: theme.colors.primary
    },
    headerRow: {
      marginBottom: 12
    },
    dropdownWrapper: {
      width: 300
    },
    mobileToolbar: {
      paddingVertical: 6,
      paddingHorizontal: 2,
      marginBottom: 6
    },
    actionCell: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center'
    },
    progressContainer: {
      width: 40,
      alignItems: 'center'
    },
    progressText: {
      fontSize: 12,
      color: theme.colors.primary
    },
    progressBar: {
      width: 36,
      height: 4,
      borderRadius: 2,
      marginTop: 2
    },
    iconButton: {
      margin: 0
    },
    tableWrapper: {
      flex: 1
    }
  });
