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
  axios.get<Application>("/Application/all");


/**
 * Add new application
 */
export const createApplication = (payload: CreateApplicationPayload) =>
  axios.post<CreateApplicationPayload>("/Application/create-app", payload);


/**
 * Edit application by ID
 */
export const editApplicationById = (id: string, payload: EditApplicationPayload) =>
  axios.put<EditApplicationPayload>(`/Application/${id}`, payload);

/**
 * Delete application by ID
 */
export const deleteApplicationById = (id: string) =>
  axios.delete(`/Application/${id}`);
