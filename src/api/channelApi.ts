import axios from "./axiosInstance";
import { Channel, CreateChannelPayload } from "../types/Channel";

/**
 * Get all WhatsApp channels for the given application.
 */
export const getChannels = (applicationId: string) =>
  axios.get<Channel[]>(
    `/WHChannel/getchannelsbyapplication?applicationID=${applicationId}`,
    { useApiPrefix: true, useAltBase: true }
  );

/**
 * Create a new WhatsApp channel.
 */
export const createChannel = (payload: CreateChannelPayload) =>
  axios.put<CreateChannelPayload>(
    `/WHChannel/createchannel?channelName=${payload.channelName}&applicationId=${payload.applicationId}`,
    payload,
    { useApiPrefix: true, useAltBase: true }
  );

/**
 * Update WhatsApp channel settings by channel ID.
 */
export const updateChannelSetting = (id: string) =>
  axios.patch<Channel>(
    `/WHChannel/updatechannelsettings?channelId=${id}`,
    {},
    { useApiPrefix: true, useAltBase: true }
  );

/**
 * Delete a WhatsApp channel by ID.
 */
export const deleteChannelById = (id: string) =>
  axios.delete(
    `/WHChannel/${id}/deletechannel`,
    { useApiPrefix: true, useAltBase: true }
  );

/**
 * Generate QR code for a WhatsApp channel by ID.
 */
export const generateChannelQr = (id: string) =>
  axios.get(
    `/WHChannel/requestqr?channelId=${id}`,
    { useApiPrefix: true, useAltBase: true }
  );
