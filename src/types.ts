export type RootStackParamList = {
  AuthLoading: undefined;
  Login: undefined;
  App: undefined;
  Home: undefined;
  Generated: undefined;
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

export type FieldType = "text" | "email" | "password" | "number" | "textarea" | "dropdown";

export type FieldConfig = {
  name: string;
  label: string;
  type: FieldType;
  max?: number;
  decimalPlaces?: number,
  required?: boolean;
  options?: string[] | { label: string; value: string | number }[];
};

export type Thumbnail = {
  uri: string;
  mimeType: string;
  name: string;
  file?: File;
};


