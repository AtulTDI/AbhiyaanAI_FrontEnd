import { Alert, Text as RNText } from "react-native";
import CommonUpload from "./CommonUpload";
import { useToast } from "./ToastProvider";
import { uploadUsers } from "../api/userApi";
import { extractErrorMessage } from "../utils/common";

export default function UserUpload({ fetchUsers, setShowAddUserView }) {
  const { showToast } = useToast();

  const handleUpload = async (file) => {
    try {
      await uploadUsers(file);
      await fetchUsers();
      setShowAddUserView(false);
    } catch (error) {
      showToast(extractErrorMessage(error, "Failed to add user"), "error");
    }
  };

  return (
    <CommonUpload
      label="Upload User Excel"
      fileType="excel"
      onCancel={() => setShowAddUserView(false)}
      onUpload={(file) => handleUpload(file)}
    />
  );
}
