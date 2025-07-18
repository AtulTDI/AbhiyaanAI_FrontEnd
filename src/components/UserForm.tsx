import { FieldConfig } from "../types";
import { User } from "../types/User";
import DynamicForm from "./DynamicForm";

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
  const userFields: FieldConfig[] = [
    { name: "firstName", label: "First Name", type: "text", required: true },
    { name: "lastName", label: "Last Name", type: "text", required: true },
    { name: "email", label: "Email", type: "email", required: true },
    { name: "password", label: "Password", type: "password", required: true },
    { name: "phoneNumber", label: "Mobile", type: "number", required: true },
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
