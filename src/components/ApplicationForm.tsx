import { useEffect, useState } from "react";
import { FieldConfig } from "../types";
import { Application } from "../types/Application";
import { getSalesAgents } from "../api/salesAgentApi";
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
        const response = await getSalesAgents();
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
    },
    {
      name: "videoCount",
      label: "Video Count",
      type: "number",
      min: 5000,
      max: 100000,
      required: true,
    },
    {
      name: "salesAgent",
      label: "Sales Agent",
      type: "dropdown",
      options: salesAgentOptions,
      required: true,
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
    <DynamicForm
      fields={applicationFields}
      initialValues={{
        appName: applicationToEdit?.name || "",
        videoCount: applicationToEdit?.totalVideoCount || "5000",
        salesAgent: applicationToEdit?.salesAgent || "",
        videoGenerationRate: applicationToEdit?.videoGenerationRate || "",
      }}
      mode={mode}
      onSubmit={(data) => onCreate(data as any)}
      onCancel={() => {
        setApplicationToEdit(null);
        setShowAddApplicationView(false);
      }}
    />
  );
}
