import { useEffect, useState } from "react";
import { FieldConfig, FieldType } from "../types";
import { User } from "../types/User";
import { getActiveApplications } from "../api/applicationApi";
import { getAuthData } from "../utils/storage";
import DynamicForm from "./DynamicForm";

type Props = {
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
  mode,
  onCreate,
  userToEdit,
  setUserToEdit,
  setShowAddUserView,
}: Props) {
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

    if (loggedInUserRole === "SuperAdmin") {
      fetchApplications();
    }
  }, [loggedInUserRole]);

  const getUserFields = (): FieldConfig[] => {
    const fields: FieldConfig[] = [
      { name: "firstName", label: "First Name", type: "text", required: true },
      { name: "lastName", label: "Last Name", type: "text", required: true },
      { name: "email", label: "Email", type: "email", required: true },
    ];

    if (mode === "create") {
      fields.push({
        name: "password",
        label: "Password",
        type: "password",
        required: true,
      });
    }

    fields.push(
      {
        name: "phoneNumber",
        label: "Mobile",
        type: "number",
        required: true,
      },
      {
        name: "role",
        label: "Role",
        type: "dropdown",
        options:
          loggedInUserRole === "SuperAdmin"
            ? ["Admin", "Sales Agent"]
            : ["User"],
        required: true,
      }
    );

    const shouldShowApplicationField =
      loggedInUserRole === "SuperAdmin" && formRole === "Admin";

    if (shouldShowApplicationField) {
      fields.push({
        name: "applicationId",
        label: "Application",
        type: "dropdown" as FieldType,
        options: applicationOptions,
        required: true,
      });
    }

    return fields;
  };

  return (
    <DynamicForm
      fields={getUserFields()}
      initialValues={{
        firstName: userToEdit?.firstName || "",
        lastName: userToEdit?.lastName || "",
        email: userToEdit?.email || "",
        password: "",
        applicationId: userToEdit?.applicationId || "",
        phoneNumber: userToEdit?.phoneNumber || "",
        role: userToEdit?.role || "User",
      }}
      mode={mode}
      onChange={(field, value) => {
        if (field.name === "role") {
          setFormRole(value);
        }
      }}
      onSubmit={(data) =>
        onCreate(
          data as {
            firstName: string;
            lastName: string;
            email: string;
            password?: string;
            phoneNumber: string;
            role: string;
          }
        )
      }
      onCancel={() => {
        setUserToEdit(null);
        setShowAddUserView(false);
      }}
    />
  );
}
