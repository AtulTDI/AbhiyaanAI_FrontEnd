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
    role: string;
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
  const getSenderFields = (): FieldConfig[] => {
    const fields: FieldConfig[] = [
      { name: "firstName", label: "First Name", type: "text", required: true },
      { name: "lastName", label: "Last Name", type: "text", required: true },
      {
        name: "phoneNumber",
        label: "Mobile",
        type: "number",
        required: true,
      },
    ];

    if (mode === "create") {
      fields.push(
        { name: "email", label: "Email", type: "email", required: true },
        {
          name: "password",
          label: "Password",
          type: "password",
          required: true,
        },
        {
          name: "role",
          label: "Role",
          type: "dropdown",
          options: ["Sender"],
          required: true,
        }
      );
    }

    return fields;
  };

  return (
    <DynamicForm
      fields={getSenderFields()}
      initialValues={{
        firstName: senderToEdit?.firstName || "",
        lastName: senderToEdit?.lastName || "",
        email: senderToEdit?.email || "",
        password: "",
        phoneNumber: senderToEdit?.phoneNumber || "",
        role: senderToEdit?.role || "Sender",
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
            role: string;
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
