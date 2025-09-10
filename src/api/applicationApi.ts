import axios from "./axiosInstance";
import {
  Application,
  CreateApplicationPayload,
  EditApplicationPayload,
  GetPaginatedApplications,
} from "../types/Application";

/**
 * Get paginated applications with optional search
 */
export const getApplications = (pageNumber, pageSize) =>
  axios.get<GetPaginatedApplications>(`/Application/all?page=${pageNumber + 1}&pageSize=${pageSize}`, { useApiPrefix: true });

/**
 * Get paginated active applications with optional search
 */
export const getActiveApplications = (pageNumber, pageSize) =>
  axios.get<GetPaginatedApplications>(`/Application/get-active-applications?page=${pageNumber + 1}&pageSize=${pageSize}`, { useApiPrefix: true });

/**
 * Add new application
 */
export const createApplication = (payload: CreateApplicationPayload) =>
  axios.post<CreateApplicationPayload>("/Application/create-app", payload, { useApiPrefix: true });


/**
 * Edit application by ID
 */
export const editApplicationById = (id: string, payload: EditApplicationPayload) =>
  axios.put<EditApplicationPayload>(`/Application/${id}`, payload, { useApiPrefix: true });


/**
 * Toggle application as active/inactive
 */
export const toggleApplication = (id: string, activeStatus: boolean) =>
  axios.put(`/Application/update-status?id=${id}&isActive=${activeStatus}`, {}, { useApiPrefix: true });

/**
 * Delete application by ID
 */
export const deleteApplicationById = (id: string) =>
  axios.delete(`/Application/${id}`, { useApiPrefix: true });
