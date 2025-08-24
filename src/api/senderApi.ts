import axios from "./axiosInstance";
import {
  Sender,
  CreateSenderPayload,
  EditSenderPayload,
} from "../types/Sender";

/**
 * Get paginated senders with optional search
 */
export const getSenders = () =>
  axios.get<Sender>("/Sender/getusersender", { useApiPrefix: true });

/**
 * Get sender by ID
 */
export const getSenderByUserId = (id: string) =>
  axios.get<Sender>(`/Sender/getsenderbyuserid/${id}`, { useApiPrefix: true });

/**
 * Add new sender
 */
export const createSender = (payload: CreateSenderPayload) =>
  axios.post<Sender>("/Sender/register", payload, { useApiPrefix: true });

/**
 * Activate sender
 */
export const activateSender = (id: string) =>
  axios.put<Sender>(`/Sender/activatesender/${id}`, {}, { useApiPrefix: true });

/**
 * Get sender
 */
export const getSenderVideos = () =>
  axios.get<Sender>("/Sender/getcompletedaivideoswithuserid", { useApiPrefix: true });

/**
 * Edit sender by ID
 */
export const editSenderById = (id: string, payload: EditSenderPayload) =>
  axios.put<Sender>(`/Sender/update/${id}`, payload, { useApiPrefix: true });

/**
 * Delete sender by ID
 */
export const deleteSenderById = (id: string) =>
  axios.delete(`/Sender/delete/${id}`, { useApiPrefix: true });
