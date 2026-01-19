import axios from "./axiosInstance";
import {
  VoterSurveyRequest,
  VoterSurveyResponse,
  SupportTypeColor,
  Caste,
} from "../types/Voter";

/**
 * Add Survey
 */
export const addSurvey = (payload: VoterSurveyRequest) => {
  return axios.post<{ id: string }>("/VotersSurvey/add-survey", payload, {
    useApiPrefix: true,
    useVoterBase: true,
  });
};

/**
 * Get Support Types
 */
export const getSupportTypes = () => {
  return axios.get<SupportTypeColor[]>("/VotersSurvey/support-types", {
    useApiPrefix: true,
    useVoterBase: true,
  });
};

/**
 * Get Castes
 */
export const getCastes = () => {
  return axios.get<Caste[]>("/VotersSurvey/get-castes", {
    useApiPrefix: true,
    useVoterBase: true,
  });
};

/**
 * Get Survey by Voter Id
 */
export const getSurveyByVoterId = (voterId: string) => {
  return axios.get<VoterSurveyResponse | null>(
    `/VotersSurvey/get-survey/${voterId}`,
    {
      useApiPrefix: true,
      useVoterBase: true,
    }
  );
};

/**
 * Update Survey
 */
export const updateSurvey = (surveyId: string, payload: VoterSurveyRequest) => {
  return axios.put(`/VotersSurvey/update-survey/${surveyId}`, payload, {
    useApiPrefix: true,
    useVoterBase: true,
  });
};
