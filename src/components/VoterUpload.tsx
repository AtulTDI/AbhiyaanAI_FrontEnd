import { uploadRecipients } from '../api/recipientApi';
import { extractErrorMessage } from '../utils/common';
import CommonUpload from './CommonUpload';
import { useToast } from './ToastProvider';
import React from 'react';
import { useTranslation } from 'react-i18next';

export default function VoterUpload({ fetchVoters, setShowAddVoterView }) {
  const { t } = useTranslation();
  const { showToast } = useToast();

  const handleUpload = async (file) => {
    try {
      await uploadRecipients(file);
      await fetchVoters();
      setShowAddVoterView(false);
    } catch (error) {
      showToast(extractErrorMessage(error, t('voter.addFailed')), 'error');
    }
  };

  return (
    <CommonUpload
      label={t('voter.uploadVoterExcel')}
      fileType="excel"
      onUpload={(file) => handleUpload(file)}
    />
  );
}
