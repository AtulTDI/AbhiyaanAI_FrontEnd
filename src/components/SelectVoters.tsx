import { getRecipientsForProcessing } from '../api/recipientApi';
import CommonTable from '../components/CommonTable';
import { useServerTable } from '../hooks/useServerTable';
import { AppTheme } from '../theme';
import { Recipient } from '../types/Recipient';
import { logger } from '../utils/logger';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { Checkbox, useTheme } from 'react-native-paper';

export default function SelectVoters({
  stepData,
  setStepData,
  getTotalVotersCount,
  getSelectedVotersCount
}) {
  const { t } = useTranslation();
  const theme = useTheme<AppTheme>();
  const { colors } = theme;

  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');

  const baseVideoId = stepData[0];
  const selectedIds = useMemo<string[]>(
    () => (Array.isArray(stepData[1]) ? stepData[1] : []),
    [stepData]
  );
  const isSelected = useCallback((id: string) => selectedIds.includes(id), [selectedIds]);

  const toggleSelection = useCallback(
    (id: string) => {
      setStepData((prev) => {
        const current = prev[1] || [];
        return current.includes(id)
          ? { ...prev, 1: current.filter((x) => x !== id) }
          : { ...prev, 1: [...current, id] };
      });
    },
    [setStepData]
  );

  const [params, setParams] = useState({
    baseVideoId,
    searchText: ''
  });

  useEffect(() => {
    setParams((prev) => {
      const next = { baseVideoId, searchText };
      return JSON.stringify(prev) !== JSON.stringify(next) ? next : prev;
    });
  }, [baseVideoId, searchText]);

  const fetchVoters = useCallback(
    async (
      page: number,
      pageSize: number,
      params?: { baseVideoId?: string; searchText?: string }
    ) => {
      const { baseVideoId, searchText } = params || {};
      setLoading(true);

      try {
        if (!baseVideoId) {
          return { items: [], totalCount: 0 };
        }

        const response = await getRecipientsForProcessing(
          baseVideoId,
          page,
          pageSize,
          searchText || ''
        );

        return {
          items: Array.isArray(response?.data?.items) ? response.data.items : [],
          totalCount: response?.data?.totalRecords ?? 0
        };
      } catch (error) {
        logger.error(t('voter.loadVoterFailMessage'), error);
        return { items: [], totalCount: 0 };
      } finally {
        setLoading(false);
      }
    },
    [t]
  );

  // ✅ FIXED GENERIC
  const table = useServerTable<Recipient, { baseVideoId?: string; searchText?: string }>(
    fetchVoters,
    { initialPage: 0, initialRowsPerPage: 10 },
    params
  );
  const tableRef = useRef(table);
  tableRef.current = table;

  // ✅ SELECT ALL
  const toggleSelectAll = useCallback(() => {
    const currentPageIds = table.data.map((v) => v.id);

    setStepData((prev) => {
      const current = prev[1] || [];

      const allSelectedOnPage =
        currentPageIds.length > 0 && currentPageIds.every((id) => current.includes(id));

      if (allSelectedOnPage) {
        return {
          ...prev,
          1: current.filter((id) => !currentPageIds.includes(id))
        };
      }

      return {
        ...prev,
        1: Array.from(new Set([...current, ...currentPageIds]))
      };
    });
  }, [table.data, setStepData]);

  // ✅ HEADER STATUS (memoized)
  const headerCheckboxStatus = useMemo(() => {
    const currentPageIds = table.data.map((v) => v.id);

    if (currentPageIds.length === 0) return 'unchecked';

    const allSelected = currentPageIds.every((id) => selectedIds.includes(id));
    const someSelected = currentPageIds.some((id) => selectedIds.includes(id));

    return allSelected ? 'checked' : someSelected ? 'indeterminate' : 'unchecked';
  }, [table.data, selectedIds]);

  useFocusEffect(
    useCallback(() => {
      if (tableRef.current.data.length === 0) {
        tableRef.current.fetchData(0, 10);
      }
    }, [])
  );

  useEffect(() => {
    getTotalVotersCount?.(table.total ?? 0);
  }, [table.total, getTotalVotersCount]);

  useEffect(() => {
    getSelectedVotersCount?.(selectedIds.length);
  }, [selectedIds, getSelectedVotersCount]);

  useEffect(() => {
    if (baseVideoId) {
      table.setPage(0);
      table.setRowsPerPage(10);
      table.fetchData(0, 10);
      setStepData((prev) => ({ ...prev, 1: [] }));
    }
  }, [baseVideoId, setStepData, table]);

  // ✅ FIXED COLUMNS (with header checkbox)
  const tableColumns = useMemo(
    () => [
      {
        label: '',
        key: 'checkbox' as const,
        flex: 0.1,
        smallColumn: true,
        headerRender: () => (
          <Checkbox status={headerCheckboxStatus} onPress={toggleSelectAll} />
        ),
        render: (item: Recipient) => (
          <Pressable onPress={() => toggleSelection(item.id)}>
            <Checkbox status={isSelected(item.id) ? 'checked' : 'unchecked'} />
          </Pressable>
        )
      },
      {
        label: t('name'),
        key: 'fullName',
        flex: 1
      },
      {
        label: t('mobile'),
        key: 'phoneNumber',
        flex: 0.8
      }
    ],
    [t, headerCheckboxStatus, toggleSelectAll, toggleSelection, isSelected]
  );

  const handleVoterSearch = useCallback(
    (text: string) => {
      setSearchText(text);
      table.setPage(0);
    },
    [table]
  );

  return (
    <View style={styles.container}>
      <CommonTable
        data={table.data}
        columns={tableColumns}
        emptyIcon={
          <Ionicons name="people-outline" size={48} color={colors.disabledText} />
        }
        emptyText={t('voter.noData')}
        keyExtractor={(item) => item.id}
        enableSearch
        onSearchChange={(filters) => handleVoterSearch(filters.search)}
        loading={loading}
        tableWithSelection
        tableType="tableUnderStepper"
        tableHeight="calc(100vh - 360px)"
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 8
  }
});
