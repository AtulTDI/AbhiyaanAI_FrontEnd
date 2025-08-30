import React, { useEffect, useState } from "react";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { FieldConfig } from "../types";
import { Application } from "../types/Application";
import { getDistributors } from "../api/userApi";
import DynamicForm from "./DynamicForm";

type Props = {
  mode: "create" | "edit";
  onCreate: (data: { appName: string; videoCount: number }) => void;
  applicationToEdit: Application;
  setApplicationToEdit: (user: Application | null) => void;
  setShowAddApplicationView: (visible: boolean) => void;
};

export default function ApplicationForm({
  mode,
  onCreate,
  applicationToEdit,
  setApplicationToEdit,
  setShowAddApplicationView,
}: Props) {
  const [salesAgentOptions, setSalesAgentOptions] = useState<any[]>([]);

  useEffect(() => {
    const fetchSalesAgents = async () => {
      try {
        const response = await getDistributors();
        const agents = response.data || [];
        const agentsArray = Array.isArray(agents) ? agents : [agents];

        const formatted = agentsArray.map((app) => ({
          label: `${app.firstName} ${app.lastName}`,
          value: app.id,
        }));
        setSalesAgentOptions(formatted);
      } catch (error) {
        console.error("Failed to fetch sales agents", error);
      }
    };

    fetchSalesAgents();
  }, []);

  const applicationFields: FieldConfig[] = [
    {
      name: "appName",
      label: "Name",
      type: "text",
      validationRules: [
        {
          test: (val: string) => val.length >= 5,
          message: "Name must be at least 5 characters long",
        },
        {
          test: (val: string) => /^[a-zA-Z_]+$/.test(val),
          message: "Name must only contain alphabets and '_'",
        },
      ],
      required: true,
      disabled: mode === "edit",
    },
    {
      name: "videoCount",
      label: applicationToEdit ? "Add Video Count" : "Video Count",
      type: "number",
      min: applicationToEdit ? 0 : 5000,
      max: 500000,
      required: true,
    },
    {
      name: "salesAgent",
      label: "Distributor",
      type: "dropdown",
      options: salesAgentOptions,
      required: true,
      disabled: mode === "edit",
    },
    {
      name: "videoGenerationRate",
      label: "Video Generation Rate",
      type: "number",
      decimalPlaces: 2,
      min: 1,
      max: 15,
      required: true,
    },
  ];

  return (
    <KeyboardAwareScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ flexGrow: 1, padding: 16 }}
      enableOnAndroid
      extraScrollHeight={20}
      keyboardShouldPersistTaps="handled"
    >
      <DynamicForm
        fields={applicationFields}
        initialValues={{
          appName: applicationToEdit?.name || "",
          videoCount: applicationToEdit ? "0" : "5000",
          salesAgent: applicationToEdit?.salesAgentId || "",
          videoGenerationRate: applicationToEdit?.videoGenerationRate || "",
        }}
        mode={mode}
        onSubmit={(data) => onCreate(data as any)}
        onCancel={() => {
          setApplicationToEdit(null);
          setShowAddApplicationView(false);
        }}
      />
    </KeyboardAwareScrollView>
  );
}
