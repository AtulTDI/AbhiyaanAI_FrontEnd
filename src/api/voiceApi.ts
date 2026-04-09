import { GetPaginatedVoices } from '../types/Voice';
import axios from './axiosInstance';

/**
 * Get paginated voices with optional search
 */
export const getVoices = (pageNumber: number, pageSize: number) =>
  axios.get<GetPaginatedVoices>(
    `/VoiceManagement/getVoices?page=${pageNumber + 1}&pageSize=${pageSize}`,
    { useApiPrefix: true }
  );

/**
 * Delete voice by ID
 */
export const deleteVoiceById = (id: string) =>
  axios.delete(`/VoiceManagement/delete/${id}`, { useApiPrefix: true });
