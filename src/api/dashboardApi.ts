import axios from "./axiosInstance";

/**
 * Get Dashboard
 */
export const getDashboard = () =>
  axios.get(`/Dashboard/get-dashboard`, { useApiPrefix: true });
