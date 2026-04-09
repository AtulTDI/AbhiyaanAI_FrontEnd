import React from 'react';

import { useTranslation } from 'react-i18next';

import { uploadRecipients } from '../api/recipientApi';
import { UploadableFile } from '../types/Upload';
import { extractErrorMessage } from '../utils/common';
import CommonUpload from './CommonUpload';
import { useToast } from './ToastProvider';

type Props = {
  fetchVoters: () => Promise<void> | void;
  setShowAddVoterView: (show: boolean) => void;
};

export default function VoterUpload({ fetchVoters, setShowAddVoterView }: Props) {
  const { t } = useTranslation();
  const { showToast } = useToast();

  const handleUpload = async (file: UploadableFile) => {
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
