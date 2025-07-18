import { createNavigationContainerRef } from "@react-navigation/native";
import { RootStackParamList } from "../types";

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export function navigate<Name extends keyof RootStackParamList>(
  name: Name,
  params?: RootStackParamList[Name]
) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name, params);
  }
}