import axios from './axiosInstance';

type WhatsAppPayload = Record<string, unknown>;

/**
 * Send video
 */
export const sendVideo = (data: WhatsAppPayload, userId: string) =>
  axios.post(`/WhatsApp/sendvideobywhbusiness/${userId}`, data, {
    useApiPrefix: true,
    useAltBase: true
  });

/**
 * Send Image
 */
export const sendImage = (data: WhatsAppPayload, userId: string) =>
  axios.post(`/WhatsApp/sendbusinesstemplate/${userId}`, data, {
    useApiPrefix: true,
    useAltBase: true
  });

/**
 * Send Voter Slip
 */
export const sendVoterSlip = (data: WhatsAppPayload, userId: string) =>
  axios.post(`/WhatsApp/send-voter-slip/${userId}`, data, {
    useApiPrefix: true,
    useAltBase: true
  });
