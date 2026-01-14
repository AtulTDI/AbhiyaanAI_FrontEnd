import axios from "./axiosInstance";
import {
  DemandCategory,
  Demand,
  VoterDemandItem,
  ResolveVoterDemand
} from "../types/Voter";

/**
 * Get demand categories
 */
export const getDemandCategories = () => {
  return axios.get<DemandCategory[]>("/VotersDemand/get-demand-categories", {
    useApiPrefix: true,
    useVoterBase: true,
  });
};

/**
 * Get demands by category
 */
export const getDemandsByCategory = (categoryId: string) => {
  return axios.get<Demand[]>(
    `/VotersDemand/get-demands-by-category/${categoryId}`,
    {
      useApiPrefix: true,
      useVoterBase: true,
    }
  );
};

/**
 * Get demands
 */
export const getDemands = (params?: { categoryId?: string; text?: string }) => {
  return axios.get<Demand[]>("/VotersDemand/get-demands", {
    params,
    useApiPrefix: true,
    useVoterBase: true,
  });
};

/**
 * Add voter demands
 */
export const addVoterDemands = (
  voterId: string,
  payload: VoterDemandItem[]
) => {
  return axios.post<string>(
    `/VotersDemand/add-voter-demands/${voterId}`,
    payload,
    {
      useApiPrefix: true,
      useVoterBase: true,
    }
  );
};

/**
 * Get voter demands
 */
export const getVoterDemands = (voterId: string, isResolved?: boolean) => {
  return axios.get<VoterDemandItem[]>(
    `/VotersDemand/get-voter-demands/${voterId}`,
    {
      params: { isResolved },
      useApiPrefix: true,
      useVoterBase: true,
    }
  );
};

/**
 * Resolve voter demand
 */
export const resolveVoterDemand = (payload: ResolveVoterDemand) => {
  return axios.post<{
    message?: string;
    id: string;
    isResolved: boolean;
    resolvedAt?: string;
  }>("/VotersDemand/resolve-demand", payload, {
    useApiPrefix: true,
    useVoterBase: true,
  });
};

/**
 * Delete voter demand
 */
export const deleteVoterDemand = (demandId: string) => {
  return axios.delete(`/VotersDemand/delete-voter-demands/${demandId}`, {
    useApiPrefix: true,
    useVoterBase: true,
  });
};

