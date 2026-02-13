import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { FieldConfig } from "../types";
import { Application } from "../types/Application";
import { getDistributors } from "../api/salesAgentApi";
import DynamicForm from "./DynamicForm";
import CommonUpload from "./CommonUpload";

type Props = {
  mode: "create" | "edit";
  loading: boolean;
  onCreate: (data: { appName: string; videoCount: number }) => void;
  onVoterFileUpload: (data: any) => void;
  applicationToEdit: Application;
  setApplicationToEdit: (user: Application | null) => void;
  setShowAddApplicationView: (visible: boolean) => void;
};

export default function ApplicationForm({
  mode,
  loading,
  onCreate,
  onVoterFileUpload,
  applicationToEdit,
  setApplicationToEdit,
  setShowAddApplicationView,
}: Props) {
  const { t } = useTranslation();
  const [salesAgentOptions, setSalesAgentOptions] = useState<any[]>([]);
  const [showVoterUpload, setShowVoterUpload] = useState<string | Boolean>(
    false
  );

  useEffect(() => {
    const fetchSalesAgents = async () => {
      try {
        const response = await getDistributors(0, 100000);
        const agents = response.data.items || [];
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

  useEffect(() => {
    if (applicationToEdit) {
      setShowVoterUpload(applicationToEdit.isElection || false);
    } else {
      setShowVoterUpload(false);
    }
  }, [applicationToEdit]);

  const applicationFields: FieldConfig[] = [
    {
      name: "appName",
      label: t("name"),
      placeholder: t("placeholder.applicationNamePlaceholder"),
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
      label: applicationToEdit ? t("addVideoCount") : t("videoCount"),
      placeholder: applicationToEdit
        ? t("placeholder.addVideoCountPlaceholder")
        : t("placeholder.videoCountPlaceholder"),
      type: "number",
      min: applicationToEdit ? 0 : 100,
      max: 500000,
      required: true,
    },
    {
      name: "salesAgent",
      label: t("distributorButtonLabel"),
      placeholder: t("placeholder.selectDistributorPlaceholder"),
      type: "dropdown",
      options: salesAgentOptions,
      required: true,
      disabled: mode === "edit",
    },
    {
      name: "videoGenerationRate",
      label: t("videoRate"),
      placeholder: t("placeholder.videoRatePlaceholder"),
      type: "number",
      decimalPlaces: 2,
      min: 1,
      max: 15,
      required: true,
    },
    {
      name: "whapiVendorUid",
      label: t("application.whatsappApiVendorId"),
      placeholder: t("placeholder.whatsappApiVendorIdPlaceholder"),
      type: "text",
      required: false,
    },
    {
      name: "whapiBearerToken",
      label: t("application.whatsappApiToken"),
      placeholder: t("placeholder.whatsappApiTokenPlaceholder"),
      type: "text",
      required: false,
    },
    {
      name: "whapiBaseUrl",
      label: t("application.whatsappApiBaseUrl"),
      placeholder: t("placeholder.whatsappApiBaseUrlPlaceholder"),
      type: "text",
      required: false,
      fullWidth: true,
    },
    {
      name: "premiumVoice",
      label: t("premiumVoice"),
      type: "checkbox",
      required: false,
    },
    {
      name: "isElection",
      label: t("electionRelated"),
      type: "checkbox",
      required: false,
    },
    {
      name: "showVideoCampaign",
      label: t("showVideoCampaign"),
      type: "checkbox",
      required: false,
    },
    {
      name: "showImageCampaign",
      label: t("showImageCampaign"),
      type: "checkbox",
      required: false,
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
        formSubmitLoading={loading}
        initialValues={{
          appName: applicationToEdit?.name || "",
          videoCount: applicationToEdit ? "0" : "100",
          salesAgent: applicationToEdit?.salesAgentId || "",
          videoGenerationRate: applicationToEdit?.videoGenerationRate || "",
          whapiVendorUid: applicationToEdit?.whapiVendorUid || "",
          whapiBearerToken: applicationToEdit?.whapiBearerToken || "",
          whapiBaseUrl: applicationToEdit?.whapiBaseUrl || "",
          premiumVoice: applicationToEdit?.premiumVoice || false,
          isElection: applicationToEdit?.isElection || false,
          showVideoCampaign: applicationToEdit?.showVideoCampaign || false,
          showImageCampaign: applicationToEdit?.showImageCampaign || false,
        }}
        mode={mode}
        onChange={(data, value) => {
          if (data.name === "isElection") {
            setShowVoterUpload(value);
          }
        }}
        onSubmit={(data) => onCreate(data as any)}
        onCancel={() => {
          setApplicationToEdit(null);
          setShowAddApplicationView(false);
        }}
      >
        {showVoterUpload && (
          <CommonUpload
            label={t("voter.uploadVoterExcel")}
            fileType="excel"
            directUpload={true}
            onUpload={(file) => onVoterFileUpload(file)}
          />
        )}
      </DynamicForm>
    </KeyboardAwareScrollView>
  );
}
