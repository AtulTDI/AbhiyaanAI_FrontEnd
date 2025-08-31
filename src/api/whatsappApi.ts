import axios from "./axiosInstance";

/**
 * Get whatsapp registration status
 */
export const getRegistrationStatus = () =>
  axios.get("/WhatsApp/getstatus", { useApiPrefix: true, useAltBase: true });


/**
 * Get whatsapp QR
 */
export const generateQr = () =>
  axios.get("/WhatsApp/getqr", { useApiPrefix: true, useAltBase: true });


/**
 * Whatsapp Logout
 */
export const whatsAppLogout = () =>
  axios.post("/WhatsApp/logout", {}, { useApiPrefix: true, useAltBase: true });


/**
 * Send video
 */
export const sendVideo = (data: any) =>
  axios.post("/WhatsApp/sendvideo", data, { useApiPrefix: true, useAltBase: true });