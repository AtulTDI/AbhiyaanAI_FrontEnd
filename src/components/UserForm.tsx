import { useEffect, useState } from "react";
import { FieldConfig, FieldType } from "../types";
import { User } from "../types/User";
import { getApplications } from "../api/applicationApi";
import DynamicForm from "./DynamicForm";
import { getItem } from "../utils/storage";

type Props = {
  mode: "create" | "edit";
  onCreate: (data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
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
  const [role, setRole] = useState<"Admin" | "User" | "SuperAdmin" | null>(
    null
  );

  useEffect(() => {
    (async () => {
      const storedRole = await getItem("role");
      if (
        storedRole === "Admin" ||
        storedRole === "SuperAdmin" ||
        storedRole === "User"
      ) {
        setRole(storedRole);
      }
    })();
  }, []);

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const response = await getApplications();
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

    if (role === "SuperAdmin") {
      fetchApplications();
    }
  }, [role]);

  const userFields: FieldConfig[] = [
    { name: "firstName", label: "First Name", type: "text", required: true },
    { name: "lastName", label: "Last Name", type: "text", required: true },
    { name: "email", label: "Email", type: "email", required: true },
    { name: "password", label: "Password", type: "password", required: true },
    { name: "phoneNumber", label: "Mobile", type: "number", required: true },
    ...(role === "SuperAdmin"
      ? [
          {
            name: "applicationId",
            label: "Application",
            type: "dropdown" as FieldType,
            options: applicationOptions,
            required: true,
          },
        ]
      : []),
    {
      name: "role",
      label: "Role",
      type: "dropdown",
      options: ["User", "Admin"],
      required: true,
    },
  ];

  return (
    <DynamicForm
      fields={userFields}
      initialValues={{
        firstName: userToEdit?.firstName || "",
        lastName: userToEdit?.lastName || "",
        email: userToEdit?.email || "",
        password: userToEdit?.password || "",
        applicationId: userToEdit?.applicationId || "",
        phoneNumber: userToEdit?.phoneNumber || "",
        role: userToEdit?.role || "User",
      }}
      mode={mode}
      onSubmit={(data) =>
        onCreate(
          data as {
            firstName: string;
            lastName: string;
            email: string;
            password: string;
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
