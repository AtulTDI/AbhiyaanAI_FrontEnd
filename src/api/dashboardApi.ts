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

/**
 * Get Voter Dashboard Summary
 */
export const getVoterDashboardSummary = () =>
  axios.get(`/Dashboard/summary`, { useApiPrefix: true, useVoterBase: true });