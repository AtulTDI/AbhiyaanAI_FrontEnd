import axios from "axios";
import { Alert } from "react-native";
import { navigate } from "../navigation/NavigationService";
import { getItem, removeItem } from "../utils/storage";

const axiosInstance = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  timeout: 60000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to attach token
axiosInstance.interceptors.request.use(
  async (config) => {
    const token = await getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle 401
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Optionally clear token
      await removeItem("accessToken");

      // Alert and navigate to login
      Alert.alert("Session expired", "Please log in again.");
      navigate("Login");
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;