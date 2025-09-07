import axios, { AxiosInstance } from "axios";
import { Platform } from "react-native";
import Constants from "expo-constants";
import { navigate } from "../navigation/NavigationService";
import { getAuthData, clearAuthData } from "../utils/storage";
import { triggerToast } from "../services/toastService";

declare module "axios" {
  export interface AxiosRequestConfig {
    useApiPrefix?: boolean;
    useAltBase?: boolean;
  }
}

const API_BASE = Constants.expoConfig.extra.API;
const ALT_API_BASE = Constants.expoConfig.extra.ALT_API;

const createAxiosInstance = (baseURL: string): AxiosInstance => {
  const instance = axios.create({
    baseURL,
    timeout: 60000,
  });

  // Request Interceptor
  instance.interceptors.request.use(
    async (config) => {
      const { accessToken } = (await getAuthData()) ?? {};
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }

      if (config.useApiPrefix && config.url?.startsWith("/")) {
        config.url = `/api${config.url}`;
      }

      if (config.useAltBase) {
        config.baseURL = ALT_API_BASE;
      }

      const method = config.method?.toUpperCase();

      if (["POST", "PUT", "PATCH"].includes(method)) {
        if (!(config.data && config.data.constructor && config.data.constructor.name === "FormData")) {
          config.headers["Content-Type"] = "application/json";
        }
      }

      config.headers["Accept"] = "application/json";

      if (Platform.OS !== "web") {
        console.debug(`[API][REQ] ${method} ${config.baseURL}${config.url}`);
      }

      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response Interceptor
  instance.interceptors.response.use(
    (response) => {
      if (Platform.OS !== "web") {
        console.debug(
          `[API][RES] ${response.config.method?.toUpperCase()} ${response.config.baseURL}${response.config.url}` +
          ` | Status=${response.status}`
        );
      }
      return response;
    },
    async (error) => {
      const status = error?.response?.status;
      const message = error?.response?.data;

      if (Platform.OS !== "web") {
        console.debug(
          `[API][ERR] ${error.config?.method?.toUpperCase()} ${error.config?.baseURL}${error.config?.url}` +
          (status ? ` | Status=${status}` : "") +
          (message ? ` | Message=${JSON.stringify(message)}` : "")
        );
      }

      if (status === 401 && message !== "Invalid login") {
        try {
          await clearAuthData();
          triggerToast("Session expired. Please log in again.", "error");
          navigate("Login");
        } catch (e) {
          console.error("Failed to clear auth data or navigate:", e);
        }
      }

      return Promise.reject(error);
    }
  );

  return instance;
};

const axiosInstance = createAxiosInstance(API_BASE);

export default axiosInstance;