import React from "react";
import { useTranslation } from "react-i18next";
import { FieldConfig } from "../types";
import { Sender } from "../types/Sender";
import DynamicForm from "./DynamicForm";

type Props = {
  mode: "create" | "edit";
  onCreate: (data: {
    firstName: string;
    lastName: string;
    email: string;
    password?: string;
    phoneNumber: string;
  }) => void;
  senderToEdit: Sender;
  setSenderToEdit: (sender: Sender | null) => void;
  setShowAddSenderView: (visible: boolean) => void;
};

export default function SenderForm({
  mode,
  onCreate,
  senderToEdit,
  setSenderToEdit,
  setShowAddSenderView,
}: Props) {
  const { t } = useTranslation();
  const getSenderFields = (): FieldConfig[] => {
    const fields: FieldConfig[] = [
      {
        name: "firstName",
        label: t("firstName"),
        type: "text",
        required: true,
      },
      { name: "lastName", label: t("lastName"), type: "text", required: true },
      {
        name: "email",
        label: t("email"),
        type: "email",
        required: true,
        disabled: mode === "edit",
      },
      {
        name: "password",
        label: t("password"),
        type: "password",
        required: true,
        disabled: mode === "edit",
      },
      {
        name: "phoneNumber",
        label: t("mobile"),
        type: "number",
        required: true,
      },
    ];

    return fields;
  };

  return (
    <DynamicForm
      fields={getSenderFields()}
      initialValues={{
        firstName: senderToEdit?.firstName || "",
        lastName: senderToEdit?.lastName || "",
        email: senderToEdit?.email || "",
        password: mode === "edit" ? "******" : "",
        phoneNumber: senderToEdit?.phoneNumber || "",
      }}
      mode={mode}
      onSubmit={(data) =>
        onCreate(
          data as {
            firstName: string;
            lastName: string;
            email: string;
            password?: string;
            phoneNumber: string;
          }
        )
      }
      onCancel={() => {
        setSenderToEdit(null);
        setShowAddSenderView(false);
      }}
    />
  );
}
