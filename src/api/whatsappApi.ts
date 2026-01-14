import axios from "./axiosInstance";

/**
 * Send video
 */
export const sendVideo = (data: any, userId) =>
  axios.post(`/WhatsApp/sendvideobywhbusiness/${userId}`, data, { useApiPrefix: true, useAltBase: true });

/**
 * Send Image
 */
export const sendImage = (data: any, userId) =>
  axios.post(`/WhatsApp/sendbusinesstemplate/${userId}`, data, { useApiPrefix: true, useAltBase: true });