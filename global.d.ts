export {};

declare global {
  interface FormData {
    append(name: string, value: unknown, filename?: string): void;
  }

  interface PressableStateCallbackType {
    hovered?: boolean;
  }
}
