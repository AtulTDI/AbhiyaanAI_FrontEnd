import axios from "./axiosInstance";
import {
  Application,
  CreateApplicationPayload,
  EditApplicationPayload,
} from "../types/Application";

/**
 * Get paginated applications with optional search
 */
export const getApplications = () =>
  axios.get<Application>("/Application/all", { useApiPrefix: true });


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
 * Delete application by ID
 */
export const deleteApplicationById = (id: string) =>
  axios.delete(`/Application/${id}`, { useApiPrefix: true });
