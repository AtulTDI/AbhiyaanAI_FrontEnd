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
 * Get voter details
 */
export const getWhatsAppVideoDetails = (userId, voterId, videoId) =>
  axios.get(`/WhatsApp/getsendingdetails/${userId}/${voterId}/${videoId}`, { useApiPrefix: true, useAltBase: true });


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

/**
 * Mark video as sent
 */
export const markVideoSent = (data: any) =>
  axios.put("/WhatsApp/markvideoassent", data, { useApiPrefix: true, useAltBase: true });

/**
 * Upload Images
 */
export const uploadImages = (data: any) =>
  axios.post("/WhatsApp/upload-images", data, {
    useApiPrefix: true, useAltBase: true
  });