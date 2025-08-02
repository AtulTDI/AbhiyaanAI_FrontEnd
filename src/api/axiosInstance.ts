import axios from "axios";
import { navigate } from "../navigation/NavigationService";
import { getAuthData, clearAuthData } from "../utils/storage";
import { triggerToast } from "../services/toastService";

declare module "axios" {
  export interface AxiosRequestConfig {
    useApiPrefix?: boolean;
  }
}

const axiosInstance = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API,
  timeout: 60000,
});

// Request interceptor to attach token and content-type
axiosInstance.interceptors.request.use(
  async (config) => {
    const { accessToken } = (await getAuthData()) ?? {};

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    // Optional: Append /api if custom flag is set
    if (config.useApiPrefix && config.url?.startsWith("/")) {
      config.url = `/api${config.url}`;
    }

    const method = config.method?.toUpperCase();
    if (["POST", "PUT", "PATCH"].includes(method)) {
      config.headers["Content-Type"] = "application/json";
    }

    config.headers["Accept"] = "application/json";

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle 401
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;
    const message = error?.response?.data;

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

export default axiosInstance;