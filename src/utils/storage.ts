import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";

/* ================= PLATFORM ================= */

const isWeb = Platform.OS === "web";

/* ================= HELPERS ================= */

const encrypt = (text: string) => btoa(text);
const decrypt = (text: string) => {
  try {
    return atob(text);
  } catch {
    return "";
  }
};

const toStringSafe = (value: any): string =>
  value === null || value === undefined ? "" : String(value);

/* ================= TYPES ================= */

export type AuthData = {
  accessToken: string;
  userId: string;
  userName: string;
  userEmail: string;
  role: string;
  applicationId: string;
  applicationName: string;
  videoCount: string;
  channelId: string;
  isProfessionalVoiceCloning: boolean;
  showVideoCampaign: boolean;
  showImageCampaign: boolean;
  iselectionRelatedapp: boolean;
  candidatePhotoPath: string;
};

/* ================= DEFAULT ================= */

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
  isProfessionalVoiceCloning: false,
  showVideoCampaign: false,
  showImageCampaign: false,
  iselectionRelatedapp: false,
  candidatePhotoPath: "",
};

/* ================= SAVE ================= */

export const saveAuthData = async (data: Partial<AuthData>) => {
  const finalData: AuthData = {
    ...DEFAULT_AUTH,
    ...data,
    videoCount: toStringSafe(data.videoCount),
    isProfessionalVoiceCloning: Boolean(data.isProfessionalVoiceCloning),
    iselectionRelatedapp: Boolean(data.iselectionRelatedapp),
    showVideoCampaign: Boolean(data.showVideoCampaign),
    showImageCampaign: Boolean(data.showImageCampaign)
  };

  if (isWeb) {
    Object.entries(finalData).forEach(([key, value]) => {
      localStorage.setItem(key, encrypt(toStringSafe(value)));
    });
  } else {
    await SecureStore.setItemAsync("accessToken", finalData.accessToken);

    await AsyncStorage.multiSet(
      Object.entries(finalData)
        .filter(([k]) => k !== "accessToken")
        .map(([k, v]) => [k, toStringSafe(v)])
    );
  }
};

/* ================= GET ================= */

export const getAuthData = async (): Promise<AuthData> => {
  if (isWeb) {
    const raw: any = {};
    Object.keys(DEFAULT_AUTH).forEach((key) => {
      const value = localStorage.getItem(key);
      raw[key] = value ? decrypt(value) : DEFAULT_AUTH[key as keyof AuthData];
    });

    raw.isProfessionalVoiceCloning = raw.isProfessionalVoiceCloning === "true";
    raw.videoCount = raw.videoCount || "0";
    raw.iselectionRelatedapp = raw.iselectionRelatedapp === "true";
    raw.showVideoCampaign = raw.showVideoCampaign === "true";
    raw.showImageCampaign = raw.showImageCampaign === "true";

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

    data.isProfessionalVoiceCloning = data.isProfessionalVoiceCloning === "true";
    data.videoCount = data.videoCount || "0";
    data.iselectionRelatedapp = data.iselectionRelatedapp === "true";
    data.showVideoCampaign = data.showVideoCampaign === "true";
    data.showImageCampaign = data.showImageCampaign === "true";

    return data as AuthData;
  }
};

/* ================= CLEAR ================= */

export const clearAuthData = async () => {
  if (isWeb) {
    Object.keys(DEFAULT_AUTH).forEach((key) => localStorage.removeItem(key));
  } else {
    await SecureStore.deleteItemAsync("accessToken");
    await AsyncStorage.removeItem("SELECTED_PRINTER_MAC");
    await AsyncStorage.multiRemove(
      Object.keys(DEFAULT_AUTH).filter((k) => k !== "accessToken")
    );
  }
};

export const savePrinterMac = (mac: string) =>
  AsyncStorage.setItem("SELECTED_PRINTER_MAC", mac);

export const removePrinterMac = () =>
  AsyncStorage.removeItem("SELECTED_PRINTER_MAC");

export const getSavedPrinterMac = () =>
  AsyncStorage.getItem("SELECTED_PRINTER_MAC");