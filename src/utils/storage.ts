import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";

const isWeb = Platform.OS === "web";

// Simple base64 encoding/decoding for basic obfuscation
const encrypt = (text: string) => btoa(text);
const decrypt = (text: string) => {
  try {
    return atob(text);
  } catch {
    return "";
  }
};

type AuthData = {
  accessToken: string;
  userId: string;
  userName: string;
  role: string;
  applicationId: string;
  videoCount?: string;
};

export const saveAuthData = async (data: AuthData) => {
  const { accessToken, userId, userName, role, applicationId, videoCount } = data;

  if (isWeb) {
    localStorage.setItem("accessToken", encrypt(accessToken));
    localStorage.setItem("userId", encrypt(userId));
    localStorage.setItem("userName", encrypt(userName));
    localStorage.setItem("role", encrypt(role));
    localStorage.setItem("applicationId", encrypt(applicationId));
    localStorage.setItem("videoCount", encrypt(videoCount ?? "0"));
  } else {
    await SecureStore.setItemAsync("accessToken", accessToken);
    await AsyncStorage.multiSet([
      ["userId", userId],
      ["userName", userName],
      ["role", role],
      ["applicationId", applicationId],
      ["videoCount", videoCount ?? "0"],
    ]);
  }
};

export const getAuthData = async (): Promise<AuthData | null> => {
  if (isWeb) {
    const accessToken = localStorage.getItem("accessToken");
    const userId = localStorage.getItem("userId");
    const userName = localStorage.getItem("userName");
    const role = localStorage.getItem("role");
    const applicationId = localStorage.getItem("applicationId");
    const videoCount = localStorage.getItem("videoCount");

    if (accessToken && userName && role) {
      return {
        accessToken: decrypt(accessToken),
        userId: decrypt(userId),
        userName: decrypt(userName),
        role: decrypt(role),
        applicationId: decrypt(applicationId),
        videoCount: decrypt(videoCount || "0"),
      };
    }

    return null;
  } else {
    const accessToken = await SecureStore.getItemAsync("accessToken");
    const userId = await AsyncStorage.getItem("userId");
    const userName = await AsyncStorage.getItem("userName");
    const role = await AsyncStorage.getItem("role");
    const applicationId = await AsyncStorage.getItem("applicationId");
    const videoCount = await AsyncStorage.getItem("videoCount");

    if (accessToken && userName && role) {
      return { accessToken, userId, userName, role, applicationId, videoCount: videoCount ?? "0" };
    }

    return null;
  }
};

export const clearAuthData = async () => {
  if (isWeb) {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("userId");
    localStorage.removeItem("userName");
    localStorage.removeItem("role");
    localStorage.removeItem("applicationId");
    localStorage.removeItem("videoCount");
  } else {
    await SecureStore.deleteItemAsync("accessToken");
    await AsyncStorage.multiRemove([
      "userId",
      "userName",
      "role",
      "applicationId",
      "videoCount",
    ]);
  }
};