import { FieldConfig } from "../types";
import { Application } from "../types/Application";
import DynamicForm from "./DynamicForm";

type Props = {
  mode: "create" | "edit";
  onCreate: (data: { appName: string; videoCount: number }) => void;
  applicationToEdit: Application;
  setApplicationToEdit: (user: Application | null) => void;
  setShowAddApplicationView: (visible: boolean) => void;
};

export default function ApplicationForm({
  mode,
  onCreate,
  applicationToEdit,
  setApplicationToEdit,
  setShowAddApplicationView,
}: Props) {
  const applicationFields: FieldConfig[] = [
    { name: "appName", label: "Name", type: "text", required: true },
    {
      name: "videoCount",
      label: "Video Count",
      type: "number",
      required: true,
    },
  ];

  return (
    <DynamicForm
      fields={applicationFields}
      initialValues={{
        appName: applicationToEdit?.name || "",
        videoCount: applicationToEdit?.videoCount || "",
      }}
      mode={mode}
      onSubmit={(data) => onCreate(data as any)}
      onCancel={() => {
        setApplicationToEdit(null);
        setShowAddApplicationView(false);
      }}
    />
  );
}
