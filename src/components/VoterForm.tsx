import React from "react";
import { useTranslation } from "react-i18next";
import { FieldConfig } from "../types";
import { CreateVoterPayload } from "../types/Voter";
import DynamicForm from "./DynamicForm";

type Voter = {
  fullName: string;
  phoneNumber: string;
};

type Props = {
  mode: "create" | "edit";
  onCreate: (data: CreateVoterPayload) => void;
  voterToEdit: Voter;
  setVoterToEdit: (voter: Voter | null) => void;
  setShowAddVoterView: (visible: boolean) => void;
};

export default function VoterForm({
  mode,
  onCreate,
  voterToEdit,
  setVoterToEdit,
  setShowAddVoterView,
}: Props) {
  const { t } = useTranslation();
  const voterFields: FieldConfig[] = [
    { name: "fullName", label: t("fullName"), type: "text", required: true },
    { name: "phoneNumber", label: t("mobile"), type: "number", required: true },
  ];

  return (
    <DynamicForm
      fields={voterFields}
      initialValues={{
        fullName: voterToEdit?.fullName || "",
        phoneNumber: voterToEdit?.phoneNumber || "",
      }}
      mode={mode}
      onSubmit={onCreate}
      onCancel={() => {
        setVoterToEdit(null);
        setShowAddVoterView(false);
      }}
    />
  );
}
