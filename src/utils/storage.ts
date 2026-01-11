import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";

const isWeb = Platform.OS === "web";

const encrypt = (text: string) => btoa(text);
const decrypt = (text: string) => {
  try {
    return atob(text);
  } catch {
    return "";
  }
};

export type AuthData = {
  accessToken: string;
  userId: string;
  userName: string;
  userEmail: string;
  role: string;
  applicationId: string;
  applicationName?: string;
  videoCount: string;
  channelId: string;
  isProfessionalVoiceCloning: string | boolean;
};

const DEFAULT_AUTH: AuthData = {
  accessToken: "",
  userId: "",
  userName: "",
  userEmail: "",
  role: "User",
  applicationId: "",
  applicationName: "",
  videoCount: "0",
  channelId: "",
  isProfessionalVoiceCloning: false
};

export const saveAuthData = async (data: Partial<AuthData>) => {
  const finalData = { ...DEFAULT_AUTH, ...data };

  if (isWeb) {
    Object.entries(finalData).forEach(([key, value]) =>
      localStorage.setItem(key, encrypt(value))
    );
  } else {
    await SecureStore.setItemAsync("accessToken", finalData.accessToken);
    await AsyncStorage.multiSet(
      Object.entries(finalData).filter(([k]) => k !== "accessToken")
    );
  }
};

export const getAuthData = async (): Promise<AuthData> => {
  if (isWeb) {
    const raw: Partial<AuthData> = {};
    Object.keys(DEFAULT_AUTH).forEach((key) => {
      const value = localStorage.getItem(key);
      raw[key as keyof AuthData] = value ? decrypt(value) : DEFAULT_AUTH[key as keyof AuthData];
    });
    return raw as AuthData;
  } else {
    const accessToken = (await SecureStore.getItemAsync("accessToken")) ?? "";
    const items = await AsyncStorage.multiGet(
      Object.keys(DEFAULT_AUTH).filter((k) => k !== "accessToken")
    );
    const data: any = { accessToken };
    items.forEach(([key, value]) => {
      data[key] = value ?? DEFAULT_AUTH[key as keyof AuthData];
    });
    return data as AuthData;
  }
};

export const clearAuthData = async () => {
  if (isWeb) {
    Object.keys(DEFAULT_AUTH).forEach((key) => localStorage.removeItem(key));
  } else {
    await SecureStore.deleteItemAsync("accessToken");
    await AsyncStorage.multiRemove(Object.keys(DEFAULT_AUTH).filter((k) => k !== "accessToken"));
  }
};
