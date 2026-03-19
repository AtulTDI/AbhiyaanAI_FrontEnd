import { getRecipientsWithInProgressVidoes } from '../api/recipientApi';
import CommonTable from '../components/CommonTable';
import ProgressChip from '../components/ProgressChip';
import { useToast } from '../components/ToastProvider';
import {
  joinGroups,
  leaveGroups,
  onEvent,
  startConnection
} from '../services/signalrService';
import { AppTheme } from '../theme';
import { Recipient } from '../types/Recipient';
import { extractErrorMessage } from '../utils/common';
import { logger } from '../utils/logger';
import { getAuthData } from '../utils/storage';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import dayjs from 'dayjs';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { IconButton, ProgressBar, Surface, Text, useTheme } from 'react-native-paper';

type VoterStatus = 'InQueue' | 'Pending' | 'Processing' | 'Completed' | 'Failed';

export default function ProcessingVideosScreen() {
  const { t } = useTranslation();
  const theme = useTheme<AppTheme>();
  const styles = createStyles(theme);
  const { colors } = theme;
  const { showToast } = useToast();
  const [voters, setVoters] = useState<Recipient[]>([]);
  const [voterStatuses, setVoterStatuses] = useState<Record<string, VoterStatus>>({});
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const completedCount = useMemo(() => {
    return totalCount - voters.length;
  }, [totalCount, voters]);

  useEffect(() => {
    const handleProgressUpdate = (recipientId: string, status: VoterStatus) => {
      logger.log('ReceiveVideoUpdate', recipientId, status);

      setVoterStatuses((prev) => ({ ...prev, [recipientId]: status }));

      if (status === 'Completed') {
        setVoters((prev) => prev.filter((v) => v.id !== recipientId));
        leaveGroups(recipientId);
      }
    };

    onEvent('ReceiveVideoUpdate', handleProgressUpdate);
  }, []);

  const fetchVoters = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getRecipientsWithInProgressVidoes();
      const voterList = Array.isArray(response?.data) ? response.data : [];

      setVoters(voterList);
      setTotalCount(voterList.length);

      const { accessToken } = await getAuthData();
      await startConnection(accessToken);
      await joinGroups(voterList.map((v) => v.id));
    } catch (error: unknown) {
      showToast(extractErrorMessage(error, t('voter.loadVoterFailMessage')), 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast, t]);

  useFocusEffect(
    useCallback(() => {
      void fetchVoters();
    }, [fetchVoters])
  );

  const getStatusView = (status: VoterStatus) => {
    switch (status) {
      case 'InQueue':
        return (
          <View style={styles.statusRow}>
            <MaterialCommunityIcons
              name="clock-time-four-outline"
              size={16}
              color={colors.warning}
            />
            <Text style={styles.inQueueText}>{t('inQueue')}</Text>
          </View>
        );
      case 'Pending':
        return (
          <View style={styles.statusRow}>
            <MaterialCommunityIcons
              name="clock-outline"
              size={16}
              color={colors.primaryLight}
            />
            <Text style={styles.pendingText}>{t('pending')}</Text>
          </View>
        );
      case 'Processing':
        return (
          <View style={styles.progressContainer}>
            <ProgressBar
              indeterminate
              color={colors.primary}
              style={styles.progressBar}
            />
          </View>
        );
      case 'Completed':
        return (
          <View>
            <IconButton
              style={styles.completedButton}
              icon={() => (
                <Feather name="check-circle" size={20} color={colors.greenAccent} />
              )}
            />
          </View>
        );
      case 'Failed':
        return (
          <View style={styles.statusRow}>
            <Ionicons
              name="close-circle-outline"
              size={18}
              color={colors.criticalError}
            />
            <Text style={styles.failedText}>{t('failed')}</Text>
          </View>
        );
      default:
        return null;
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
      label: t('status'),
      key: 'actions',
      flex: 1,
      render: (item: Recipient) => getStatusView(voterStatuses[item.id] || 'InQueue')
    }
  ];

  return (
    <Surface style={styles.container} elevation={1}>
      <View style={styles.headerRow}>
        <Text
          variant="titleLarge"
          style={[styles.heading, { color: theme.colors.primary }]}
        >
          {t('processingVideoPageLabel')}
        </Text>
        <ProgressChip
          completedCount={totalCount === 0 ? 0 : completedCount}
          totalCount={totalCount === 0 ? 0 : totalCount}
        />
      </View>

      <CommonTable
        data={voters}
        columns={columns}
        emptyIcon={
          <Ionicons name="videocam-outline" size={48} color={colors.disabledText} />
        }
        emptyText={t('video.noData')}
        loading={loading}
      />
    </Surface>
  );
}

const createStyles = (theme: AppTheme) => ({
  container: { padding: 16, flex: 1, backgroundColor: theme.colors.white },
  heading: { fontWeight: 'bold' as const },
  headerRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 16
  },
  statusRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6
  },
  inQueueText: {
    fontSize: 12,
    color: theme.colors.warning
  },
  pendingText: {
    fontSize: 12,
    color: theme.colors.primaryLight
  },
  failedText: {
    fontSize: 12,
    color: theme.colors.criticalError
  },
  progressContainer: {
    justifyContent: 'flex-start' as const
  },
  progressBar: {
    width: 80,
    height: 8,
    borderRadius: 4
  },
  completedButton: {
    margin: 0
  }
});
