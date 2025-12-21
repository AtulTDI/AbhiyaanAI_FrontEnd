import axios from "./axiosInstance";
import { GetPaginatedVoices } from "../types/Voice";

/**
 * Get paginated voices with optional search
 */
export const getVoices = (pageNumber, pageSize) =>
  axios.get<GetPaginatedVoices>(`/VoiceManagement/getVoices?page=${pageNumber + 1}&pageSize=${pageSize}`, { useApiPrefix: true });

/**
 * Delete voice by ID
 */
export const deleteVoiceById = (id: string) =>
  axios.delete(`/VoiceManagement/delete/${id}`, { useApiPrefix: true });