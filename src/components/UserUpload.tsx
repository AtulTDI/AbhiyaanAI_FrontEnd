import React from 'react';

import { uploadUsers } from '../api/userApi';
import { UploadableFile } from '../types/Upload';
import { extractErrorMessage } from '../utils/common';
import CommonUpload from './CommonUpload';
import { useToast } from './ToastProvider';

type Props = {
  fetchUsers: () => Promise<void> | void;
  setShowAddUserView: (show: boolean) => void;
};

export default function UserUpload({ fetchUsers, setShowAddUserView }: Props) {
  const { showToast } = useToast();

  const handleUpload = async (file: UploadableFile) => {
    try {
      await uploadUsers(file);
      await fetchUsers();
      setShowAddUserView(false);
    } catch (error) {
      showToast(extractErrorMessage(error, 'Failed to add user'), 'error');
    }
  };

  return (
    <CommonUpload
      label="Upload User Excel"
      fileType="excel"
      onUpload={(file) => handleUpload(file)}
    />
  );
}
