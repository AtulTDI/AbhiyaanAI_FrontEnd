import axios from "./axiosInstance";
import {
  Sender,
  CreateSenderPayload,
  EditSenderPayload,
  GetPaginatedSenders,
} from "../types/Sender";

/**
 * Get paginated senders with optional search
 */
export const getSenders = (pageNumber, pageSize) =>
  axios.get<GetPaginatedSenders>(`/Sender/getusersender?page=${pageNumber + 1}&pageSize=${pageSize}`, { useApiPrefix: true });

/**
 * Get sender by ID
 */
export const getSenderByUserId = (id: string, pageNumber, pageSize) =>
  axios.get<GetPaginatedSenders>(`/Sender/getsenderbyuserid/${id}?page=${pageNumber + 1}&pageSize=${pageSize}`, { useApiPrefix: true });

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
