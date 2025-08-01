import axios from "axios";
import { navigate } from "../navigation/NavigationService";
import { getAuthData, clearAuthData } from "../utils/storage";
import { triggerToast } from "../services/toastService";

const axiosInstance = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  timeout: 60000,
});


// Request interceptor to attach token and content-type
axiosInstance.interceptors.request.use(
  async (config) => {
    const { accessToken } = (await getAuthData()) ?? {};

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    // Set Content-Type only for methods that send a body
    const method = config.method?.toUpperCase();
    if (["POST", "PUT", "PATCH"].includes(config.method?.toUpperCase())) {
      config.headers["Content-Type"] = "application/json";
    }

    // Optionally set Accept for all requests
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