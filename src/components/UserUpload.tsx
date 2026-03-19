import React from 'react';

import { uploadUsers } from '../api/userApi';
import { extractErrorMessage } from '../utils/common';
import CommonUpload from './CommonUpload';
import { useToast } from './ToastProvider';

export default function UserUpload({ fetchUsers, setShowAddUserView }) {
  const { showToast } = useToast();

  const handleUpload = async (file) => {
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
