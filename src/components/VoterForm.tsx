import { FieldConfig } from "../types";
import DynamicForm from "./DynamicForm";

type Voter = {
  fullname: string;
  //lastName: string;
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
    { name: "fullname", label: "Full name", type: "text", required: true },
    // { name: "lastName", label: "Last name", type: "text", required: true },
    { name: "phoneNumber", label: "Mobile", type: "number", required: true },
  ];

  return (
    <DynamicForm
      fields={voterFields}
      initialValues={{
        fullName: voterToEdit?.fullname || "",
        // lastName: voterToEdit?.lastName || "",
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
