import React, { useCallback, useState } from "react";
import { View, StyleSheet } from "react-native";
import { Button, Checkbox, useTheme } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import CommonTable from "../components/CommonTable";
import { Voter } from "../types/Voter";
import { getVoters } from "../api/voterApi";
import { extractErrorMessage } from "../utils/common";
import { useToast } from "./ToastProvider";
import { useFocusEffect } from "@react-navigation/native";
import { AppTheme } from "../theme";

const columns = [
  {
    label: "",
    key: "checkbox" as const,
    flex: 0.5,
    render: undefined,
  },
  {
    label: "Name",
    key: "fullName",
    flex: 2,
  },
  { label: "Mobile", key: "phoneNumber", flex: 1.2 },
];

export default function SelectVoters({
  stepData,
  setStepData,
  handleNext,
  setGenerationTriggered,
}) {
  const theme = useTheme<AppTheme>();
  const { colors } = theme;
  const { showToast } = useToast();
  const [voters, setVoters] = useState<Voter[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const isSelected = (id: string) => stepData[1]?.includes(id);
  const toggleSelection = (id: string) => {
    setStepData((prev) => {
      const current = prev[1] || [];
      const updated = current.includes(id)
        ? current.filter((x) => x !== id)
        : [...current, id];

      return {
        ...prev,
        1: updated,
      };
    });
  };

  const fetchVoters = useCallback(async () => {
    try {
      const response = await getVoters();
      setVoters(
        response?.data && Array.isArray(response.data) ? response.data : []
      );
    } catch (error: any) {
      showToast(extractErrorMessage(error, "Failed to load voters"), "error");
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchVoters();
    }, [fetchVoters])
  );

  const toggleSelectAll = () => {
    if (stepData[1].length === voters.length) {
      setStepData({ ...stepData, 1: [] });
    } else {
      setStepData({ ...stepData, 1: voters.map((v) => v.id) });
    }
  };

  const handleGenerate = () => {
    if (!stepData[1] || stepData[1].length === 0) {
      showToast("Please select at least one voter", "warning");
      return;
    }

    setGenerationTriggered(true);
    setIsLoading(true);

    setTimeout(() => {
      showToast("Video Generation started", "success");
      handleNext();
      setIsLoading(false);
    }, 2000);
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
            voters.length > 0 && stepData[1]?.length === voters.length
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
        data={voters}
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
        tableWithSelection={true}
      />
      <View style={styles.generateContainer}>
        <Button
          mode="contained"
          onPress={handleGenerate}
          loading={isLoading}
          disabled={!stepData[0] || stepData[1].length === 0 || isLoading}
          style={styles.btn}
        >
          {isLoading ? "Generating..." : "Generate Video"}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  generateContainer: {
    marginTop: 12,
    alignItems: "flex-end",
  },
  btn: {
    flex: 1,
    marginHorizontal: 6,
    borderRadius: 8,
  },
});
