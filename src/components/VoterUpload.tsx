import React from "react";
import { useTranslation } from "react-i18next";
import CommonUpload from "./CommonUpload";
import { uploadRecipients } from "../api/recipientApi";
import { extractErrorMessage } from "../utils/common";
import { useToast } from "./ToastProvider";

export default function VoterUpload({ fetchVoters, setShowAddVoterView }) {
  const { t } = useTranslation();
  const { showToast } = useToast();

  const handleUpload = async (file) => {
    try {
      await uploadRecipients(file);
      await fetchVoters();
      setShowAddVoterView(false);
    } catch (error) {
      showToast(extractErrorMessage(error, t("voter.addFailed")), "error");
    }
  };

  return (
    <CommonUpload
      label={t("voter.uploadVoterExcel")}
      fileType="excel"
      onCancel={() => setShowAddVoterView(false)}
      onUpload={(file) => handleUpload(file)}
    />
  );
}
