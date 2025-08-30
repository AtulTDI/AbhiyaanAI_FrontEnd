import React, { useState } from "react";

export default function useConfirmDialog() {
  const [visible, setVisible] = useState(false);
  const [onConfirm, setOnConfirm] = useState<() => void>(() => {});

  const showDialog = (confirmAction: () => void) => {
    setOnConfirm(() => confirmAction);
    setVisible(true);
  };

  const hideDialog = () => setVisible(false);

  return {
    visible,
    showDialog,
    hideDialog,
    onConfirm,
  };
}