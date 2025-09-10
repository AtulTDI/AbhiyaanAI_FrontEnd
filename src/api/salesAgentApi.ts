import axios from "./axiosInstance";
import { CreateDistributorPayload, Distributor, EditDistributorPayload, GetPaginatedDistributors } from "../types/SalesAgents";

/**
 * Get paginated distributor with optional search
 */
export const getDistributors = (pageNumber, pageSize) =>
  axios.get<GetPaginatedDistributors>(`/SalesAgent/get-distributors?page=${pageNumber + 1}&pageSize=${pageSize}`, { useApiPrefix: true });

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
