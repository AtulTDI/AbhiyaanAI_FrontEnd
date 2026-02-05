type ScanHandler = (epicId: string) => void;

let handler: ScanHandler | null = null;

export const setQrScanHandler = (fn: ScanHandler) => {
  handler = fn;
};

export const triggerQrScan = (epicId: string) => {
  if (handler) handler(epicId);
};