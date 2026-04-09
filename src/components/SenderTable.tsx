import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from 'react-native-paper';

import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';

import { AppTheme } from '../theme';
import { Sender } from '../types/Sender';
import CommonTable from './CommonTable';

type Props = {
  data: Sender[];
  page: number;
  rowsPerPage: number;
  totalCount: number;
  loading: boolean;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (size: number) => void;
  onEdit: (item: Sender) => void;
  onDelete: (id: string) => void;
};

export default function SenderTable({
  data,
  page,
  rowsPerPage,
  totalCount,
  loading,
  onPageChange,
  onRowsPerPageChange,
  onEdit,
  onDelete
}: Props) {
  const { t } = useTranslation();
  const theme = useTheme<AppTheme>();
  const { colors } = theme;
  const columns = [
    {
      label: t('name'),
      key: 'fullName',
      flex: 0.5,
      render: (item: Sender) => item.firstName + ' ' + item.lastName
    },
    { label: t('mobile'), key: 'phoneNumber', flex: 0.4 },
    { label: t('email'), key: 'email', flex: 0.4 },
    {
      label: t('createdAt'),
      key: 'createdAt',
      flex: 0.4,
      render: (item: Sender) =>
        item.createdAt ? dayjs(item.createdAt).format('DD MMM YYYY, hh:mm A') : '-'
    },
    {
      label: t('actions'),
      key: 'actions',
      flex: 0.9,
      smallColumn: true,
      render: (item: Sender) => (
        <View style={styles.actions}>
          <Ionicons
            name="pencil"
            size={20}
            color={colors.primary}
            onPress={() => onEdit(item)}
          />
          <Ionicons
            name="trash-outline"
            size={20}
            color={colors.criticalError}
            onPress={() => onDelete(item.id)}
          />
        </View>
      )
    }
  ];

  return (
    <CommonTable
      data={data}
      columns={columns}
      emptyIcon={
        <Ionicons name="person-remove-outline" size={48} color={colors.disabledText} />
      }
      emptyText={t('sender.noData')}
      loading={loading}
      page={page}
      rowsPerPage={rowsPerPage}
      totalCount={totalCount}
      onPageChange={onPageChange}
      onRowsPerPageChange={onRowsPerPageChange}
    />
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5
  }
});
