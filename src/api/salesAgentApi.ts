import axios from "./axiosInstance";
import { CreateDistributorPayload, Distributor, EditDistributorPayload } from "../types/SalesAgents";

/**
 * Get paginated distributor with optional search
 */
export const getDistributors = () =>
  axios.get<Distributor>("/SalesAgent/get-distributors", { useApiPrefix: true });

/**
 * Add new distributor
 */
export const createDistributor = (payload: CreateDistributorPayload) =>
  axios.post<Distributor>("/SalesAgent/register", payload, { useApiPrefix: true });

/**
 * Update distributor
 */
export const editDistributorById = (id: string, payload: EditDistributorPayload) =>
  axios.put<Distributor>(`/SalesAgent/${id}`, payload, { useApiPrefix: true });

/**
 * Delete distributor
 */
export const deleteDistributor = (id: string) =>
  axios.delete<Distributor>(`/SalesAgent/delete/${id}`, { useApiPrefix: true });
