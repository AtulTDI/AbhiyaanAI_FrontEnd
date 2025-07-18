import { FieldConfig } from "../types";
import DynamicForm from "./DynamicForm";

type Voter = {
  firstName: string;
  lastName: string;
  phoneNumber: string;
};

type Props = {
  mode: "create" | "edit";
  onCreate: (data: Voter) => void;
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
  const voterFields: FieldConfig[] = [
    { name: "firstName", label: "First name", type: "text", required: true },
    { name: "lastName", label: "Last name", type: "text", required: true },
    { name: "phoneNumber", label: "Mobile", type: "number", required: true },
  ];

  return (
    <DynamicForm
      fields={voterFields}
      initialValues={{
        firstName: voterToEdit?.firstName || "",
        lastName: voterToEdit?.lastName || "",
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
