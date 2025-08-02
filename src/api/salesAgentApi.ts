import axios from "./axiosInstance";
import { CreateSalesAgentPayload, SalesAgent } from "../types/SalesAgents";

/**
 * Get paginated sales agents with optional search
 */
export const getSalesAgents = () =>
  axios.get<SalesAgent>("/SalesAgent/getsalesAgent", { useApiPrefix: true });

/**
 * Add new sales agent
 */
export const createSalesAgent = (payload: CreateSalesAgentPayload) =>
  axios.post<SalesAgent>("/SalesAgent/register", payload, { useApiPrefix: true });
