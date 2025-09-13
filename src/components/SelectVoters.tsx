import React, { useCallback, useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
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

  const isSelected = (id: string) => stepData[1]?.includes(id);

  const toggleSelection = (id: string) => {
    setStepData((prev) => {
      const current = prev[1] || [];
      const updated = current.includes(id)
        ? current.filter((x) => x !== id)
        : [...current, id];

      return { ...prev, 1: updated };
    });
  };

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

  useFocusEffect(
    useCallback(() => {
      table.fetchData(0, 10);
    }, [])
  );

  // 🔹 Keep parent updated with total voters count
  useEffect(() => {
    if (getTotalVotersCount) {
      getTotalVotersCount(table.total ?? 0);
    }
  }, [table.total, getTotalVotersCount]);

  useEffect(() => {
    if (getSelectedVotersCount) {
      getSelectedVotersCount(stepData[1]?.length ?? 0);
    }
  }, [stepData[1], getSelectedVotersCount]);

  const toggleSelectAll = () => {
    if (stepData[1].length === table.data.length) {
      setStepData({ ...stepData, 1: [] });
    } else {
      setStepData({ ...stepData, 1: table.data.map((v) => v.id) });
    }
  };

  const tableColumns = [
    {
      ...columns[0],
      render: (item: Voter) => (
        <Checkbox
          status={isSelected(item.id) ? "checked" : "unchecked"}
          onPress={() => toggleSelection(item.id)}
        />
      ),
      label: (
        <Checkbox
          status={
            table.data.length > 0 && stepData[1]?.length === table.data.length
              ? "checked"
              : stepData[1]?.length === 0
              ? "unchecked"
              : "indeterminate"
          }
          onPress={toggleSelectAll}
          color={colors.white}
          uncheckedColor={colors.white}
        />
      ),
    },
    ...columns.slice(1),
  ];

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
        tableHeight="calc(100vh - 365px)"
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