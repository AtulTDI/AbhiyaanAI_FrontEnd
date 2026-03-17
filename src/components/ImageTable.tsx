import { AppTheme } from '../theme';
import { Image } from '../types/Image';
import ApprovalToggle from './ApprovalToggle';
import CommonTable from './CommonTable';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { ResizeMode, Video as ExpoVideo } from 'expo-av';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';

type Props = {
  data: Image[];
  page: number;
  rowsPerPage: number;
  totalCount: number;
  loading?: boolean;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (size: number) => void;
  onShare: (id: string) => void;
  onUnshare: (id: string) => void;
  onEdit: (image: Image) => void;
  onDelete: (id: string) => void;
};

export default function ImageTable({
  data,
  page,
  rowsPerPage,
  totalCount,
  loading,
  onPageChange,
  onRowsPerPageChange,
  onShare,
  onUnshare,
  onEdit,
  onDelete
}: Props) {
  const { t } = useTranslation();
  const theme = useTheme<AppTheme>();
  const styles = createStyles(theme);
  const { colors } = theme;
  const [selectedVideoUri, setSelectedVideoUri] = useState<string | null>(null);

  const columns = [
    { label: t('campaign'), key: 'campaignName', flex: 0.8 },
    {
      label: t('uploadedAt'),
      key: 'createdAt',
      flex: 0.4,
      render: (item) => (
        <Text>{dayjs(item.createdAt).format('DD MMM YYYY, hh:mm A')}</Text>
      )
    },
    {
      label: t('approval'),
      key: 'isShared',
      flex: 0.4,
      render: (item) => (
        <ApprovalToggle
          isApproved={item.isShared}
          onToggle={() => (item.isShared ? onUnshare(item.id) : onShare(item.id))}
          iconSize={20}
          labelStyle={{ fontWeight: 'bold' }}
        />
      )
    },
    {
      label: t('actions'),
      key: 'actions',
      flex: 0.9,
      smallColumn: true,
      render: (item: Image) => (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 5,
            marginLeft: true
          }}
        >
          {/* Edit */}
          <TouchableOpacity onPress={() => onEdit(item)} style={{ alignItems: 'center' }}>
            <Ionicons name="pencil" size={20} color={colors.primary} />
          </TouchableOpacity>

          {/* Delete */}
          <TouchableOpacity
            onPress={() => onDelete(item.id)}
            style={{ alignItems: 'center' }}
          >
            <Ionicons name="trash-outline" size={24} color={colors.criticalError} />
          </TouchableOpacity>
        </View>
      )
    }
  ];

  return (
    <>
      <CommonTable
        data={data}
        columns={columns}
        loading={loading}
        emptyIcon={
          <Ionicons name="images-outline" size={48} color={colors.disabledText} />
        }
        emptyText={t('image.noData')}
        keyExtractor={(item) => item.id}
        page={page}
        rowsPerPage={rowsPerPage}
        totalCount={totalCount}
        onPageChange={onPageChange}
        onRowsPerPageChange={onRowsPerPageChange}
      />

      {/* Video Player Modal */}
      <Modal visible={!!selectedVideoUri} animationType="slide" transparent={false}>
        <View style={styles.fullscreenContainer}>
          {selectedVideoUri && (
            <ExpoVideo
              source={{ uri: selectedVideoUri }}
              useNativeControls
              resizeMode={ResizeMode.CONTAIN}
              shouldPlay
              style={styles.video}
            />
          )}

          <Button
            mode="contained"
            onPress={() => setSelectedVideoUri(null)}
            style={styles.closeButton}
          >
            Close
          </Button>
        </View>
      </Modal>
    </>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    actions: {
      flexDirection: 'row',
      alignItems: 'center'
    },
    fullscreenContainer: {
      flex: 1,
      backgroundColor: theme.colors.black,
      justifyContent: 'center',
      alignItems: 'center',
      paddingTop: 40
    },
    video: {
      width: '100%',
      flex: 1
    },
    closeButton: {
      margin: 16,
      alignSelf: 'center'
    }
  });
