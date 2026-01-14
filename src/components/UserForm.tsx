import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { FieldConfig, FieldType } from "../types";
import { User } from "../types/User";
import { getActiveApplications } from "../api/applicationApi";
import { getAuthData } from "../utils/storage";
import DynamicForm from "./DynamicForm";

type Props = {
  role: string;
  mode: "create" | "edit";
  onCreate: (data: {
    firstName: string;
    lastName: string;
    email: string;
    password?: string;
    phoneNumber: string;
    role: string;
  }) => void;
  userToEdit: User;
  setUserToEdit: (user: User | null) => void;
  setShowAddUserView: (visible: boolean) => void;
};

export default function UserForm({
  role,
  mode,
  onCreate,
  userToEdit,
  setUserToEdit,
  setShowAddUserView,
}: Props) {
  const { t } = useTranslation();
  const [applicationOptions, setApplicationOptions] = useState<any[]>([]);
  const [loggedInUserRole, setLoggedInUserRole] = useState<
    "Admin" | "User" | "SuperAdmin" | null
  >(null);
  const [formRole, setFormRole] = useState("");

  useEffect(() => {
    (async () => {
      const { role: storedRole } = await getAuthData();

      if (
        storedRole === "Admin" ||
        storedRole === "SuperAdmin" ||
        storedRole === "User"
      ) {
        setLoggedInUserRole(storedRole);
      }
    })();
  }, []);

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const response = await getActiveApplications(0, 100000);
        const apps = response.data.items || [];
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

    if (loggedInUserRole === "SuperAdmin" && role === "Admin") {
      fetchApplications();
    }
  }, [loggedInUserRole]);

  const getUserFields = (): FieldConfig[] => {
    const fields: FieldConfig[] = [
      {
        name: "firstName",
        label: t("firstName"),
        placeholder: t("placeholder.enterFirstName"),
        type: "text",
        required: true,
      },
      {
        name: "lastName",
        label: t("lastName"),
        placeholder: t("placeholder.enterLastName"),
        type: "text",
        required: true,
      },
      {
        name: "email",
        label: t("email"),
        placeholder: "example@domain.com",
        type: "email",
        required: true,
        disabled: mode === "edit",
      },
      {
        name: "password",
        label: t("password"),
        placeholder: t("placeholder.passwordHint"),
        type: "password",
        required: true,
        disabled: mode === "edit",
      },
      {
        name: "phoneNumber",
        label: t("mobile"),
        placeholder: t("placeholder.mobileHint"),
        type: "number",
        required: true,
      },
    ];

    const shouldShowApplicationField =
      loggedInUserRole === "SuperAdmin" && role === "Admin";

    if (shouldShowApplicationField) {
      fields.push({
        name: "applicationId",
        label: t("application.singular"),
        placeholder: t("placeholder.selectApplicationPlaceholder"),
        type: "dropdown" as FieldType,
        options: applicationOptions,
        required: true,
        disabled: mode === "edit",
      });
    }

    return fields;
  };

  return (
    <KeyboardAwareScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ flexGrow: 1, padding: 16 }}
      enableOnAndroid
      extraScrollHeight={20}
      keyboardShouldPersistTaps="handled"
    >
      <DynamicForm
        fields={getUserFields()}
        initialValues={{
          firstName: userToEdit?.firstName || "",
          lastName: userToEdit?.lastName || "",
          email: userToEdit?.email || "",
          password: mode === "edit" ? "******" : "",
          applicationId: userToEdit?.applicationId || "",
          phoneNumber: userToEdit?.phoneNumber || "",
        }}
        mode={mode}
        onChange={(field, value) => {
          if (field.name === "role") {
            setFormRole(value);
          }
        }}
        onSubmit={(data: any) =>
          onCreate({
            ...data,
            role: role ? role : "User",
          })
        }
        onCancel={() => {
          setUserToEdit(null);
          setShowAddUserView(false);
        }}
      />
    </KeyboardAwareScrollView>
  );
}
