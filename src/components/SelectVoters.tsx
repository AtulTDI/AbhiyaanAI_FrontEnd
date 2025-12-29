import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Checkbox, useTheme } from "react-native-paper";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import CommonTable from "../components/CommonTable";
import { GetPaginatedRecipients, Recipient } from "../types/Recipient";
import { getRecipientsForProcessing } from "../api/recipientApi";
import { useFocusEffect } from "@react-navigation/native";
import { useServerTable } from "../hooks/useServerTable";
import { AppTheme } from "../theme";

export default function SelectVoters({
  stepData,
  setStepData,
  getTotalVotersCount,
  getSelectedVotersCount,
}) {
  const { t } = useTranslation();
  const theme = useTheme<AppTheme>();
  const { colors } = theme;
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");

  const columns = [
    {
      label: "",
      key: "checkbox" as const,
      flex: 0.1,
      smallColumn: true,
      render: undefined,
    },
    {
      label: t("name"),
      key: "fullName",
      flex: 1,
    },
    { label: t("mobile"), key: "phoneNumber", flex: 0.8 },
  ];

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

  const [params, setParams] = useState({
    baseVideoId: stepData[0],
    searchText: "",
  });

  useEffect(() => {
    setParams((prev) => {
      const next = { baseVideoId: stepData[0], searchText };
      if (JSON.stringify(prev) !== JSON.stringify(next)) {
        return next;
      }
      return prev;
    });
  }, [stepData[0], searchText]);

  const fetchVoters = useCallback(
    (
      page: number,
      pageSize: number,
      params?: { baseVideoId?: string; searchText?: string }
    ) => {
      const { baseVideoId, searchText } = params || {};
      setLoading(true);

      if (!baseVideoId) {
        setLoading(false);
        return Promise.resolve({ items: [], totalCount: 0 });
      }

      return getRecipientsForProcessing(
        baseVideoId,
        page,
        pageSize,
        searchText || ""
      )
        .then((response) => ({
          items: Array.isArray(response?.data?.items)
            ? response.data.items
            : [],
          totalCount: response?.data?.totalRecords ?? 0,
        }))
        .catch((error) => {
          console.error(t("voter.loadVoterFailMessage"), error);
          return { items: [], totalCount: 0 };
        })
        .finally(() => setLoading(false));
    },
    [t]
  );

  const table = useServerTable<
    GetPaginatedRecipients,
    { baseVideoId?: string; searchText?: string }
  >(fetchVoters, { initialPage: 0, initialRowsPerPage: 10 }, params);

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
      if (table.data.length === 0) {
        table.fetchData(0, 10);
      }
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
        render: (item: Recipient) => (
          <Pressable onPress={() => toggleSelection(item.id)}>
            <Checkbox status={isSelected(item.id) ? "checked" : "unchecked"} />
          </Pressable>
        )
      },
      ...columns.slice(1),
    ],
    [isSelected, headerCheckboxStatus, toggleSelection, toggleSelectAll]
  );

  const handleVoterSearch = useCallback(
    (text: string) => {
      if (text !== undefined) {
        setSearchText(text);
        table.setPage(0);
      }
    },
    [table]
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
        emptyText={t("voter.noData")}
        keyExtractor={(item) => item.id}
        enableSearch
        onSearchChange={(filters) => {
          handleVoterSearch(filters.search);
        }}
        loading={loading}
        tableWithSelection={true}
        tableType={"tableUnderStepper"}
        tableHeight={"calc(100vh - 360px)"}
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
