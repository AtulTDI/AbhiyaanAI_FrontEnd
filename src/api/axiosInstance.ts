import axios from "axios";
import { navigate } from "../navigation/NavigationService";
import { getItem, removeItem } from "../utils/storage";
import { triggerToast } from "../services/toastService";

const axiosInstance = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  timeout: 60000,
});


// Request interceptor to attach token and content-type
axiosInstance.interceptors.request.use(
  async (config) => {
    const token = await getItem("accessToken");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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
    if (error.response?.status === 401) {
      await removeItem("accessToken");
      triggerToast("Session expired. Please log in again.", "error");
      navigate("Login");
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;