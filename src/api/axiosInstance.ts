import axios, { AxiosInstance } from "axios";
import Constants from 'expo-constants';
import { navigate } from "../navigation/NavigationService";
import { getAuthData, clearAuthData } from "../utils/storage";
import { triggerToast } from "../services/toastService";

declare module "axios" {
  export interface AxiosRequestConfig {
    useApiPrefix?: boolean;
    useAltBase?: boolean;
  }
}

const API_BASE = Constants.expoConfig.extra.API
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

      // Optional: Append /api if custom flag is set
      if (config.useApiPrefix && config.url?.startsWith("/")) {
        config.url = `/api${config.url}`;
      }

      // Switch to alternate base if needed
      if (config.useAltBase) {
        config.baseURL = ALT_API_BASE;
      }

      const method = config.method?.toUpperCase();
      if (["POST", "PUT", "PATCH"].includes(method)) {
        config.headers["Content-Type"] = "application/json";
      }

      config.headers["Accept"] = "application/json";

      console.log(
        `📡 [${method}] ${config.baseURL}${config.url}`,
        "Headers:",
        config.headers
      );

      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response Interceptor
  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const status = error?.response?.status;
      const message = error?.response?.data;

      console.log("=======AXIOS ERROR:=========", {
        message: error.message,
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        full: error.config?.baseURL + error.config?.url,
        status: error.response?.status,
        data: error.response?.data,
      });

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

// Create the default instance
const axiosInstance = createAxiosInstance(API_BASE);

export default axiosInstance;