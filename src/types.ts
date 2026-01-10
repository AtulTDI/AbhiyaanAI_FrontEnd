export type RootStackParamList = {
  AuthLoading: undefined;
  Login: undefined;
  App: undefined;
  Home: undefined;
  Generate: undefined;
  Processing: undefined;
  Generated: undefined;
  ResetPasswordScreen: undefined;
};

export type DrawerLabelProps = {
  color: string;
  focused: boolean;
  position?: "left" | "right";
};

export type CustomLabelProps = DrawerLabelProps & {
  label: string;
  icon: React.ReactNode;
};

export interface AuthProps {
  authError: string;
  setAuthError: (error: string) => void;
  setShowSignInPage: (show: boolean) => void;
}

export type FieldType = "text" | "email" | "password" | "number" | "textarea" | "dropdown" | "checkbox";

export type FieldConfig = {
  name: string;
  label: string;
  type: FieldType;
  min?: number;
  max?: number;
  decimalPlaces?: number,
  validationRules?: {
    test: (val: string) => boolean;
    message: string;
  }[],
  required?: boolean;
  options?: string[] | { label: string; value: string | number }[];
  disabled?: boolean;
  fullWidth?: boolean;
};

export type Thumbnail = {
  uri: string;
  mimeType: string;
  name: string;
  file?: File;
};


