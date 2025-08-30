import React from "react";
import CommonUpload from "./CommonUpload";
import { uploadVoters } from "../api/voterApi";
import { extractErrorMessage } from "../utils/common";
import { useToast } from "./ToastProvider";

export default function VoterUpload({ fetchVoters, setShowAddVoterView }) {
  const { showToast } = useToast();

  const handleUpload = async (file) => {
    try {
      await uploadVoters(file);
      await fetchVoters();
      setShowAddVoterView(false);
    } catch (error) {
      showToast(extractErrorMessage(error, "Failed to add video"), "error");
    }
  };

  return (
    <CommonUpload
      label="Upload Voter Excel"
      fileType="excel"
      onCancel={() => setShowAddVoterView(false)}
      onUpload={(file) => handleUpload(file)}
    />
  );
}
