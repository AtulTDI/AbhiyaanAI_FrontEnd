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

/**
 * Send Voter Slip
 */
export const sendVoterSlip = (data: any, userId) =>
  axios.post(`/WhatsApp/send-voter-slip/${userId}`, data, { useApiPrefix: true, useAltBase: true });