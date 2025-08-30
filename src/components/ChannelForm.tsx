import React, { useEffect, useState } from "react";
import { FieldConfig, FieldType } from "../types";
import { getActiveApplications } from "../api/applicationApi";
import DynamicForm from "./DynamicForm";

type Props = {
  onCreate: (data: { channelName: string; applicationId: string }) => void;
  setShowAddChannelView: (visible: boolean) => void;
  formSubmitLoading: boolean;
};

export default function CreateChannelForm({
  onCreate,
  setShowAddChannelView,
  formSubmitLoading,
}: Props) {
  const [applicationOptions, setApplicationOptions] = useState<any[]>([]);

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const response = await getActiveApplications();
        const apps = response.data || [];
        const appArray = Array.isArray(apps) ? apps : [apps];

        const formatted = appArray.map((app) => ({
          label: app.name,
          value: app.id,
        }));
        setApplicationOptions(formatted);
      } catch (error) {
        console.error("Failed to fetch applications", error);
      }
    };

    fetchApplications();
  }, []);

  const getChannelFields = (): FieldConfig[] => [
    {
      name: "channelName",
      label: "Channel Name",
      type: "text",
      required: true,
    },
    {
      name: "applicationId",
      label: "Application",
      type: "dropdown" as FieldType,
      options: applicationOptions,
      required: true,
    },
  ];

  return (
    <DynamicForm
      fields={getChannelFields()}
      initialValues={{
        channelName: "",
        applicationId: "",
      }}
      mode="create"
      formSubmitLoading={formSubmitLoading}
      onSubmit={(data) =>
        onCreate(
          data as {
            channelName: string;
            applicationId: string;
          }
        )
      }
      onCancel={() => {
        setShowAddChannelView(false);
      }}
    />
  );
}
