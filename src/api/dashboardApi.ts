import axios from "./axiosInstance";

/**
 * Get Dashboard
 */
export const getDashboard = (userId) =>
  axios.get(`/Dashboard/get-dashboard/${userId}`, { useApiPrefix: true });

/**
 * Get Campaign Stats
 */
export const getCampaignStats = (userId) =>
  axios.get(`/Dashboard/getallcampaign-stats/${userId}`, { useApiPrefix: true });