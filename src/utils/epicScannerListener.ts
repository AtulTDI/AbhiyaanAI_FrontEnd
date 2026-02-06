let epicScanHandler: ((epic: string) => void) | null = null;

export const setEpicScanHandler = (handler: (epic: string) => void) => {
  epicScanHandler = handler;
};

export const triggerEpicScan = (epic: string) => {
  if (epicScanHandler) epicScanHandler(epic);
};