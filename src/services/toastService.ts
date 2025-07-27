let toastFn: ((message: string, type?: "success" | "error" | "warning" | "info", duration?: number) => void) | null = null;

export const registerToastTrigger = (
  fn: typeof toastFn
) => {
  toastFn = fn;
};

export const triggerToast = (
  message: string,
  type: "success" | "error" | "warning" | "info" = "info",
  duration?: number
) => {
  if (toastFn) toastFn(message, type, duration);
};
