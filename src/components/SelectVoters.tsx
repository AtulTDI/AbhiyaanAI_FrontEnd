import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Checkbox, useTheme } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import CommonTable from "../components/CommonTable";
import { GetPaginatedVoters, Voter } from "../types/Voter";
import { getVotersForProcessing } from "../api/voterApi";
import { useFocusEffect } from "@react-navigation/native";
import { AppTheme } from "../theme";
import { useServerTable } from "../hooks/useServerTable";

const columns = [
  {
    label: "",
    key: "checkbox" as const,
    flex: 0.1,
    smallColumn: true,
    render: undefined,
  },
  {
    label: "Name",
    key: "fullName",
    flex: 1,
  },
  { label: "Mobile", key: "phoneNumber", flex: 0.8 },
];

export default function SelectVoters({
  stepData,
  setStepData,
  getTotalVotersCount,
  getSelectedVotersCount,
}) {
  const theme = useTheme<AppTheme>();
  const { colors } = theme;
  const [loading, setLoading] = useState(false);

  const selectedIds: string[] = stepData[1] || [];

  const isSelected = (id: string) => selectedIds.includes(id);

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

  const fetchVoters = useCallback(
    (page: number, pageSize: number, baseVideoId: string | null) => {
      setLoading(true);

      if (!baseVideoId) {
        setLoading(false);
        return Promise.resolve({ items: [], totalCount: 0 });
      }

      return getVotersForProcessing(baseVideoId, page, pageSize)
        .then((response) => ({
          items: Array.isArray(response?.data?.items)
            ? response.data.items
            : [],
          totalCount: response?.data?.totalRecords ?? 0,
        }))
        .catch((error) => {
          console.error("Failed to fetch voters:", error);
          return { items: [], totalCount: 0 };
        })
        .finally(() => setLoading(false));
    },
    []
  );

  const table = useServerTable<GetPaginatedVoters, string>(
    fetchVoters,
    { initialPage: 0, initialRowsPerPage: 10 },
    stepData[0]
  );

  const toggleSelectAll = () => {
    const currentPageIds = table.data.map((v) => v.id);
    setStepData((prev) => {
      const current = prev[1] || [];
      const allSelectedOnPage =
        currentPageIds.length > 0 &&
        currentPageIds.every((id) => current.includes(id));

      if (allSelectedOnPage) {
        return {
          ...prev,
          1: current.filter((id) => !currentPageIds.includes(id)),
        };
      } else {
        const merged = Array.from(new Set([...current, ...currentPageIds]));
        return { ...prev, 1: merged };
      }
    });
  };

  useFocusEffect(
    useCallback(() => {
      table.fetchData(0, 10);
    }, [])
  );

  useEffect(() => {
    if (getTotalVotersCount) {
      getTotalVotersCount(table.total ?? 0);
    }
  }, [table.total, getTotalVotersCount]);

  useEffect(() => {
    if (getSelectedVotersCount) {
      getSelectedVotersCount(selectedIds.length ?? 0);
    }
  }, [selectedIds, getSelectedVotersCount]);

  useEffect(() => {
    if (stepData[0]) {
      table.setPage(0);
      table.setRowsPerPage(10);
      table.fetchData(0, 10);
      setStepData((prev) => ({ ...prev, 1: [] }));
    }
  }, [stepData[0]]);

  const headerCheckboxStatus = (() => {
    const currentPageIds = table.data.map((v) => v.id);
    if (currentPageIds.length === 0) return "unchecked";
    const allSelected = currentPageIds.every((id) => selectedIds.includes(id));
    const someSelected = currentPageIds.some((id) => selectedIds.includes(id));
    return allSelected
      ? "checked"
      : someSelected
      ? "indeterminate"
      : "unchecked";
  })();

  const tableColumns = useMemo(
    () => [
      {
        ...columns[0],
        render: (item: Voter) => (
          <Pressable onPress={() => toggleSelection(item.id)}>
            <Checkbox status={isSelected(item.id) ? "checked" : "unchecked"} />
          </Pressable>
        ),
        label: (
          <Checkbox
            status={headerCheckboxStatus}
            onPress={toggleSelectAll}
            color={colors.white}
            uncheckedColor={colors.white}
          />
        ),
      },
      ...columns.slice(1),
    ],
    [isSelected, headerCheckboxStatus, toggleSelection, toggleSelectAll]
  );

  return (
    <View style={styles.container}>
      <CommonTable
        data={table.data}
        columns={tableColumns}
        emptyIcon={
          <Ionicons
            name="people-outline"
            size={48}
            color={colors.disabledText}
          />
        }
        emptyText="No voters found"
        keyExtractor={(item) => item.id}
        loading={loading}
        tableWithSelection={true}
        tableHeight="calc(100vh - 410px)"
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
    paddingTop: 8,
  },
});
