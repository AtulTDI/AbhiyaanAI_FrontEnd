import axios from "./axiosInstance";

/**
 * Get whatsapp registration status
 */
export const getRegistrationStatus = (userId) =>
  axios.get(`/WhatsApp/getstatus/${userId}`, { useApiPrefix: true, useAltBase: true });


/**
 * Get whatsapp QR
 */
export const generateQr = (userId) =>
  axios.get(`/WhatsApp/getqr/${userId}`, { useApiPrefix: true, useAltBase: true });


/**
 * Whatsapp Logout
 */
export const whatsAppLogout = (userId) =>
  axios.post(`/WhatsApp/logout/${userId}`, {}, { useApiPrefix: true, useAltBase: true });


/**
 * Send video
 */
export const sendVideo = (data: any, userId) =>
  axios.post(`/WhatsApp/sendvideo/${userId}`, data, { useApiPrefix: true, useAltBase: true });